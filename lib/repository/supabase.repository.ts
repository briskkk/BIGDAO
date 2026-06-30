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
import type { WealthRepository, WealthRepositoryData } from "@/lib/repository/repository.interface";
import { marketMood, strategyRules } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export class SupabaseWealthRepository implements WealthRepository {
  async getData(): Promise<WealthRepositoryData> {
    const supabase = (await createClient()) as any;
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

    const [accountsRes, instrumentsRes, transactionsRes, valuationsRes, quotesRes, fxRes, goalsRes, importsRes] = await Promise.all([
      supabase.from("accounts").select("*").eq("family_id", familyId).is("deleted_at", null).order("created_at"),
      supabase.from("instruments").select("*").eq("family_id", familyId).is("deleted_at", null).order("created_at"),
      supabase.from("transactions").select("*").eq("family_id", familyId).order("trade_at", { ascending: false }),
      supabase.from("manual_valuations").select("*").eq("family_id", familyId).order("valuation_date", { ascending: false }),
      supabase.from("quotes").select("*").order("quote_time", { ascending: false }),
      supabase.from("fx_rates").select("*").order("quote_time", { ascending: false }),
      supabase.from("goals").select("*").eq("family_id", familyId).is("deleted_at", null).order("created_at"),
      supabase.from("import_batches").select("*").eq("family_id", familyId).order("uploaded_at", { ascending: false })
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

    return {
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
    };
  }
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
