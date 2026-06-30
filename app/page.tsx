import { AlertTriangle, CalendarDays, CircleDollarSign, Landmark, TrendingUp, Wallet } from "lucide-react";
import { AllocationDonut, GoalPathChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildHoldingViews, projectGoal } from "@/lib/calculations";
import { formatMoney, formatPercent } from "@/lib/format";
import { getWealthRepository } from "@/lib/repository";
import { generateInsights } from "@/lib/rules";

export default function DashboardPage() {
  const repo = getWealthRepository();
  const views = buildHoldingViews(repo);
  const scenarios = projectGoal(repo.goal);
  const insights = generateInsights({ ...repo, rules: repo.strategyRules, goal: repo.goal });
  const topGainers = [...views].sort((a, b) => b.dailyReturn - a.dailyReturn).slice(0, 3);
  const topLosers = [...views].sort((a, b) => a.dailyReturn - b.dailyReturn).slice(0, 3);
  const targetGap = repo.goal.targetAmountCny - repo.snapshot.investableAssetsCny;
  const progress = (repo.snapshot.investableAssetsCny / repo.goal.targetAmountCny) * 100;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-lg bg-card p-6 shadow-soft ring-1 ring-border/45 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="primary">数据为模拟数据</Badge>
            <Badge>市场状态：模拟开盘中</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">家庭财富驾驶舱</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            2026 年 6 月 30 日 · 长期投资与家庭资产配置视图
          </p>
        </div>
        <div className="rounded-lg bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
          风险偏好：<span className="font-medium text-foreground">中性偏积极</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="家庭净资产" value={formatMoney(repo.snapshot.netWorthCny, "CNY")} sub="含房产与受限公司股票" icon={<Landmark className="h-5 w-5" />} />
        <MetricCard label="可自由投资金融资产" value={formatMoney(repo.snapshot.investableAssetsCny, "CNY")} sub="可交易、可调配资产" icon={<Wallet className="h-5 w-5" />} />
        <MetricCard label="当日盈亏" value={formatMoney(repo.snapshot.dailyPnlCny, "CNY")} sub={formatPercent(repo.snapshot.dailyPnlCny / repo.snapshot.investableAssetsCny)} trend={repo.snapshot.dailyPnlCny >= 0 ? "up" : "down"} icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="累计收益" value={formatMoney(repo.snapshot.cumulativePnlCny, "CNY")} sub="基于模拟成本口径" trend="up" icon={<CircleDollarSign className="h-5 w-5" />} />
        <MetricCard label="距离 1,500 万目标" value={formatMoney(targetGap, "CNY")} sub="目标口径不含房产与受限股票" trend="neutral" icon={<AlertTriangle className="h-5 w-5" />} />
        <Card>
          <div className="mb-5 text-sm text-muted-foreground">目标达成进度</div>
          <div className="number text-3xl font-semibold">{progress.toFixed(1)}%</div>
          <Progress value={progress} className="mt-5" />
          <p className="mt-3 text-sm text-muted-foreground">当前年龄 31，目标年龄 40</p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>按资产类别</CardTitle>
            <span className="text-sm text-muted-foreground">家庭总净资产口径</span>
          </CardHeader>
          <AllocationDonut data={repo.snapshot.byAssetType} />
          <AllocationList data={repo.snapshot.byAssetType} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>按市场</CardTitle>
            <span className="text-sm text-muted-foreground">CNY 统一折算</span>
          </CardHeader>
          <AllocationDonut data={repo.snapshot.byMarket} />
          <AllocationList data={repo.snapshot.byMarket} />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>持仓表现</CardTitle>
            <Badge tone="warning">集中度观察</Badge>
          </CardHeader>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <PerformanceList title="今日涨幅前三" items={topGainers} />
            <PerformanceList title="今日跌幅前三" items={topLosers} />
          </div>
          <div className="mt-5 rounded-lg bg-muted/60 p-4 text-sm leading-6 text-muted-foreground">
            港股科技与公司内部股票是当前最需要单独监控的集中度来源。最近交易以月度定投、港股科技回调加仓和黄金对冲补充为主。
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>财富目标路径</CardTitle>
            <span className="text-sm text-muted-foreground">保守 / 基准 / 乐观</span>
          </CardHeader>
          <GoalPathChart scenarios={scenarios} />
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div>月度投入：{formatMoney(repo.goal.monthlyContributionCny, "CNY")}</div>
            <div>目标年限：{repo.goal.targetAge - repo.goal.currentAge} 年</div>
            <div>保守假设：4.0% 年化</div>
            <div>基准假设：7.0% 年化</div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>市场情绪</CardTitle>
            <Badge>暂使用模拟数据</Badge>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {repo.marketMood.map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/55 p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{item.label}</span>
                  <span className={item.change >= 0 ? "text-success" : "text-danger"}>{item.change > 0 ? "+" : ""}{item.change}%</span>
                </div>
                <div className="number mt-2 text-xl font-semibold">{item.value}</div>
                <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>策略观察</CardTitle>
            <Badge tone="primary">mock rule engine</Badge>
          </CardHeader>
          <div className="space-y-3">
            {insights.slice(0, 5).map((item) => (
              <details key={item.id} className="rounded-lg bg-muted/55 p-4">
                <summary className="cursor-pointer text-sm font-medium">{item.title}</summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.evidence}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.action}</p>
              </details>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function AllocationList({ data }: { data: { key: string; label: string; valueCny: number; ratio: number }[] }) {
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{item.label}</span>
          <span className="number font-medium">{formatMoney(item.valueCny, "CNY", true)} · {formatPercent(item.ratio)}</span>
        </div>
      ))}
    </div>
  );
}

function PerformanceList({ title, items }: { title: string; items: ReturnType<typeof buildHoldingViews> }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.holding.id} className="flex items-center justify-between rounded-lg bg-muted/55 px-3 py-2 text-sm">
            <span>{item.instrument.name}</span>
            <span className={item.dailyReturn >= 0 ? "text-success" : "text-danger"}>{formatPercent(item.dailyReturn)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
