import type { Database, Json } from "@/types/database.types";
import type {
  Account,
  AssetSnapshot,
  Currency,
  FxRate,
  Goal,
  Holding,
  ImportBatch,
  Instrument,
  LedgerTransaction,
  ManualValuation,
  MarketQuote,
  Transaction,
  TransactionType,
  WealthAccount,
  WealthFxRate,
  WealthGoal,
  WealthInstrument
} from "@/types/domain";
import type { ValuedPosition } from "@/types/domain";

type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type InstrumentRow = Database["public"]["Tables"]["instruments"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type ManualValuationRow = Database["public"]["Tables"]["manual_valuations"]["Row"];
type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];
type FxRateRow = Database["public"]["Tables"]["fx_rates"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type ImportBatchRow = Database["public"]["Tables"]["import_batches"]["Row"];

const currency = (value: string): Currency => (value === "USD" || value === "HKD" ? value : "CNY");

export function mapAccount(row: AccountRow): WealthAccount {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    institution: row.institution ?? undefined,
    accountType: row.account_type,
    currency: currency(row.currency),
    market: row.market,
    ownerName: row.owner_name ?? undefined,
    isActive: row.is_active,
    isIncludedInNetWorth: row.is_included_in_net_worth,
    isIncludedInInvestableAssets: row.is_included_in_investable_assets,
    liquidityStatus: row.liquidity_status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

export function mapInstrument(row: InstrumentRow): WealthInstrument {
  return {
    id: row.id,
    familyId: row.family_id,
    symbol: row.symbol,
    name: row.name,
    assetType: row.asset_type,
    market: row.market,
    currency: currency(row.currency),
    isin: row.isin,
    providerCodes: asRecord(row.provider_codes),
    isManualValuation: row.is_manual_valuation,
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

export function mapTransaction(row: TransactionRow): LedgerTransaction {
  return {
    id: row.id,
    familyId: row.family_id,
    accountId: row.account_id,
    instrumentId: row.instrument_id,
    transactionType: row.transaction_type,
    tradeAt: row.trade_at,
    settleAt: row.settle_at,
    quantity: Number(row.quantity),
    price: Number(row.price),
    grossAmount: Number(row.gross_amount),
    feeAmount: Number(row.fee_amount),
    taxAmount: Number(row.tax_amount),
    currency: currency(row.currency),
    fxRateToBase: Number(row.fx_rate_to_base),
    cashAmount: Number(row.cash_amount),
    referenceNo: row.reference_no,
    notes: row.notes,
    source: row.source,
    importBatchId: row.import_batch_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

export function mapManualValuation(row: ManualValuationRow): ManualValuation {
  return {
    id: row.id,
    familyId: row.family_id,
    accountId: row.account_id,
    instrumentId: row.instrument_id,
    valuationDate: row.valuation_date,
    valueAmount: Number(row.value_amount),
    currency: currency(row.currency),
    fxRateToBase: Number(row.fx_rate_to_base),
    source: row.source,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

export function mapQuote(row: QuoteRow): MarketQuote {
  return {
    id: row.id,
    instrumentId: row.instrument_id,
    quoteTime: row.quote_time,
    price: Number(row.price),
    currency: currency(row.currency),
    source: row.source,
    quoteType: row.quote_type
  };
}

export function mapFxRate(row: FxRateRow): WealthFxRate {
  return {
    id: row.id,
    baseCurrency: currency(row.base_currency),
    quoteCurrency: currency(row.quote_currency),
    rate: Number(row.rate),
    quoteTime: row.quote_time,
    source: row.source
  };
}

export function mapGoal(row: GoalRow): WealthGoal {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    currency: currency(row.currency),
    currentAge: row.current_age,
    targetAge: row.target_age,
    targetDate: row.target_date,
    monthlyContribution: Number(row.monthly_contribution),
    expectedAnnualReturn: Number(row.expected_annual_return),
    includeAccountIds: Array.isArray(row.include_account_ids) ? row.include_account_ids.filter((item): item is string => typeof item === "string") : [],
    deletedAt: row.deleted_at
  };
}

export function mapImportBatch(row: ImportBatchRow): ImportBatch {
  return {
    id: row.id,
    familyId: row.family_id,
    accountId: row.account_id,
    filename: row.filename,
    sourceType: row.source_type,
    uploadedAt: row.uploaded_at,
    importedAt: row.imported_at,
    totalRows: row.total_rows,
    validRows: row.valid_rows,
    invalidRows: row.invalid_rows,
    duplicateRows: row.duplicate_rows,
    status: row.status,
    createdBy: row.created_by,
    metadata: asRecord(row.metadata)
  };
}

export function toLegacyAccount(account: WealthAccount): Account {
  const liquidityMap = {
    liquid: "tradable",
    restricted: "restricted",
    illiquid: account.accountType === "property" ? "external" : "locked"
  } as const;
  return {
    id: account.id,
    name: account.name,
    institution: account.institution ?? "Unknown",
    currencies: [account.currency],
    liquidityStatus: liquidityMap[account.liquidityStatus],
    includeInInvestableGoal: account.isIncludedInInvestableAssets,
    description: account.notes ?? ""
  };
}

export function toLegacyInstrument(instrument: WealthInstrument): Instrument {
  const assetTypeMap = {
    mutual_fund: "fund",
    private_equity: "company_stock",
    bond: "fund",
    crypto: "company_stock",
    other: "company_stock",
    stock: "stock",
    etf: "etf",
    gold: "gold",
    cash: "cash",
    property: "property"
  } as const;
  const marketMap = {
    CN: "A股",
    HK: "港股",
    US: "美股",
    FUND: "中国基金",
    OTC: "其他",
    OTHER: instrument.assetType === "gold" ? "黄金" : instrument.assetType === "cash" ? "现金" : "其他"
  } as const;
  return {
    id: instrument.id,
    name: instrument.name,
    symbol: instrument.symbol,
    assetType: assetTypeMap[instrument.assetType],
    market: marketMap[instrument.market],
    currency: instrument.currency,
    priceLabel: instrument.isManualValuation ? "盘点值" : undefined
  };
}

export function toLegacyHolding(position: ValuedPosition): Holding {
  return {
    id: position.id,
    accountId: position.accountId,
    instrumentId: position.instrumentId,
    quantity: position.quantity,
    costPrice: position.averageCost,
    thesis: position.valuationStatus === "pending" ? "该资产暂无报价或手动估值，请通过交易或估值更新。" : "由交易流水按加权平均成本自动生成。",
    riskTags: position.account.isIncludedInInvestableAssets ? ["可投资资产"] : ["非目标口径"]
  };
}

export function toLegacyQuote(position: ValuedPosition): import("@/types/domain").Quote {
  const latestPrice = position.marketValue === null ? 0 : position.marketValue / Math.max(position.quantity, 1);
  return {
    instrumentId: position.instrumentId,
    latestPrice,
    previousClose: latestPrice,
    updatedAt: position.valuationUpdatedAt ?? "待估值"
  };
}

export function toLegacyFxRate(rate: WealthFxRate): FxRate {
  return { from: rate.baseCurrency, to: rate.quoteCurrency, rate: rate.rate, updatedAt: rate.quoteTime };
}

export function toLegacyTransaction(tx: LedgerTransaction): Transaction {
  return {
    id: tx.id,
    date: tx.tradeAt.slice(0, 10),
    accountId: tx.accountId,
    instrumentId: tx.instrumentId ?? undefined,
    type: toCnTransactionType(tx.transactionType),
    quantity: tx.quantity || undefined,
    price: tx.price || undefined,
    amount: tx.grossAmount || Math.abs(tx.cashAmount),
    currency: tx.currency,
    fxRate: tx.fxRateToBase,
    fee: tx.feeAmount + tx.taxAmount,
    note: tx.notes ?? "",
    tags: [tx.source]
  };
}

export function toLegacyGoal(goal: WealthGoal | undefined, currentAmount: number): Goal {
  return {
    id: goal?.id ?? "goal-1500w",
    name: goal?.name ?? "40 岁前可自由投资金融资产达到 1,500 万",
    targetAmountCny: goal?.targetAmount ?? 15000000,
    currentAge: goal?.currentAge ?? 31,
    targetAge: goal?.targetAge ?? 40,
    monthlyContributionCny: goal?.monthlyContribution ?? 30000,
    currentAmountCny: currentAmount
  };
}

export function toLegacySnapshot(aggregate: import("@/types/domain").DashboardAggregate): AssetSnapshot {
  return {
    netWorthCny: aggregate.netWorthBase,
    investableAssetsCny: aggregate.investableAssetsBase,
    totalCostCny: aggregate.totalCostBase,
    cumulativePnlCny: aggregate.unrealizedPnlBase + aggregate.realizedPnlBase,
    dailyPnlCny: 0,
    byAssetType: aggregate.byAssetType,
    byMarket: aggregate.byMarket
  };
}

function toCnTransactionType(type: LedgerTransaction["transactionType"]): TransactionType {
  const map: Record<LedgerTransaction["transactionType"], TransactionType> = {
    buy: "买入",
    sell: "卖出",
    subscribe: "申购",
    redeem: "赎回",
    dividend: "分红",
    interest: "分红",
    transfer_in: "转账",
    transfer_out: "转账",
    fx_exchange: "汇兑",
    fee: "手续费",
    adjustment: "资产盘点调整",
    valuation_update: "资产盘点调整"
  };
  return map[type];
}

function asRecord(value: Json): Record<string, unknown> {
  return value && !Array.isArray(value) && typeof value === "object" ? value : {};
}
