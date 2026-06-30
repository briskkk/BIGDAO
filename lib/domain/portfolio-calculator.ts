import type { Currency, LedgerTransaction, ManualValuation, MarketQuote, WealthAccount, WealthFxRate, WealthInstrument } from "@/types/domain";
import { calculateLedger } from "@/lib/domain/ledger-calculator";
import { buildDashboardAggregate, valuePositions } from "@/lib/domain/valuation-calculator";

export function buildPortfolioState(input: {
  accounts: WealthAccount[];
  instruments: WealthInstrument[];
  transactions: LedgerTransaction[];
  quotes: MarketQuote[];
  manualValuations: ManualValuation[];
  fxRates: WealthFxRate[];
  baseCurrency: Currency;
}) {
  const ledger = calculateLedger(input.transactions);
  const valuedPositions = valuePositions({ ...input, positions: ledger.positions });
  const aggregate = buildDashboardAggregate({
    valuedPositions,
    cashBalances: ledger.cashBalances,
    accounts: input.accounts,
    fxRates: input.fxRates,
    baseCurrency: input.baseCurrency,
    realizedPnl: ledger.realizedPnl
  });
  return { ...ledger, valuedPositions, aggregate };
}
