import type {
  Account,
  AssetSnapshot,
  DataMode,
  FxRate,
  Goal,
  Holding,
  ImportBatch,
  Instrument,
  LedgerTransaction,
  ManualValuation,
  MarketMood,
  MarketQuote,
  Quote,
  StrategyRule,
  Transaction,
  WealthAccount,
  WealthFxRate,
  WealthGoal,
  WealthInstrument
} from "@/types/domain";

export interface WealthRepositoryData {
  mode: DataMode;
  isAuthenticated: boolean;
  familyId?: string;
  familyName?: string;
  baseCurrency: "CNY" | "USD" | "HKD";
  accounts: Account[];
  fxRates: FxRate[];
  goal: Goal;
  holdings: Holding[];
  instruments: Instrument[];
  marketMood: MarketMood[];
  quotes: Quote[];
  snapshot: AssetSnapshot;
  strategyRules: StrategyRule[];
  transactions: Transaction[];
  operational: {
    accounts: WealthAccount[];
    instruments: WealthInstrument[];
    transactions: LedgerTransaction[];
    manualValuations: ManualValuation[];
    quotes: MarketQuote[];
    fxRates: WealthFxRate[];
    goals: WealthGoal[];
    importBatches: ImportBatch[];
    updatedAt: string;
    pendingValuationCount: number;
  };
}

export type WealthRepositoryScope = "full" | "settings" | "imports";

export interface WealthRepository {
  getData(): Promise<WealthRepositoryData>;
}
