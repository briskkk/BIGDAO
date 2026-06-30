import { describe, expect, it } from "vitest";
import { calculateLedger } from "@/lib/domain/ledger-calculator";
import { buildPortfolioState } from "@/lib/domain/portfolio-calculator";
import { calculateGoalStatus } from "@/lib/domain/goal-calculator";
import type { LedgerTransaction, ManualValuation, MarketQuote, WealthAccount, WealthFxRate, WealthGoal, WealthInstrument } from "@/types/domain";

const accounts: WealthAccount[] = [
  { id: "broker", name: "券商", accountType: "brokerage", currency: "USD", market: "US", isActive: true, isIncludedInNetWorth: true, isIncludedInInvestableAssets: true, liquidityStatus: "liquid" },
  { id: "home-account", name: "房产", accountType: "property", currency: "CNY", market: "OTHER", isActive: true, isIncludedInNetWorth: true, isIncludedInInvestableAssets: false, liquidityStatus: "illiquid" },
  { id: "rsu-account", name: "公司股票", accountType: "private_equity", currency: "USD", market: "OTC", isActive: true, isIncludedInNetWorth: true, isIncludedInInvestableAssets: false, liquidityStatus: "restricted" }
];

const instruments: WealthInstrument[] = [
  { id: "qqq", symbol: "QQQ", name: "QQQ", assetType: "etf", market: "US", currency: "USD", isManualValuation: false },
  { id: "home", symbol: "HOME", name: "家庭房产", assetType: "property", market: "OTHER", currency: "CNY", isManualValuation: true },
  { id: "private", symbol: "PRIVATE", name: "内部股票", assetType: "private_equity", market: "OTC", currency: "USD", isManualValuation: true },
  { id: "pending", symbol: "PENDING", name: "待估值资产", assetType: "stock", market: "US", currency: "USD", isManualValuation: false }
];

const fxRates: WealthFxRate[] = [
  { baseCurrency: "USD", quoteCurrency: "CNY", rate: 7, quoteTime: "2026-06-30T00:00:00Z", source: "test" },
  { baseCurrency: "CNY", quoteCurrency: "CNY", rate: 1, quoteTime: "2026-06-30T00:00:00Z", source: "test" }
];

function tx(partial: Partial<LedgerTransaction>): LedgerTransaction {
  return {
    id: partial.id ?? crypto.randomUUID(),
    accountId: partial.accountId ?? "broker",
    instrumentId: partial.instrumentId ?? "qqq",
    transactionType: partial.transactionType ?? "buy",
    tradeAt: partial.tradeAt ?? "2026-01-01T00:00:00Z",
    quantity: partial.quantity ?? 0,
    price: partial.price ?? 0,
    grossAmount: partial.grossAmount ?? 0,
    feeAmount: partial.feeAmount ?? 0,
    taxAmount: partial.taxAmount ?? 0,
    currency: partial.currency ?? "USD",
    fxRateToBase: partial.fxRateToBase ?? 7,
    cashAmount: partial.cashAmount ?? 0,
    source: partial.source ?? "manual",
    deletedAt: partial.deletedAt
  };
}

describe("ledger and valuation calculators", () => {
  it("uses weighted average cost and sell fees for realized pnl", () => {
    const result = calculateLedger([
      tx({ id: "b1", quantity: 10, price: 10, grossAmount: 100, feeAmount: 1 }),
      tx({ id: "b2", quantity: 10, price: 20, grossAmount: 200, feeAmount: 1 }),
      tx({ id: "s1", transactionType: "sell", quantity: 5, price: 30, grossAmount: 150, feeAmount: 2 })
    ]);
    expect(result.positions[0].quantity).toBe(15);
    expect(result.positions[0].averageCost).toBeCloseTo(15.1);
    expect(result.realizedPnl).toBeCloseTo(72.5);
  });

  it("calculates cash balances and ignores soft deleted transactions", () => {
    const result = calculateLedger([
      tx({ id: "b1", quantity: 10, price: 10, grossAmount: 100, feeAmount: 1 }),
      tx({ id: "d1", transactionType: "dividend", instrumentId: undefined, grossAmount: 5 }),
      tx({ id: "deleted", quantity: 10, grossAmount: 100, deletedAt: "2026-01-03T00:00:00Z" })
    ]);
    expect(result.cashBalances[0].amount).toBe(-96);
    expect(result.positions[0].quantity).toBe(10);
  });

  it("separates net worth from investable assets and supports manual valuations", () => {
    const transactions = [
      tx({ id: "buy", quantity: 10, price: 100, grossAmount: 1000 }),
      tx({ id: "home", accountId: "home-account", instrumentId: "home", transactionType: "transfer_in", quantity: 1, price: 4_000_000, grossAmount: 4_000_000, currency: "CNY", fxRateToBase: 1 }),
      tx({ id: "rsu", accountId: "rsu-account", instrumentId: "private", transactionType: "transfer_in", quantity: 100, price: 10, grossAmount: 1000 })
    ];
    const quotes: MarketQuote[] = [{ id: "q", instrumentId: "qqq", quoteTime: "2026-06-30T00:00:00Z", price: 120, currency: "USD", source: "manual", quoteType: "manual" }];
    const manualValuations: ManualValuation[] = [
      { id: "mv1", accountId: "home-account", instrumentId: "home", valuationDate: "2026-06-30", valueAmount: 4_500_000, currency: "CNY", fxRateToBase: 1, source: "manual" },
      { id: "mv2", accountId: "rsu-account", instrumentId: "private", valuationDate: "2026-06-30", valueAmount: 2_000, currency: "USD", fxRateToBase: 7, source: "manual" }
    ];
    const state = buildPortfolioState({ accounts, instruments, transactions, quotes, manualValuations, fxRates, baseCurrency: "CNY" });
    expect(state.aggregate.netWorthBase).toBeGreaterThan(4_520_000);
    expect(state.aggregate.investableAssetsBase).toBeCloseTo(1400);
  });

  it("marks positions without quote as pending valuation", () => {
    const state = buildPortfolioState({
      accounts,
      instruments,
      transactions: [tx({ instrumentId: "pending", quantity: 1, price: 100, grossAmount: 100 })],
      quotes: [],
      manualValuations: [],
      fxRates,
      baseCurrency: "CNY"
    });
    expect(state.valuedPositions[0].valuationStatus).toBe("pending");
    expect(state.aggregate.pendingValuationCount).toBe(1);
  });

  it("calculates goal progress and forecast path", () => {
    const goal: WealthGoal = { id: "g", name: "目标", targetAmount: 1000, currency: "CNY", currentAge: 30, targetAge: 31, monthlyContribution: 10, expectedAnnualReturn: 0.05, includeAccountIds: [] };
    const status = calculateGoalStatus(goal, 500);
    expect(status.progress).toBe(0.5);
    expect(status.scenarios).toHaveLength(3);
    expect(status.requiredMonthlyContribution).toBeGreaterThan(0);
  });
});
