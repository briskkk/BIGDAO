import { createClient } from "@supabase/supabase-js";
import { accounts, fxRates, goal, instruments, quotes, transactions } from "@/lib/mock-data";
import type { Database } from "@/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.SEED_USER_EMAIL;
const password = process.env.SEED_USER_PASSWORD;

if (!url || !key || !email || !password) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SEED_USER_EMAIL and SEED_USER_PASSWORD.");
}

const supabase = createClient<Database>(url!, key!) as any;

async function main() {
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) throw authError;
  const userId = auth.user.id;
  const { data: membership, error: membershipError } = await supabase.from("family_members").select("family_id").eq("user_id", userId).single();
  if (membershipError) throw membershipError;
  const familyId = membership.family_id;

  for (const account of accounts) {
    await supabase.from("accounts").upsert({
      id: account.id,
      family_id: familyId,
      name: account.name,
      institution: account.institution,
      account_type: account.id.includes("cash") ? "cash" : account.id.includes("property") ? "property" : "brokerage",
      currency: account.currencies[0],
      market: "OTHER",
      liquidity_status: account.liquidityStatus === "restricted" ? "restricted" : account.liquidityStatus === "external" ? "illiquid" : "liquid",
      is_included_in_net_worth: true,
      is_included_in_investable_assets: account.includeInInvestableGoal,
      notes: account.description
    });
  }

  for (const instrument of instruments) {
    await supabase.from("instruments").upsert({
      id: instrument.id,
      family_id: familyId,
      symbol: instrument.symbol,
      name: instrument.name,
      asset_type: instrument.assetType === "fund" ? "mutual_fund" : instrument.assetType === "company_stock" ? "private_equity" : instrument.assetType,
      market: instrument.market === "美股" ? "US" : instrument.market === "港股" ? "HK" : instrument.market === "A股" ? "CN" : instrument.market === "中国基金" ? "FUND" : "OTHER",
      currency: instrument.currency,
      is_manual_valuation: instrument.assetType === "property" || instrument.assetType === "company_stock"
    });
  }

  for (const quote of quotes) {
    const instrument = instruments.find((item) => item.id === quote.instrumentId);
    if (!instrument) continue;
    await supabase.from("quotes").insert({
      instrument_id: quote.instrumentId,
      quote_time: new Date().toISOString(),
      price: String(quote.latestPrice),
      currency: instrument.currency,
      source: "seed",
      quote_type: instrument.priceLabel === "估值" ? "estimated_nav" : instrument.priceLabel === "盘点值" ? "manual" : "delayed"
    });
  }

  for (const rate of fxRates) {
    await supabase.from("fx_rates").insert({
      base_currency: rate.from,
      quote_currency: rate.to,
      rate: String(rate.rate),
      quote_time: new Date().toISOString(),
      source: "seed"
    });
  }

  await supabase.from("goals").update({
    name: goal.name,
    target_amount: String(goal.targetAmountCny),
    current_age: goal.currentAge,
    target_age: goal.targetAge,
    monthly_contribution: String(goal.monthlyContributionCny)
  }).eq("family_id", familyId);

  for (const tx of transactions) {
    await supabase.from("transactions").upsert({
      id: tx.id,
      family_id: familyId,
      account_id: tx.accountId,
      instrument_id: tx.instrumentId ?? null,
      transaction_type: tx.type === "买入" ? "buy" : tx.type === "申购" ? "subscribe" : tx.type === "汇兑" ? "fx_exchange" : "transfer_in",
      trade_at: new Date(tx.date).toISOString(),
      quantity: String(tx.quantity ?? 0),
      price: String(tx.price ?? 0),
      gross_amount: String(tx.amount),
      fee_amount: String(tx.fee),
      tax_amount: "0",
      currency: tx.currency,
      fx_rate_to_base: String(tx.fxRate),
      cash_amount: "0",
      notes: tx.note,
      source: "seed",
      created_by: userId
    });
  }

  console.log(`Seeded demo data for family ${familyId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
