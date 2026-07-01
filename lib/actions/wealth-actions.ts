"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database.types";
import type { LedgerTransactionType } from "@/types/domain";
import { clearSupabaseRepositoryCache } from "@/lib/repository/supabase.repository";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

const refreshPaths = ["/", "/portfolio", "/assets", "/ledger", "/goals", "/settings", "/imports"];
const instrumentRequiredTypes = new Set(["buy", "sell", "subscribe", "redeem", "transfer_in", "transfer_out", "adjustment"]);

export async function createAccountAction(formData: FormData) {
  if (!hasSupabaseEnv()) return;
  const supabase = (await createClient()) as any;
  const { user, familyId } = await getUserFamily(supabase);
  const payload = {
    family_id: familyId,
    name: String(formData.get("name") ?? ""),
    institution: String(formData.get("institution") ?? ""),
    account_type: String(formData.get("accountType") ?? "other") as Database["public"]["Enums"]["account_type"],
    currency: String(formData.get("currency") ?? "CNY"),
    market: String(formData.get("market") ?? "OTHER") as Database["public"]["Enums"]["market_type"],
    owner_name: String(formData.get("ownerName") ?? ""),
    liquidity_status: String(formData.get("liquidityStatus") ?? "liquid") as Database["public"]["Enums"]["liquidity_status"],
    is_included_in_net_worth: formData.get("isIncludedInNetWorth") === "on",
    is_included_in_investable_assets: formData.get("isIncludedInInvestableAssets") === "on",
    notes: String(formData.get("notes") ?? "")
  };
  const { data, error } = await supabase.from("accounts").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  await audit(supabase, familyId, user.id, "accounts", data.id, "create", null, data);
  refresh();
}

export async function archiveAccountAction(formData: FormData) {
  if (!hasSupabaseEnv()) return;
  const id = String(formData.get("id") ?? "");
  const supabase = (await createClient()) as any;
  const { user, familyId } = await getUserFamily(supabase);
  const { data: before } = await supabase.from("accounts").select("*").eq("id", id).eq("family_id", familyId).single();
  const { data, error } = await supabase.from("accounts").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id).eq("family_id", familyId).select("*").single();
  if (error) throw new Error(error.message);
  await audit(supabase, familyId, user.id, "accounts", id, "delete", before, data);
  refresh();
}

export async function upsertTransactionAction(formData: FormData) {
  if (!hasSupabaseEnv()) return;
  const supabase = (await createClient()) as any;
  const { user, familyId } = await getUserFamily(supabase);
  const id = String(formData.get("id") ?? "");
  const payload = await transactionPayloadFromForm(supabase, formData, familyId, user.id);
  if (id) {
    const { data: before } = await supabase.from("transactions").select("*").eq("id", id).eq("family_id", familyId).single();
    const { data, error } = await supabase.from("transactions").update(payload).eq("id", id).eq("family_id", familyId).select("*").single();
    if (error) throw new Error(error.message);
    await audit(supabase, familyId, user.id, "transactions", id, "update", before, data);
  } else {
    const { data, error } = await supabase.from("transactions").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    await audit(supabase, familyId, user.id, "transactions", data.id, "create", null, data);
  }
  refresh();
}

export async function softDeleteTransactionAction(formData: FormData) {
  if (!hasSupabaseEnv()) return;
  const id = String(formData.get("id") ?? "");
  const supabase = (await createClient()) as any;
  const { user, familyId } = await getUserFamily(supabase);
  const { data: before } = await supabase.from("transactions").select("*").eq("id", id).eq("family_id", familyId).single();
  const { data, error } = await supabase.from("transactions").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("family_id", familyId).select("*").single();
  if (error) throw new Error(error.message);
  await audit(supabase, familyId, user.id, "transactions", id, "delete", before, data);
  refresh();
}

export async function importTransactionsAction(payload: {
  filename: string;
  totalRows: number;
  validRows: Array<{
    tradeAt: string;
    accountName: string;
    instrumentSymbol?: string;
    instrumentName?: string;
    transactionType: LedgerTransactionType;
    quantity: number;
    price: number;
    grossAmount: number;
    feeAmount: number;
    taxAmount: number;
    currency: "CNY" | "USD" | "HKD";
    fxRateToBase: number;
    referenceNo?: string;
    notes?: string;
  }>;
  invalidRows: number;
  duplicateRows: number;
  autoCreateAccounts: boolean;
  autoCreateInstruments: boolean;
}) {
  if (!hasSupabaseEnv()) return { ok: true, demo: true };
  const supabase = (await createClient()) as any;
  const { user, familyId } = await getUserFamily(supabase);

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      family_id: familyId,
      filename: payload.filename,
      total_rows: payload.totalRows,
      valid_rows: payload.validRows.length,
      invalid_rows: payload.invalidRows,
      duplicate_rows: payload.duplicateRows,
      status: "imported",
      imported_at: new Date().toISOString(),
      created_by: user.id,
      metadata: { autoCreateAccounts: payload.autoCreateAccounts, autoCreateInstruments: payload.autoCreateInstruments }
    })
    .select("*")
    .single();
  if (batchError) throw new Error(batchError.message);

  const { data: accounts } = await supabase.from("accounts").select("*").eq("family_id", familyId).is("deleted_at", null);
  const { data: instruments } = await supabase.from("instruments").select("*").eq("family_id", familyId).is("deleted_at", null);
  const accountByName = new Map<string, string>((accounts ?? []).map((account: any) => [String(account.name), String(account.id)]));
  const instrumentBySymbol = new Map<string, string>((instruments ?? []).map((instrument: any) => [String(instrument.symbol), String(instrument.id)]));

  const transactions: TransactionInsert[] = [];
  for (const row of payload.validRows) {
    let accountId: string | undefined = accountByName.get(row.accountName);
    if (!accountId && payload.autoCreateAccounts) {
      const { data, error } = await supabase.from("accounts").insert({ family_id: familyId, name: row.accountName, account_type: "brokerage", currency: row.currency }).select("id").single();
      if (error) throw new Error(error.message);
      accountId = data.id;
      accountByName.set(row.accountName, data.id);
    }

    let instrumentId: string | undefined = row.instrumentSymbol ? instrumentBySymbol.get(row.instrumentSymbol) : undefined;
    if (!instrumentId && row.instrumentSymbol && payload.autoCreateInstruments) {
      const { data, error } = await supabase
        .from("instruments")
        .insert({
          family_id: familyId,
          symbol: row.instrumentSymbol,
          name: row.instrumentName || row.instrumentSymbol,
          asset_type: row.transactionType === "valuation_update" ? "property" : "stock",
          market: "OTHER",
          currency: row.currency,
          is_manual_valuation: row.transactionType === "valuation_update"
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      instrumentId = data.id;
      instrumentBySymbol.set(row.instrumentSymbol, data.id);
    }

    if (!accountId) continue;
    transactions.push({
      family_id: familyId,
      account_id: accountId,
      instrument_id: instrumentId,
      transaction_type: row.transactionType,
      trade_at: new Date(row.tradeAt).toISOString(),
      quantity: String(row.quantity),
      price: String(row.price),
      gross_amount: String(row.grossAmount),
      fee_amount: String(row.feeAmount),
      tax_amount: String(row.taxAmount),
      currency: row.currency,
      fx_rate_to_base: String(row.fxRateToBase),
      cash_amount: "0",
      reference_no: row.referenceNo,
      notes: row.notes,
      source: "csv_import",
      import_batch_id: batch.id,
      created_by: user.id
    });
  }

  if (transactions.length > 0) {
    const { error } = await supabase.from("transactions").insert(transactions);
    if (error) throw new Error(error.message);
  }
  await audit(supabase, familyId, user.id, "import_batches", batch.id, "import", null, { batch, transactionCount: transactions.length });
  refresh();
  return { ok: true, batchId: batch.id, importedRows: transactions.length };
}

export async function revertImportBatchAction(formData: FormData) {
  if (!hasSupabaseEnv()) return;
  const batchId = String(formData.get("id") ?? "");
  const supabase = (await createClient()) as any;
  const { user, familyId } = await getUserFamily(supabase);
  const now = new Date().toISOString();
  const { error } = await supabase.from("transactions").update({ deleted_at: now }).eq("family_id", familyId).eq("import_batch_id", batchId);
  if (error) throw new Error(error.message);
  await supabase.from("import_batches").update({ status: "reverted" }).eq("family_id", familyId).eq("id", batchId);
  await audit(supabase, familyId, user.id, "import_batches", batchId, "delete", null, { revertedAt: now });
  refresh();
}

async function transactionPayloadFromForm(supabase: any, formData: FormData, familyId: string, userId: string): Promise<TransactionInsert> {
  const transactionType = String(formData.get("transactionType") ?? "buy") as Database["public"]["Enums"]["transaction_type"];
  const currency = String(formData.get("currency") ?? "CNY");
  const instrumentId = await resolveInstrumentId(supabase, formData, familyId, currency, transactionType);
  return {
    family_id: familyId,
    account_id: String(formData.get("accountId") ?? ""),
    instrument_id: instrumentId,
    transaction_type: transactionType,
    trade_at: new Date(String(formData.get("tradeAt") ?? new Date().toISOString())).toISOString(),
    quantity: String(formData.get("quantity") ?? "0"),
    price: String(formData.get("price") ?? "0"),
    gross_amount: String(formData.get("grossAmount") ?? "0"),
    fee_amount: String(formData.get("feeAmount") ?? "0"),
    tax_amount: String(formData.get("taxAmount") ?? "0"),
    currency,
    fx_rate_to_base: String(formData.get("fxRateToBase") ?? "1"),
    cash_amount: String(formData.get("cashAmount") ?? "0"),
    reference_no: String(formData.get("referenceNo") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    source: "manual",
    created_by: userId
  };
}

async function resolveInstrumentId(
  supabase: any,
  formData: FormData,
  familyId: string,
  currency: string,
  transactionType: Database["public"]["Enums"]["transaction_type"]
) {
  const selectedId = String(formData.get("instrumentId") || "");
  if (selectedId) return selectedId;

  const symbol = String(formData.get("instrumentSymbol") ?? "").trim();
  const name = String(formData.get("instrumentName") ?? "").trim();
  if (!symbol) {
    if (instrumentRequiredTypes.has(transactionType)) {
      throw new Error("买入、卖出、申购、赎回、转入、转出和持仓调整必须选择已有标的，或填写新标的代码。");
    }
    return null;
  }

  const { data: existing, error: existingError } = await supabase
    .from("instruments")
    .select("id")
    .eq("family_id", familyId)
    .eq("symbol", symbol)
    .eq("market", inferMarketFromCurrency(currency))
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("instruments")
    .insert({
      family_id: familyId,
      symbol,
      name: name || symbol,
      asset_type: transactionType === "valuation_update" ? "property" : "stock",
      market: inferMarketFromCurrency(currency),
      currency,
      is_manual_valuation: transactionType === "valuation_update"
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

function inferMarketFromCurrency(currency: string) {
  if (currency === "USD") return "US";
  if (currency === "HKD") return "HK";
  if (currency === "CNY") return "CN";
  return "OTHER";
}

async function getUserFamily(supabase: any) {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("family_members").select("family_id").eq("user_id", user.id).limit(1).single();
  if (error) throw new Error(error.message);
  return { user, familyId: data.family_id };
}

async function audit(
  supabase: any,
  familyId: string,
  userId: string,
  entityType: string,
  entityId: string,
  action: Database["public"]["Enums"]["audit_action"],
  beforeData: unknown,
  afterData: unknown
) {
  await supabase.from("audit_logs").insert({
    family_id: familyId,
    actor_user_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    before_data: beforeData as never,
    after_data: afterData as never
  });
}

function refresh() {
  clearSupabaseRepositoryCache();
  refreshPaths.forEach((path) => revalidatePath(path));
}
