import type {
  Account,
  AllocationSlice,
  Currency,
  FxRate,
  Goal,
  GoalScenario,
  Holding,
  Instrument,
  Quote
} from "@/types/domain";
import { cnAssetType } from "@/lib/format";

interface SnapshotInput {
  accounts: Account[];
  holdings: Holding[];
  instruments: Instrument[];
  quotes: Quote[];
  fxRates: FxRate[];
}

export interface HoldingView {
  holding: Holding;
  account: Account;
  instrument: Instrument;
  quote: Quote;
  marketValue: number;
  costValue: number;
  marketValueCny: number;
  costValueCny: number;
  dailyPnlCny: number;
  cumulativePnlCny: number;
  cumulativeReturn: number;
  dailyReturn: number;
  investableRatio: number;
}

export function convertToCny(amount: number, currency: Currency, rates: FxRate[]) {
  const rate = rates.find((item) => item.from === currency && item.to === "CNY")?.rate;
  if (!rate) {
    throw new Error(`Missing FX rate for ${currency}/CNY`);
  }
  return amount * rate;
}

export function buildHoldingViews(input: SnapshotInput): HoldingView[] {
  const investableBase = calculateInvestableAssets(input);
  return input.holdings.map((holding) => {
    const account = mustFind(input.accounts, holding.accountId, "account");
    const instrument = mustFind(input.instruments, holding.instrumentId, "instrument");
    const quote = mustFind(input.quotes, holding.instrumentId, "quote", "instrumentId");
    const marketValue = holding.quantity * quote.latestPrice;
    const costValue = holding.quantity * holding.costPrice;
    const previousValue = holding.quantity * quote.previousClose;
    const marketValueCny = convertToCny(marketValue, instrument.currency, input.fxRates);
    const costValueCny = convertToCny(costValue, instrument.currency, input.fxRates);
    const previousValueCny = convertToCny(previousValue, instrument.currency, input.fxRates);
    const dailyPnlCny = marketValueCny - previousValueCny;
    const cumulativePnlCny = marketValueCny - costValueCny;
    return {
      holding,
      account,
      instrument,
      quote,
      marketValue,
      costValue,
      marketValueCny,
      costValueCny,
      dailyPnlCny,
      cumulativePnlCny,
      cumulativeReturn: costValueCny === 0 ? 0 : cumulativePnlCny / costValueCny,
      dailyReturn: previousValueCny === 0 ? 0 : dailyPnlCny / previousValueCny,
      investableRatio: investableBase === 0 ? 0 : marketValueCny / investableBase
    };
  });
}

export function calculateInvestableAssets(input: SnapshotInput) {
  return input.holdings.reduce((sum, holding) => {
    const account = mustFind(input.accounts, holding.accountId, "account");
    if (!account.includeInInvestableGoal) return sum;
    const instrument = mustFind(input.instruments, holding.instrumentId, "instrument");
    const quote = mustFind(input.quotes, holding.instrumentId, "quote", "instrumentId");
    return sum + convertToCny(holding.quantity * quote.latestPrice, instrument.currency, input.fxRates);
  }, 0);
}

export function buildAssetSnapshot(input: SnapshotInput) {
  const views = buildHoldingViews(input);
  const netWorthCny = sum(views.map((view) => view.marketValueCny));
  const investableAssetsCny = sum(
    views.filter((view) => view.account.includeInInvestableGoal).map((view) => view.marketValueCny)
  );
  const totalCostCny = sum(views.map((view) => view.costValueCny));
  const dailyPnlCny = sum(views.map((view) => view.dailyPnlCny));
  const cumulativePnlCny = netWorthCny - totalCostCny;

  return {
    netWorthCny,
    investableAssetsCny,
    totalCostCny,
    dailyPnlCny,
    cumulativePnlCny,
    byAssetType: groupAllocation(views, (view) => view.instrument.assetType, (key) => cnAssetType(key), netWorthCny),
    byMarket: groupAllocation(views, (view) => view.instrument.market, (key) => key, netWorthCny)
  };
}

export function groupAllocation(
  views: HoldingView[],
  keySelector: (view: HoldingView) => string,
  labelSelector: (key: string) => string,
  total: number
): AllocationSlice[] {
  const grouped = new Map<string, number>();
  views.forEach((view) => {
    const key = keySelector(view);
    grouped.set(key, (grouped.get(key) ?? 0) + view.marketValueCny);
  });
  return Array.from(grouped.entries())
    .map(([key, valueCny]) => ({ key, label: labelSelector(key), valueCny, ratio: total === 0 ? 0 : valueCny / total }))
    .sort((a, b) => b.valueCny - a.valueCny);
}

export function projectGoal(goal: Goal, annualReturns: number[] = [0.04, 0.07, 0.1]): GoalScenario[] {
  const names: GoalScenario["name"][] = ["保守", "基准", "乐观"];
  const years = goal.targetAge - goal.currentAge;
  return annualReturns.map((annualReturn, index) => {
    const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
    let amount = goal.currentAmountCny;
    const points = [{ year: 0, amountCny: amount }];
    for (let month = 1; month <= years * 12; month += 1) {
      amount = amount * (1 + monthlyReturn) + goal.monthlyContributionCny;
      if (month % 12 === 0) {
        points.push({ year: month / 12, amountCny: amount });
      }
    }
    return { name: names[index], annualReturn, points };
  });
}

export function requiredMonthlyContribution(goal: Goal, annualReturn: number) {
  const months = (goal.targetAge - goal.currentAge) * 12;
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const futureCurrent = goal.currentAmountCny * Math.pow(1 + monthlyReturn, months);
  if (monthlyReturn === 0) {
    return Math.max(0, (goal.targetAmountCny - goal.currentAmountCny) / months);
  }
  return Math.max(0, ((goal.targetAmountCny - futureCurrent) * monthlyReturn) / (Math.pow(1 + monthlyReturn, months) - 1));
}

export function requiredAnnualReturn(goal: Goal) {
  const months = (goal.targetAge - goal.currentAge) * 12;
  let low = -0.5;
  let high = 0.5;
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2;
    const monthlyReturn = Math.pow(1 + mid, 1 / 12) - 1;
    let amount = goal.currentAmountCny;
    for (let month = 0; month < months; month += 1) {
      amount = amount * (1 + monthlyReturn) + goal.monthlyContributionCny;
    }
    if (amount >= goal.targetAmountCny) high = mid;
    else low = mid;
  }
  return high;
}

function mustFind<T extends { id?: string; instrumentId?: string }>(
  items: T[],
  id: string,
  name: string,
  key: "id" | "instrumentId" = "id"
): T {
  const item = items.find((candidate) => candidate[key] === id);
  if (!item) throw new Error(`Missing ${name}: ${id}`);
  return item;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
