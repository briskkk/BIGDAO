import {
  accounts,
  fxRates,
  goal,
  holdings,
  instruments,
  marketMood,
  quotes,
  strategyRules,
  transactions
} from "@/lib/mock-data";
import { buildAssetSnapshot } from "@/lib/calculations";

export function getWealthRepository() {
  const snapshot = buildAssetSnapshot({ accounts, holdings, instruments, quotes, fxRates });
  return {
    accounts,
    fxRates,
    goal: { ...goal, currentAmountCny: snapshot.investableAssetsCny },
    holdings,
    instruments,
    marketMood,
    quotes,
    snapshot,
    strategyRules,
    transactions
  };
}
