"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { softDeleteTransactionAction, upsertTransactionAction } from "@/lib/actions/wealth-actions";
import { formatMoney } from "@/lib/format";
import type { WealthRepositoryData } from "@/lib/repository";
import type { Transaction, TransactionType } from "@/types/domain";

type Repo = WealthRepositoryData;
const transactionTypes: TransactionType[] = ["买入", "卖出", "分红", "申购", "赎回", "转账", "汇兑", "手续费", "资产盘点调整"];

export function LedgerClient({ repo }: { repo: Repo }) {
  const [items, setItems] = useState(repo.transactions);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const rows = useMemo(() => items.filter((item) => filter === "all" || item.type === filter), [items, filter]);

  useEffect(() => {
    setItems(repo.transactions);
  }, [repo.transactions]);

  function save(tx: Transaction) {
    setItems((current) => current.some((item) => item.id === tx.id) ? current.map((item) => item.id === tx.id ? tx : item) : [tx, ...current]);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><h1 className="text-3xl font-semibold">交易账本 Ledger</h1><p className="mt-2 text-sm text-muted-foreground">{repo.mode === "demo" ? "Demo Mode：前端模拟新增、编辑、删除。" : "Supabase Mode：交易流水持久化，删除采用软删除并写入审计日志。"}</p></div>
        <Button variant="secondary" asChild><a href="/imports">导入 CSV</a></Button>
        <Button onClick={() => setEditing(emptyTransaction(repo))}><Plus className="h-4 w-4" />新增交易</Button>
      </div>
      <Card>
        <div className="flex flex-wrap gap-2">
          {["all", ...transactionTypes].map((type) => (
            <Button key={type} variant={filter === type ? "default" : "secondary"} size="sm" onClick={() => setFilter(type)}>{type === "all" ? "全部" : type}</Button>
          ))}
        </div>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="text-left text-muted-foreground"><tr>{["日期", "账户", "标的", "类型", "数量", "单价", "金额", "汇率", "手续费", "备注", "标签", "操作"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr></thead>
          <tbody>
            {rows.map((tx) => {
              const account = repo.accounts.find((item) => item.id === tx.accountId);
              const instrument = repo.instruments.find((item) => item.id === tx.instrumentId);
              return (
                <tr key={tx.id} className="border-t border-border/35">
                  <td className="px-4 py-3">{tx.date}</td>
                  <td className="px-4 py-3">{account?.name}</td>
                  <td className="px-4 py-3">{instrument?.name ?? "-"}</td>
                  <td className="px-4 py-3"><Badge>{tx.type}</Badge></td>
                  <td className="number px-4 py-3">{tx.quantity ?? "-"}</td>
                  <td className="number px-4 py-3">{tx.price ? formatMoney(tx.price, tx.currency) : "-"}</td>
                  <td className="number px-4 py-3">{formatMoney(tx.amount, tx.currency)}</td>
                  <td className="number px-4 py-3">{tx.fxRate}</td>
                  <td className="number px-4 py-3">{formatMoney(tx.fee, tx.currency)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.note}</td>
                  <td className="px-4 py-3">{tx.tags.map((tag) => <Badge key={tag} className="mr-1">{tag}</Badge>)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(tx)}><Edit2 className="h-4 w-4" /></Button>
                      {repo.mode === "supabase" ? (
                        <form action={softDeleteTransactionAction} onSubmit={(event) => !confirm("确认软删除这笔交易？持仓和现金会重算。") && event.preventDefault()}>
                          <input type="hidden" name="id" value={tx.id} />
                          <Button variant="ghost" size="icon" type="submit"><Trash2 className="h-4 w-4" /></Button>
                        </form>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((item) => item.id !== tx.id))}><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {editing ? <TransactionModal repo={repo} tx={editing} onSave={save} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function emptyTransaction(repo: Repo): Transaction {
  return {
    id: `tx-${Date.now()}`,
    date: "2026-07-01",
    accountId: repo.accounts[0]?.id ?? repo.operational.accounts[0]?.id ?? "",
    instrumentId: repo.instruments[2]?.id ?? repo.instruments[0]?.id,
    type: "买入",
    quantity: 0,
    price: 0,
    amount: 0,
    currency: repo.accounts[0]?.currencies[0] ?? repo.operational.accounts[0]?.currency ?? "CNY",
    fxRate: 1,
    fee: 0,
    note: "",
    tags: []
  };
}

function TransactionModal({ repo, tx, onSave, onClose }: { repo: Repo; tx: Transaction; onSave: (tx: Transaction) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(tx);
  if (repo.mode === "supabase") {
    const source = repo.operational.transactions.find((item) => item.id === tx.id);
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-background/55 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-2xl">
          <h2 className="text-xl font-semibold">交易记录</h2>
          <form action={upsertTransactionAction} className="mt-5 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={source?.id ?? ""} />
            <Input label="日期" name="tradeAt" value={(source?.tradeAt ?? new Date().toISOString()).slice(0, 10)} onChange={() => undefined} />
            <Select label="账户" name="accountId" value={source?.accountId ?? repo.operational.accounts[0]?.id ?? ""} onChange={() => undefined} options={repo.operational.accounts.map((item) => [item.id, item.name])} />
            <Select label="标的" name="instrumentId" value={source?.instrumentId ?? ""} onChange={() => undefined} options={[["", "无"], ...repo.operational.instruments.map((item) => [item.id, item.name])]} />
            <Input label="新标的代码" name="instrumentSymbol" value="" onChange={() => undefined} />
            <Input label="新标的名称" name="instrumentName" value="" onChange={() => undefined} />
            <Select label="类型" name="transactionType" value={source?.transactionType ?? "buy"} onChange={() => undefined} options={["buy", "sell", "subscribe", "redeem", "dividend", "interest", "transfer_in", "transfer_out", "fx_exchange", "fee", "adjustment", "valuation_update"].map((item) => [item, item])} />
            <Input label="数量" name="quantity" value={String(source?.quantity ?? 0)} onChange={() => undefined} />
            <Input label="单价" name="price" value={String(source?.price ?? 0)} onChange={() => undefined} />
            <Input label="金额" name="grossAmount" value={String(source?.grossAmount ?? 0)} onChange={() => undefined} />
            <Select label="币种" name="currency" value={source?.currency ?? "CNY"} onChange={() => undefined} options={[["CNY", "CNY"], ["USD", "USD"], ["HKD", "HKD"]]} />
            <Input label="汇率" name="fxRateToBase" value={String(source?.fxRateToBase ?? 1)} onChange={() => undefined} />
            <Input label="手续费" name="feeAmount" value={String(source?.feeAmount ?? 0)} onChange={() => undefined} />
            <Input label="税费" name="taxAmount" value={String(source?.taxAmount ?? 0)} onChange={() => undefined} />
            <Input label="现金影响" name="cashAmount" value={String(source?.cashAmount ?? 0)} onChange={() => undefined} />
            <Input label="流水号" name="referenceNo" value={source?.referenceNo ?? ""} onChange={() => undefined} />
            <Input label="备注" name="notes" value={source?.notes ?? ""} onChange={() => undefined} />
            <div className="mt-3 flex justify-end gap-2 sm:col-span-2"><Button variant="secondary" type="button" onClick={onClose}>取消</Button><Button type="submit">保存并刷新</Button></div>
          </form>
        </Card>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/55 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold">交易记录</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Input label="日期" value={draft.date} onChange={(value) => setDraft({ ...draft, date: value })} />
          <Select label="账户" value={draft.accountId} onChange={(value) => setDraft({ ...draft, accountId: value })} options={repo.accounts.map((item) => [item.id, item.name])} />
          <Select label="标的" value={draft.instrumentId ?? ""} onChange={(value) => setDraft({ ...draft, instrumentId: value })} options={repo.instruments.map((item) => [item.id, item.name])} />
          <Select label="类型" value={draft.type} onChange={(value) => setDraft({ ...draft, type: value as TransactionType })} options={transactionTypes.map((item) => [item, item])} />
          <Input label="数量" value={String(draft.quantity ?? 0)} onChange={(value) => setDraft({ ...draft, quantity: Number(value) })} />
          <Input label="单价" value={String(draft.price ?? 0)} onChange={(value) => setDraft({ ...draft, price: Number(value) })} />
          <Input label="金额" value={String(draft.amount)} onChange={(value) => setDraft({ ...draft, amount: Number(value) })} />
          <Select label="币种" value={draft.currency} onChange={(value) => setDraft({ ...draft, currency: value as Transaction["currency"] })} options={[["CNY", "CNY"], ["USD", "USD"], ["HKD", "HKD"]]} />
          <Input label="汇率" value={String(draft.fxRate)} onChange={(value) => setDraft({ ...draft, fxRate: Number(value) })} />
          <Input label="手续费" value={String(draft.fee)} onChange={(value) => setDraft({ ...draft, fee: Number(value) })} />
          <Input label="备注" value={draft.note} onChange={(value) => setDraft({ ...draft, note: value })} />
          <Input label="标签" value={draft.tags.join(",")} onChange={(value) => setDraft({ ...draft, tags: value.split(",").filter(Boolean) })} />
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button onClick={() => onSave(draft)}>保存</Button></div>
      </Card>
    </div>
  );
}

function Input({ label, value, onChange, name }: { label: string; value: string; onChange: (value: string) => void; name?: string }) {
  return <label className="text-sm text-muted-foreground">{label}<input name={name} className="aurora-input mt-1 h-10 w-full px-3" defaultValue={name ? value : undefined} value={name ? undefined : value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, onChange, options, name }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; name?: string }) {
  return <label className="text-sm text-muted-foreground">{label}<select name={name} className="aurora-input mt-1 h-10 w-full px-3" defaultValue={name ? value : undefined} value={name ? undefined : value} onChange={(e) => onChange(e.target.value)}>{options.map(([key, labelText]) => <option key={key} value={key}>{labelText}</option>)}</select></label>;
}
