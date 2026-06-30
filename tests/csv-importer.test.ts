import { describe, expect, it } from "vitest";
import { defaultMapping, parseCsv, validateImportRows } from "@/lib/csv/transaction-importer";

describe("csv transaction importer", () => {
  it("maps template columns and validates rows", () => {
    const parsed = parseCsv("trade_at,account,instrument_symbol,transaction_type,quantity,price,gross_amount,currency,fx_rate_to_base\n2026-06-30,券商,QQQ,buy,2,100,200,USD,7.1");
    const rows = validateImportRows({
      rows: parsed.rows,
      mapping: defaultMapping(parsed.headers),
      accounts: [{ id: "a", name: "券商", accountType: "brokerage", currency: "USD", market: "US", isActive: true, isIncludedInNetWorth: true, isIncludedInInvestableAssets: true, liquidityStatus: "liquid" }],
      instruments: [{ id: "i", symbol: "QQQ", name: "QQQ", assetType: "etf", market: "US", currency: "USD", isManualValuation: false }]
    });
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].normalized?.grossAmount).toBe(200);
  });

  it("detects missing required fields and duplicates", () => {
    const parsed = parseCsv("trade_at,account,instrument_symbol,transaction_type,quantity,gross_amount,currency\nbad,,QQQ,buy,0,200,EUR\n2026-06-30,券商,QQQ,buy,2,200,USD\n2026-06-30,券商,QQQ,buy,2,200,USD");
    const rows = validateImportRows({
      rows: parsed.rows,
      mapping: defaultMapping(parsed.headers),
      accounts: [],
      instruments: [],
      autoCreateAccounts: true,
      autoCreateInstruments: true
    });
    expect(rows[0].errors.length).toBeGreaterThan(0);
    expect(rows[2].duplicate).toBe(true);
  });
});
