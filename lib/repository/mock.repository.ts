import { buildAssetSnapshot } from "@/lib/calculations";
import { accounts, fxRates, goal, holdings, instruments, marketMood, quotes, strategyRules, transactions } from "@/lib/mock-data";
import type { WealthRepository, WealthRepositoryData } from "@/lib/repository/repository.interface";

export class MockWealthRepository implements WealthRepository {
  async getData(): Promise<WealthRepositoryData> {
    const snapshot = buildAssetSnapshot({ accounts, holdings, instruments, quotes, fxRates });
    return {
      mode: "demo",
      isAuthenticated: false,
      baseCurrency: "CNY",
      accounts,
      fxRates,
      goal: { ...goal, currentAmountCny: snapshot.investableAssetsCny },
      holdings,
      instruments,
      marketMood,
      quotes,
      snapshot,
      strategyRules,
      transactions,
      operational: {
        accounts: [],
        instruments: [],
        transactions: [],
        manualValuations: [],
        quotes: [],
        fxRates: [],
        goals: [],
        importBatches: [],
        updatedAt: new Date().toISOString(),
        pendingValuationCount: 0
      }
    };
  }
}
