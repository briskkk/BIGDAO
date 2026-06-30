import type { Currency, WealthFxRate } from "@/types/domain";

export function convertCurrency(amount: number, from: Currency, to: Currency, rates: WealthFxRate[]) {
  if (from === to) return amount;
  const direct = rates.find((rate) => rate.baseCurrency === from && rate.quoteCurrency === to);
  if (direct) return amount * direct.rate;
  const inverse = rates.find((rate) => rate.baseCurrency === to && rate.quoteCurrency === from);
  if (inverse) return amount / inverse.rate;
  throw new Error(`Missing FX rate for ${from}/${to}`);
}

export function latestFxRates(rates: WealthFxRate[]) {
  const byPair = new Map<string, WealthFxRate>();
  for (const rate of rates) {
    const key = `${rate.baseCurrency}/${rate.quoteCurrency}`;
    const current = byPair.get(key);
    if (!current || current.quoteTime < rate.quoteTime) byPair.set(key, rate);
  }
  return Array.from(byPair.values());
}
