import { describe, expect, it } from "vitest";
import { mapAccount, mapTransaction, toLegacyAccount, toLegacyTransaction } from "@/lib/repository/mappers";

describe("repository mappers", () => {
  it("maps database account rows to domain and legacy models", () => {
    const account = mapAccount({
      id: "a",
      family_id: "f",
      name: "汇丰",
      institution: "HSBC",
      account_type: "brokerage",
      currency: "USD",
      market: "US",
      owner_name: "me",
      is_active: true,
      is_included_in_net_worth: true,
      is_included_in_investable_assets: true,
      liquidity_status: "liquid",
      notes: "note",
      created_at: "now",
      updated_at: "now",
      deleted_at: null
    });
    expect(account.accountType).toBe("brokerage");
    expect(toLegacyAccount(account).includeInInvestableGoal).toBe(true);
  });

  it("maps numeric transaction strings into numbers", () => {
    const tx = mapTransaction({
      id: "t",
      family_id: "f",
      account_id: "a",
      instrument_id: "i",
      transaction_type: "buy",
      trade_at: "2026-06-30T00:00:00Z",
      settle_at: null,
      quantity: "2",
      price: "100",
      gross_amount: "200",
      fee_amount: "1",
      tax_amount: "0",
      currency: "USD",
      fx_rate_to_base: "7",
      cash_amount: "0",
      reference_no: null,
      notes: "note",
      source: "manual",
      import_batch_id: null,
      created_by: null,
      created_at: "now",
      updated_at: "now",
      deleted_at: null
    });
    expect(tx.grossAmount).toBe(200);
    expect(toLegacyTransaction(tx).type).toBe("买入");
  });
});
