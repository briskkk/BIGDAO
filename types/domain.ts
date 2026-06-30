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
