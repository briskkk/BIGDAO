import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildHoldingViews } from "@/lib/calculations";
import { formatMoney, formatPercent } from "@/lib/format";
import { getWealthRepository } from "@/lib/repository";

export default function AssetsPage() {
  const repo = getWealthRepository();
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

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/70 text-left text-muted-foreground">
              <tr>{["账户", "币种", "资产余额", "可用金额", "资产数量", "状态", "计入目标", "说明"].map((head) => <th key={head} className="px-4 py-3 font-medium">{head}</th>)}</tr>
            </thead>
            <tbody>
              {accountRows.map(({ account, items, total }) => (
                <tr key={account.id} className="border-t border-border/70">
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
              <div key={item.key} className="rounded-lg bg-muted/55 p-4">
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
