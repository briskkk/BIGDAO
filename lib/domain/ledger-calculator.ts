import type { CashBalance, LedgerPosition, LedgerTransaction } from "@/types/domain";

const INCREASE = new Set(["buy", "subscribe", "transfer_in"]);
const DECREASE = new Set(["sell", "redeem", "transfer_out"]);

export interface LedgerResult {
  positions: LedgerPosition[];
  cashBalances: CashBalance[];
  realizedPnl: number;
}

export function calculateLedger(transactions: LedgerTransaction[]): LedgerResult {
  const positions = new Map<string, LedgerPosition>();
  const cashBalances = new Map<string, CashBalance>();
  let realizedPnl = 0;

  const active = transactions
    .filter((tx) => !tx.deletedAt)
    .sort((a, b) => a.tradeAt.localeCompare(b.tradeAt));

  for (const tx of active) {
    applyCash(cashBalances, tx);
    if (!tx.instrumentId) continue;

    const key = `${tx.accountId}:${tx.instrumentId}`;
    const position = positions.get(key) ?? {
      id: key,
      accountId: tx.accountId,
      instrumentId: tx.instrumentId,
      quantity: 0,
      costBasis: 0,
      averageCost: 0,
      realizedPnl: 0
    };

    const quantity = Number(tx.quantity || 0);
    const totalCost = Number(tx.grossAmount || quantity * tx.price) + Number(tx.feeAmount || 0) + Number(tx.taxAmount || 0);

    if (INCREASE.has(tx.transactionType) || (tx.transactionType === "adjustment" && quantity > 0)) {
      position.quantity += quantity;
      position.costBasis += totalCost;
    }

    if (DECREASE.has(tx.transactionType) || (tx.transactionType === "adjustment" && quantity < 0)) {
      const sellQuantity = Math.abs(quantity);
      if (sellQuantity > position.quantity + 1e-8) {
        throw new Error(`Transaction ${tx.id} would create negative holding for ${tx.instrumentId}`);
      }
      const averageCost = position.quantity === 0 ? 0 : position.costBasis / position.quantity;
      const removedCost = averageCost * sellQuantity;
      const proceeds = Number(tx.grossAmount || sellQuantity * tx.price) - Number(tx.feeAmount || 0) - Number(tx.taxAmount || 0);
      const pnl = tx.transactionType === "adjustment" ? 0 : proceeds - removedCost;
      position.quantity -= sellQuantity;
      position.costBasis -= removedCost;
      position.realizedPnl += pnl;
      realizedPnl += pnl;
    }

    position.averageCost = position.quantity === 0 ? 0 : position.costBasis / position.quantity;
    if (position.quantity > 1e-8) positions.set(key, position);
    else positions.delete(key);
  }

  return {
    positions: Array.from(positions.values()),
    cashBalances: Array.from(cashBalances.values()).filter((balance) => Math.abs(balance.amount) > 1e-8),
    realizedPnl
  };
}

function applyCash(cashBalances: Map<string, CashBalance>, tx: LedgerTransaction) {
  const key = `${tx.accountId}:${tx.currency}`;
  const balance = cashBalances.get(key) ?? { accountId: tx.accountId, currency: tx.currency, amount: 0 };
  const gross = Number(tx.grossAmount || tx.quantity * tx.price || tx.cashAmount || 0);
  const fees = Number(tx.feeAmount || 0) + Number(tx.taxAmount || 0);
  let delta = Number(tx.cashAmount || 0);

  if (!delta) {
    if (["buy", "subscribe"].includes(tx.transactionType)) delta = -(gross + fees);
    else if (["sell", "redeem"].includes(tx.transactionType)) delta = gross - fees;
    else if (["dividend", "interest", "transfer_in"].includes(tx.transactionType)) delta = gross - fees;
    else if (["transfer_out", "fee"].includes(tx.transactionType)) delta = -(gross + fees);
    else if (tx.transactionType === "adjustment") delta = 0;
  }

  balance.amount += delta;
  cashBalances.set(key, balance);
}
