export type Currency = "CNY" | "USD" | "HKD";

export type AssetType =
  | "cash"
  | "fund"
  | "etf"
  | "stock"
  | "gold"
  | "property"
  | "company_stock";

export type Market =
  | "A股"
  | "港股"
  | "美股"
  | "中国基金"
  | "黄金"
  | "现金"
  | "其他";

export type LiquidityStatus =
  | "tradable"
  | "locked"
  | "restricted"
  | "external";

export interface Account {
  id: string;
  name: string;
  institution: string;
  currencies: Currency[];
  liquidityStatus: LiquidityStatus;
  includeInInvestableGoal: boolean;
  description: string;
}

export interface Instrument {
  id: string;
  name: string;
  symbol: string;
  assetType: AssetType;
  market: Market;
  currency: Currency;
  priceLabel?: "实时价格" | "估值" | "盘点值";
}

export interface Quote {
  instrumentId: string;
  latestPrice: number;
  previousClose: number;
  updatedAt: string;
}

export interface FxRate {
  from: Currency;
  to: Currency;
  rate: number;
  updatedAt: string;
}

export interface Holding {
  id: string;
  accountId: string;
  instrumentId: string;
  quantity: number;
  costPrice: number;
  thesis: string;
  riskTags: string[];
}

export type TransactionType =
  | "买入"
  | "卖出"
  | "分红"
  | "申购"
  | "赎回"
  | "转账"
  | "汇兑"
  | "手续费"
  | "资产盘点调整";

export interface Transaction {
  id: string;
  date: string;
  accountId: string;
  instrumentId?: string;
  type: TransactionType;
  quantity?: number;
  price?: number;
  amount: number;
  currency: Currency;
  fxRate: number;
  fee: number;
  note: string;
  tags: string[];
}

export interface AssetSnapshot {
  netWorthCny: number;
  investableAssetsCny: number;
  totalCostCny: number;
  cumulativePnlCny: number;
  dailyPnlCny: number;
  byAssetType: AllocationSlice[];
  byMarket: AllocationSlice[];
}

export interface AllocationSlice {
  key: string;
  label: string;
  valueCny: number;
  ratio: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmountCny: number;
  currentAge: number;
  targetAge: number;
  monthlyContributionCny: number;
  currentAmountCny: number;
}

export interface GoalScenario {
  name: "保守" | "基准" | "乐观";
  annualReturn: number;
  points: GoalScenarioPoint[];
}

export interface GoalScenarioPoint {
  year: number;
  amountCny: number;
}

export type InsightType = "机会" | "风险" | "再平衡" | "目标偏离" | "数据提醒";
export type InsightPriority = "高" | "中" | "低";

export interface StrategyRule {
  id: string;
  title: string;
  type: InsightType;
  priority: InsightPriority;
  evaluate: "allocation_range" | "single_position" | "restricted_stock" | "cash_buffer" | "goal_gap";
}

export interface Insight {
  id: string;
  title: string;
  type: InsightType;
  priority: InsightPriority;
  evidence: string;
  action: string;
  riskNote: string;
  updatedAt: string;
  handled: boolean;
}

export interface MarketMood {
  label: string;
  value: string;
  change: number;
  note: string;
}

export type DataMode = "demo" | "supabase";
export type FamilyRole = "owner" | "editor" | "viewer";
export type AccountType =
  | "brokerage"
  | "bank"
  | "fund_platform"
  | "cash"
  | "property"
  | "private_equity"
  | "insurance"
  | "other";
export type OperationalLiquidityStatus = "liquid" | "restricted" | "illiquid";
export type InstrumentAssetType =
  | "stock"
  | "etf"
  | "mutual_fund"
  | "bond"
  | "gold"
  | "cash"
  | "property"
  | "private_equity"
  | "crypto"
  | "other";
export type InstrumentMarket = "CN" | "HK" | "US" | "FUND" | "OTC" | "OTHER";
export type LedgerTransactionType =
  | "buy"
  | "sell"
  | "subscribe"
  | "redeem"
  | "dividend"
  | "interest"
  | "transfer_in"
  | "transfer_out"
  | "fx_exchange"
  | "fee"
  | "adjustment"
  | "valuation_update";
export type TransactionSource = "manual" | "csv_import" | "seed" | "api_future";
export type QuoteType = "realtime" | "delayed" | "nav" | "estimated_nav" | "manual";
export type ImportStatus = "uploaded" | "validated" | "imported" | "partially_imported" | "failed" | "reverted";

export interface Family {
  id: string;
  name: string;
  baseCurrency: Currency;
  timezone: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyRole;
}

export interface WealthAccount {
  id: string;
  familyId?: string;
  name: string;
  institution?: string;
  accountType: AccountType;
  currency: Currency;
  market: InstrumentMarket;
  ownerName?: string;
  isActive: boolean;
  isIncludedInNetWorth: boolean;
  isIncludedInInvestableAssets: boolean;
  liquidityStatus: OperationalLiquidityStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface WealthInstrument {
  id: string;
  familyId?: string;
  symbol: string;
  name: string;
  assetType: InstrumentAssetType;
  market: InstrumentMarket;
  currency: Currency;
  isin?: string | null;
  providerCodes?: Record<string, unknown>;
  isManualValuation: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface LedgerTransaction {
  id: string;
  familyId?: string;
  accountId: string;
  instrumentId?: string | null;
  transactionType: LedgerTransactionType;
  tradeAt: string;
  settleAt?: string | null;
  quantity: number;
  price: number;
  grossAmount: number;
  feeAmount: number;
  taxAmount: number;
  currency: Currency;
  fxRateToBase: number;
  cashAmount: number;
  referenceNo?: string | null;
  notes?: string | null;
  source: TransactionSource;
  importBatchId?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ManualValuation {
  id: string;
  familyId?: string;
  accountId: string;
  instrumentId: string;
  valuationDate: string;
  valueAmount: number;
  currency: Currency;
  fxRateToBase: number;
  source: string;
  notes?: string | null;
  createdBy?: string | null;
  createdAt?: string;
}

export interface MarketQuote {
  id: string;
  instrumentId: string;
  quoteTime: string;
  price: number;
  currency: Currency;
  source: string;
  quoteType: QuoteType;
}

export interface WealthFxRate {
  id?: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  rate: number;
  quoteTime: string;
  source: string;
}

export interface WealthGoal {
  id: string;
  familyId?: string;
  name: string;
  targetAmount: number;
  currency: Currency;
  currentAge: number;
  targetAge: number;
  targetDate?: string | null;
  monthlyContribution: number;
  expectedAnnualReturn: number;
  includeAccountIds: string[];
  deletedAt?: string | null;
}

export interface ImportBatch {
  id: string;
  familyId?: string;
  accountId?: string | null;
  filename: string;
  sourceType: string;
  uploadedAt: string;
  importedAt?: string | null;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  status: ImportStatus;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
}

export interface LedgerPosition {
  id: string;
  accountId: string;
  instrumentId: string;
  quantity: number;
  costBasis: number;
  averageCost: number;
  realizedPnl: number;
}

export interface CashBalance {
  accountId: string;
  currency: Currency;
  amount: number;
}

export interface ValuedPosition extends LedgerPosition {
  account: WealthAccount;
  instrument: WealthInstrument;
  marketValue: number | null;
  marketValueBase: number | null;
  costBasisBase: number;
  unrealizedPnlBase: number | null;
  valuationStatus: "priced" | "pending";
  valuationSource: string;
  valuationUpdatedAt?: string;
  quoteType?: QuoteType;
}

export interface DashboardAggregate {
  netWorthBase: number;
  investableAssetsBase: number;
  totalCostBase: number;
  unrealizedPnlBase: number;
  realizedPnlBase: number;
  cashBase: number;
  byAssetType: AllocationSlice[];
  byMarket: AllocationSlice[];
  updatedAt: string;
  pendingValuationCount: number;
}
