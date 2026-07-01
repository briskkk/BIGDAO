import { describe, expect, it } from "vitest";
import { defaultMapping, parseCsv, validateImportRows } from "@/lib/csv/transaction-importer";
import { buildPortfolioState } from "@/lib/domain/portfolio-calculator";
import { calculateGoalStatus } from "@/lib/domain/goal-calculator";
import type { LedgerTransaction, MarketQuote, WealthAccount, WealthFxRate, WealthGoal, WealthInstrument } from "@/types/domain";

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

  it("turns imported csv rows into transactions, holdings and goal progress", () => {
    const account: WealthAccount = { id: "broker", name: "券商", accountType: "brokerage", currency: "USD", market: "US", isActive: true, isIncludedInNetWorth: true, isIncludedInInvestableAssets: true, liquidityStatus: "liquid" };
    const instrument: WealthInstrument = { id: "qqq", symbol: "QQQ", name: "QQQ ETF", assetType: "etf", market: "US", currency: "USD", isManualValuation: false };
    const parsed = parseCsv(
      [
        "trade_at,account,instrument_symbol,instrument_name,transaction_type,quantity,price,gross_amount,fee_amount,tax_amount,currency,fx_rate_to_base,reference_no,notes",
        "2026-06-01,券商,QQQ,QQQ ETF,buy,10,100,1000,2,0,USD,7,CSV-1,首次导入",
        "2026-06-15,券商,QQQ,QQQ ETF,dividend,0,0,20,0,0,USD,7,CSV-2,分红"
      ].join("\n")
    );
    const validated = validateImportRows({
      rows: parsed.rows,
      mapping: defaultMapping(parsed.headers),
      accounts: [account],
      instruments: [instrument]
    });
    expect(validated.every((row) => row.errors.length === 0)).toBe(true);

    const transactions: LedgerTransaction[] = validated.map((row) => ({
      id: row.normalized!.referenceNo!,
      accountId: account.id,
      instrumentId: instrument.id,
      transactionType: row.normalized!.transactionType,
      tradeAt: new Date(row.normalized!.tradeAt).toISOString(),
      quantity: row.normalized!.quantity,
      price: row.normalized!.price,
      grossAmount: row.normalized!.grossAmount,
      feeAmount: row.normalized!.feeAmount,
      taxAmount: row.normalized!.taxAmount,
      currency: row.normalized!.currency,
      fxRateToBase: row.normalized!.fxRateToBase,
      cashAmount: 0,
      source: "csv_import",
      referenceNo: row.normalized!.referenceNo,
      notes: row.normalized!.notes
    }));
    const fxRates: WealthFxRate[] = [{ baseCurrency: "USD", quoteCurrency: "CNY", rate: 7, quoteTime: "2026-06-30T00:00:00Z", source: "test" }];
    const quotes: MarketQuote[] = [{ id: "q", instrumentId: instrument.id, quoteTime: "2026-06-30T00:00:00Z", price: 120, currency: "USD", source: "manual", quoteType: "manual" }];
    const state = buildPortfolioState({ accounts: [account], instruments: [instrument], transactions, quotes, manualValuations: [], fxRates, baseCurrency: "CNY" });
    const goal: WealthGoal = { id: "goal", name: "目标", targetAmount: 15_000_000, currency: "CNY", currentAge: 31, targetAge: 40, monthlyContribution: 30_000, expectedAnnualReturn: 0.07, includeAccountIds: [] };
    const goalStatus = calculateGoalStatus(goal, state.aggregate.investableAssetsBase);

    expect(state.positions[0].quantity).toBe(10);
    expect(state.cashBalances[0]).toEqual({ accountId: "broker", currency: "USD", amount: -982 });
    expect(state.aggregate.investableAssetsBase).toBe(8_400 - 6_874);
    expect(goalStatus.progress).toBeCloseTo(state.aggregate.investableAssetsBase / goal.targetAmount);
    expect(goalStatus.progress).toBeGreaterThan(0);
  });
});
