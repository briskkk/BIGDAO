import type {
  CashBalance,
  Currency,
  DashboardAggregate,
  LedgerPosition,
  ManualValuation,
  MarketQuote,
  ValuedPosition,
  WealthAccount,
  WealthFxRate,
  WealthInstrument
} from "@/types/domain";
import { convertCurrency, latestFxRates } from "@/lib/domain/currency-calculator";
import { cnAssetType } from "@/lib/format";

export function valuePositions(input: {
  positions: LedgerPosition[];
  accounts: WealthAccount[];
  instruments: WealthInstrument[];
  quotes: MarketQuote[];
  manualValuations: ManualValuation[];
  fxRates: WealthFxRate[];
  baseCurrency: Currency;
}): ValuedPosition[] {
  const rates = latestFxRates(input.fxRates);
  return input.positions.map((position) => {
    const account = mustFind(input.accounts, position.accountId, "account");
    const instrument = mustFind(input.instruments, position.instrumentId, "instrument");
    const manual = latestManualValuation(input.manualValuations, position.accountId, position.instrumentId);
    const quote = latestQuote(input.quotes, position.instrumentId);
    const manualValue = instrument.isManualValuation ? manual : undefined;
    const price = manualValue ? manualValue.valueAmount / Math.max(position.quantity, 1) : quote?.price;
    const sourceCurrency = manualValue?.currency ?? quote?.currency ?? instrument.currency;
    const marketValue = price === undefined ? null : price * position.quantity;
    const marketValueBase = marketValue === null ? null : convertCurrency(marketValue, sourceCurrency, input.baseCurrency, rates);
    const costBasisBase = convertCurrency(position.costBasis, instrument.currency, input.baseCurrency, rates);
    return {
      ...position,
      account,
      instrument,
      marketValue,
      marketValueBase,
      costBasisBase,
      unrealizedPnlBase: marketValueBase === null ? null : marketValueBase - costBasisBase,
      valuationStatus: marketValue === null ? "pending" : "priced",
      valuationSource: manualValue ? manualValue.source : quote ? quote.source : "待估值",
      valuationUpdatedAt: manualValue?.valuationDate ?? quote?.quoteTime,
      quoteType: quote?.quoteType
    };
  });
}

export function buildDashboardAggregate(input: {
  valuedPositions: ValuedPosition[];
  cashBalances: CashBalance[];
  accounts: WealthAccount[];
  fxRates: WealthFxRate[];
  baseCurrency: Currency;
  realizedPnl: number;
}): DashboardAggregate {
  const rates = latestFxRates(input.fxRates);
  const included = input.valuedPositions.filter((position) => position.account.isIncludedInNetWorth);
  const netWorthFromPositions = sum(included.map((position) => position.marketValueBase ?? 0));
  const cashBase = sum(
    input.cashBalances.map((balance) => {
      const account = input.accounts.find((item) => item.id === balance.accountId);
      if (!account?.isIncludedInNetWorth) return 0;
      return convertCurrency(balance.amount, balance.currency, input.baseCurrency, rates);
    })
  );
  const netWorthBase = netWorthFromPositions + cashBase;
  const investableAssetsBase =
    sum(
      input.valuedPositions
        .filter((position) => position.account.isIncludedInInvestableAssets)
        .map((position) => position.marketValueBase ?? 0)
    ) +
    sum(
      input.cashBalances.map((balance) => {
        const account = input.accounts.find((item) => item.id === balance.accountId);
        if (!account?.isIncludedInInvestableAssets) return 0;
        return convertCurrency(balance.amount, balance.currency, input.baseCurrency, rates);
      })
    );
  const totalCostBase = sum(input.valuedPositions.map((position) => position.costBasisBase));
  const unrealizedPnlBase = sum(input.valuedPositions.map((position) => position.unrealizedPnlBase ?? 0));

  return {
    netWorthBase,
    investableAssetsBase,
    totalCostBase,
    unrealizedPnlBase,
    realizedPnlBase: input.realizedPnl,
    cashBase,
    byAssetType: group(input.valuedPositions, (position) => position.instrument.assetType, (key) => cnAssetType(key), netWorthBase),
    byMarket: group(input.valuedPositions, (position) => position.instrument.market, (key) => key, netWorthBase),
    updatedAt: new Date().toISOString(),
    pendingValuationCount: input.valuedPositions.filter((position) => position.valuationStatus === "pending").length
  };
}

function latestQuote(quotes: MarketQuote[], instrumentId: string) {
  return quotes.filter((quote) => quote.instrumentId === instrumentId).sort((a, b) => b.quoteTime.localeCompare(a.quoteTime))[0];
}

function latestManualValuation(valuations: ManualValuation[], accountId: string, instrumentId: string) {
  return valuations
    .filter((item) => item.accountId === accountId && item.instrumentId === instrumentId)
    .sort((a, b) => b.valuationDate.localeCompare(a.valuationDate))[0];
}

function group(items: ValuedPosition[], keySelector: (item: ValuedPosition) => string, labelSelector: (key: string) => string, total: number) {
  const grouped = new Map<string, number>();
  for (const item of items) grouped.set(keySelector(item), (grouped.get(keySelector(item)) ?? 0) + (item.marketValueBase ?? 0));
  return Array.from(grouped.entries())
    .map(([key, valueCny]) => ({ key, label: labelSelector(key), valueCny, ratio: total === 0 ? 0 : valueCny / total }))
    .sort((a, b) => b.valueCny - a.valueCny);
}

function mustFind<T extends { id: string }>(items: T[], id: string, name: string) {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing ${name}: ${id}`);
  return item;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
