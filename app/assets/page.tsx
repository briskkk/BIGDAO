import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createAccountAction, archiveAccountAction } from "@/lib/actions/wealth-actions";
import { buildHoldingViews } from "@/lib/calculations";
import { formatMoney, formatPercent } from "@/lib/format";
import { getWealthRepository } from "@/lib/repository";

export default async function AssetsPage() {
  const repo = await getWealthRepository();
  const views = buildHoldingViews(repo);
  const accountRows = repo.accounts.map((account) => {
    const items = views.filter((view) => view.account.id === account.id);
    const total = items.reduce((sum, item) => sum + item.marketValueCny, 0);
    return { account, items, total };
  });

  return (
    <div className="space-y-6">
      <Header title="资产与账户 Assets" sub="区分可交易、锁定、不可流通和外部资产；目标口径独立于家庭总净资产。" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><p className="text-sm text-muted-foreground">账户数量</p><p className="mt-3 text-3xl font-semibold">{repo.accounts.length}</p></Card>
        <Card><p className="text-sm text-muted-foreground">家庭净资产</p><p className="number mt-3 text-3xl font-semibold">{formatMoney(repo.snapshot.netWorthCny, "CNY", true)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">可投资目标资产</p><p className="number mt-3 text-3xl font-semibold">{formatMoney(repo.snapshot.investableAssetsCny, "CNY", true)}</p></Card>
        <Card><p className="text-sm text-muted-foreground">目标纳入比例</p><p className="number mt-3 text-3xl font-semibold">{formatPercent(repo.snapshot.investableAssetsCny / repo.snapshot.netWorthCny)}</p></Card>
      </section>
      {repo.accounts.length === 0 ? <Card><p className="text-sm text-muted-foreground">暂无账户。请先创建现金、券商、基金、房产或公司内部股票账户，再通过交易流水或手动估值建立资产闭环。</p></Card> : null}

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>{["账户", "币种", "资产余额", "可用金额", "资产数量", "状态", "计入目标", "说明"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr>
            </thead>
            <tbody>
              {accountRows.map(({ account, items, total }) => (
                <tr key={account.id} className="border-t border-border/35">
                  <td className="px-4 py-3"><div className="font-medium">{account.name}</div><div className="text-xs text-muted-foreground">{account.institution}</div></td>
                  <td className="px-4 py-3">{account.currencies.join(" / ")}</td>
                  <td className="number px-4 py-3 font-medium">{formatMoney(total, "CNY")}</td>
                  <td className="number px-4 py-3">{formatMoney(account.includeInInvestableGoal ? total : 0, "CNY")}</td>
                  <td className="px-4 py-3">{items.length}</td>
                  <td className="px-4 py-3"><StatusBadge status={account.liquidityStatus} /></td>
                  <td className="px-4 py-3"><Badge tone={account.includeInInvestableGoal ? "success" : "neutral"}>{account.includeInInvestableGoal ? "计入" : "不计入"}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{account.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <CardHeader><CardTitle>资产类别统计</CardTitle></CardHeader>
          <div className="space-y-3">
            {repo.snapshot.byAssetType.map((item) => (
              <div key={item.key} className="rounded-2xl border border-border/30 bg-muted/35 p-4">
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span className="number font-medium">{formatPercent(item.ratio)}</span>
                </div>
                <p className="number mt-2 text-sm text-muted-foreground">{formatMoney(item.valueCny, "CNY")}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
      {repo.mode === "supabase" ? (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader><CardTitle>新建账户</CardTitle></CardHeader>
            <form action={createAccountAction} className="grid gap-3">
              <input className="aurora-input h-10 px-3 text-sm" name="name" placeholder="账户名称" required />
              <input className="aurora-input h-10 px-3 text-sm" name="institution" placeholder="机构" />
              <select className="aurora-input h-10 px-3 text-sm" name="accountType" defaultValue="brokerage"><option value="brokerage">券商</option><option value="bank">银行</option><option value="fund_platform">基金平台</option><option value="cash">现金</option><option value="property">房产</option><option value="private_equity">公司内部股票/私募</option><option value="other">其他</option></select>
              <select className="aurora-input h-10 px-3 text-sm" name="currency" defaultValue="CNY"><option>CNY</option><option>USD</option><option>HKD</option></select>
              <select className="aurora-input h-10 px-3 text-sm" name="liquidityStatus" defaultValue="liquid"><option value="liquid">可流动</option><option value="restricted">受限</option><option value="illiquid">低流动</option></select>
              <label className="text-sm text-muted-foreground"><input className="mr-2" name="isIncludedInNetWorth" type="checkbox" defaultChecked />计入家庭净资产</label>
              <label className="text-sm text-muted-foreground"><input className="mr-2" name="isIncludedInInvestableAssets" type="checkbox" defaultChecked />计入可自由投资金融资产</label>
              <textarea className="aurora-input min-h-20 px-3 py-2 text-sm" name="notes" placeholder="说明" />
              <Button type="submit">创建账户</Button>
            </form>
          </Card>
          <Card>
            <CardHeader><CardTitle>归档账户</CardTitle></CardHeader>
            <div className="grid gap-2">
              {repo.operational.accounts.map((account) => (
                <form key={account.id} action={archiveAccountAction} className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/25 p-3">
                  <input type="hidden" name="id" value={account.id} />
                  <span className="text-sm">{account.name}</span>
                  <Button size="sm" variant="secondary" type="submit">归档</Button>
                </form>
              ))}
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return <div><h1 className="text-3xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{sub}</p></div>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "success" | "warning" | "neutral" | "danger" }> = {
    tradable: { label: "可交易", tone: "success" },
    locked: { label: "锁定", tone: "warning" },
    restricted: { label: "不可流通", tone: "danger" },
    external: { label: "外部资产", tone: "neutral" }
  };
  const item = map[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
