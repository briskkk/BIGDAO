/* eslint-disable @typescript-eslint/no-explicit-any */

import { redirect } from "next/navigation";
import { buildPortfolioState } from "@/lib/domain/portfolio-calculator";
import {
  mapAccount,
  mapFxRate,
  mapGoal,
  mapImportBatch,
  mapInstrument,
  mapManualValuation,
  mapQuote,
  mapTransaction,
  toLegacyAccount,
  toLegacyFxRate,
  toLegacyGoal,
  toLegacyHolding,
  toLegacyInstrument,
  toLegacyQuote,
  toLegacySnapshot,
  toLegacyTransaction
} from "@/lib/repository/mappers";
import type { WealthRepository, WealthRepositoryData, WealthRepositoryScope } from "@/lib/repository/repository.interface";
import { marketMood, strategyRules } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

const CACHE_TTL_MS = 30_000;
const CACHE_VERSION = "2026-07-01-v1";
const cacheStore = new Map<string, { expiresAt: number; data: WealthRepositoryData }>();

export class SupabaseWealthRepository implements WealthRepository {
  constructor(private readonly scope: WealthRepositoryScope = "full") {}

  async getData(): Promise<WealthRepositoryData> {
    const supabase = (await createClient()) as any;
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const sessionCacheKey = session?.access_token ? `${CACHE_VERSION}:session:${session.access_token}:${this.scope}` : undefined;
    const sessionCached = sessionCacheKey ? cacheStore.get(sessionCacheKey) : undefined;
    if (sessionCached && sessionCached.expiresAt > Date.now()) return sessionCached.data;

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: memberships, error: membershipError } = await supabase
      .from("family_members")
      .select("family_id, families(id, name, base_currency)")
      .eq("user_id", user.id)
      .limit(1);
    if (membershipError) throw new Error(membershipError.message);
    const membership = memberships?.[0];
    if (!membership) redirect("/login");

    const family = Array.isArray(membership.families) ? membership.families[0] : membership.families;
    const familyId = membership.family_id;
    const baseCurrency = family?.base_currency === "USD" || family?.base_currency === "HKD" ? family.base_currency : "CNY";
    const cacheKey = sessionCacheKey ?? `${CACHE_VERSION}:${user.id}:${familyId}:${this.scope}`;
    const cached = cacheStore.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const shouldLoadLedger = this.scope === "full";
    const shouldLoadImports = this.scope === "full" || this.scope === "imports";
    const shouldLoadGoals = this.scope === "full";
    const [accountsRes, instrumentsRes, transactionsRes, valuationsRes, quotesRes, fxRes, goalsRes, importsRes] = await Promise.all([
      supabase.from("accounts").select("*").eq("family_id", familyId).is("deleted_at", null).order("created_at"),
      supabase.from("instruments").select("*").eq("family_id", familyId).is("deleted_at", null).order("created_at"),
      shouldLoadLedger ? supabase.from("transactions").select("*").eq("family_id", familyId).order("trade_at", { ascending: false }) : resolvedQuery([]),
      shouldLoadLedger ? supabase.from("manual_valuations").select("*").eq("family_id", familyId).order("valuation_date", { ascending: false }) : resolvedQuery([]),
      shouldLoadLedger ? supabase.from("quotes").select("*").order("quote_time", { ascending: false }) : resolvedQuery([]),
      shouldLoadLedger ? supabase.from("fx_rates").select("*").order("quote_time", { ascending: false }) : resolvedQuery([]),
      shouldLoadGoals ? supabase.from("goals").select("*").eq("family_id", familyId).is("deleted_at", null).order("created_at") : resolvedQuery([]),
      shouldLoadImports ? supabase.from("import_batches").select("*").eq("family_id", familyId).order("uploaded_at", { ascending: false }) : resolvedQuery([])
    ]);

    for (const res of [accountsRes, instrumentsRes, transactionsRes, valuationsRes, quotesRes, fxRes, goalsRes, importsRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const accounts = (accountsRes.data ?? []).map(mapAccount);
    const instruments = (instrumentsRes.data ?? []).map(mapInstrument);
    const ledgerTransactions = (transactionsRes.data ?? []).map(mapTransaction);
    const manualValuations = (valuationsRes.data ?? []).map(mapManualValuation);
    const marketQuotes = (quotesRes.data ?? []).map(mapQuote);
    const wealthFxRates = normalizeFxRates((fxRes.data ?? []).map(mapFxRate), baseCurrency);
    const goals = (goalsRes.data ?? []).map(mapGoal);
    const importBatches = (importsRes.data ?? []).map(mapImportBatch);
    const state = buildPortfolioState({
      accounts,
      instruments,
      transactions: ledgerTransactions,
      manualValuations,
      quotes: marketQuotes,
      fxRates: wealthFxRates,
      baseCurrency
    });

    const legacyAccounts = accounts.map(toLegacyAccount);
    const legacyInstruments = instruments.map(toLegacyInstrument);
    const legacyHoldings = state.valuedPositions.map(toLegacyHolding);
    const legacyQuotes = state.valuedPositions.map(toLegacyQuote);
    const snapshot = toLegacySnapshot(state.aggregate);

    const data = {
      mode: "supabase",
      isAuthenticated: true,
      familyId,
      familyName: family?.name ?? "家庭空间",
      baseCurrency,
      accounts: legacyAccounts,
      instruments: legacyInstruments,
      holdings: legacyHoldings,
      quotes: legacyQuotes,
      fxRates: wealthFxRates.map(toLegacyFxRate),
      goal: toLegacyGoal(goals[0], snapshot.investableAssetsCny),
      marketMood,
      snapshot,
      strategyRules,
      transactions: ledgerTransactions.map(toLegacyTransaction),
      operational: {
        accounts,
        instruments,
        transactions: ledgerTransactions,
        manualValuations,
        quotes: marketQuotes,
        fxRates: wealthFxRates,
        goals,
        importBatches,
        updatedAt: state.aggregate.updatedAt,
        pendingValuationCount: state.aggregate.pendingValuationCount
      }
    } satisfies WealthRepositoryData;
    cacheStore.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data });
    return data;
  }
}

export function clearSupabaseRepositoryCache() {
  cacheStore.clear();
}

function resolvedQuery(data: unknown[]) {
  return Promise.resolve({ data, error: null });
}

function normalizeFxRates(rates: import("@/types/domain").WealthFxRate[], baseCurrency: "CNY" | "USD" | "HKD") {
  const normalized = [...rates, { baseCurrency, quoteCurrency: baseCurrency, rate: 1, quoteTime: new Date().toISOString(), source: "system" as const }];
  if (baseCurrency === "CNY") {
    if (!normalized.some((rate) => rate.baseCurrency === "USD" && rate.quoteCurrency === "CNY")) {
      normalized.push({ baseCurrency: "USD", quoteCurrency: "CNY", rate: 7.18, quoteTime: new Date().toISOString(), source: "fallback" });
    }
    if (!normalized.some((rate) => rate.baseCurrency === "HKD" && rate.quoteCurrency === "CNY")) {
      normalized.push({ baseCurrency: "HKD", quoteCurrency: "CNY", rate: 0.92, quoteTime: new Date().toISOString(), source: "fallback" });
    }
  }
  return normalized;
}
