"use client";

import Link from "next/link";
import {
  BrainCircuit,
  CalendarDays,
  Clock3,
  DatabaseZap,
  FileInput,
  Gauge,
  Landmark,
  LineChart as LineChartIcon,
  Plus,
  RefreshCw,
  ShieldCheck,
  Target,
  UserCircle,
  Wallet
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { HoldingView } from "@/lib/calculations";
import { groupAllocation, requiredMonthlyContribution } from "@/lib/calculations";
import { cnAssetType, formatMoney, formatPercent } from "@/lib/format";
import type { WealthRepositoryData } from "@/lib/repository";
import type { AllocationSlice, GoalScenario, Insight } from "@/types/domain";

type Repo = WealthRepositoryData;

const chartTooltip = {
  background: "rgba(8, 19, 31, 0.94)",
  border: "1px solid rgba(145, 180, 220, 0.14)",
  borderRadius: "14px",
  color: "var(--text-primary)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.32)"
};

export function CommandBar() {
  return (
    <header className="rounded-2xl border border-border/25 bg-[rgba(8,19,31,0.72)] px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-base font-semibold">家庭财富驾驶舱</h1>
              <p className="text-xs text-muted-foreground">家庭财富操作系统</p>
            </div>
          </div>
          <SystemMeta icon={<CalendarDays className="h-3.5 w-3.5" />} text="2026 年 6 月 30 日" />
          <SystemMeta icon={<Clock3 className="h-3.5 w-3.5" />} text="更新 09:30" />
          <SystemMeta icon={<DatabaseZap className="h-3.5 w-3.5" />} text="模拟开盘中" tone="success" />
          <Badge tone="warning">DEMO</Badge>
          <Badge tone="primary">风险偏好：中性偏积极</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link href="/ledger" prefetch={false}><Plus className="h-4 w-4" />新增交易</Link>
          </Button>
          <Button variant="secondary" size="sm"><FileInput className="h-4 w-4" />导入账本</Button>
          <Button variant="secondary" size="sm"><RefreshCw className="h-4 w-4" />刷新估值</Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="用户入口"><UserCircle className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
  );
}

export function WealthTrajectoryPanel({
  repo,
  scenarios
}: {
  repo: Repo;
  scenarios: GoalScenario[];
}) {
  const data = buildTrajectoryData(repo, scenarios);
  const targetGap = repo.goal.targetAmountCny - repo.snapshot.investableAssetsCny;
  const achieveLabel = getAchieveLabel(repo.goal.targetAmountCny, scenarios[1]);
  const dailyRatio = safeRatio(repo.snapshot.dailyPnlCny, repo.snapshot.investableAssetsCny);

  return (
    <section className="wealth-module col-span-12 xl:col-span-8">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <LineChartIcon className="h-4 w-4 text-primary" />
            财富轨迹与目标路径
          </div>
          <div className="number text-5xl font-semibold tracking-normal sm:text-6xl">
            {formatMoney(repo.snapshot.netWorthCny, "CNY")}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            当前资产在目标路径早期，关键变量是月度投入持续性与受限资产解禁后的调配能力。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
          <MetricInline label="当日变化" value={formatMoney(repo.snapshot.dailyPnlCny, "CNY")} sub={formatPercent(dailyRatio)} tone="success" />
          <MetricInline label="累计收益" value={formatMoney(repo.snapshot.cumulativePnlCny, "CNY", true)} tone="success" />
          <MetricInline label="预计达成" value={achieveLabel} tone={achieveLabel.includes("40") ? "warning" : "primary"} />
        </div>
      </div>

      <div className="h-[360px] rounded-2xl bg-[rgba(7,17,31,0.28)] p-3">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 18, right: 22, bottom: 6, left: 0 }}>
            <defs>
              <linearGradient id="trajectoryFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.24} />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(145,180,220,0.08)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `${v}万`} width={56} />
            <Tooltip contentStyle={chartTooltip} formatter={(value: number) => `${value.toFixed(0)} 万元`} />
            <Area type="monotone" dataKey="netWorth" name="历史净资产" fill="url(#trajectoryFill)" stroke="var(--accent-primary)" strokeWidth={2.5} />
            <Line type="monotone" dataKey="targetPath" name="目标路径" stroke="var(--warning-token)" strokeDasharray="6 6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="forecast" name="预计达成路径" stroke="var(--accent-secondary)" strokeWidth={2.5} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <MetricInline label="家庭总净资产" value={formatMoney(repo.snapshot.netWorthCny, "CNY", true)} />
        <MetricInline label="可自由投资金融资产" value={formatMoney(repo.snapshot.investableAssetsCny, "CNY", true)} />
        <MetricInline label="当前目标差额" value={formatMoney(targetGap, "CNY", true)} tone="warning" />
        <MetricInline label="资产净值更新时间" value="今日 09:30" />
      </div>
    </section>
  );
}

export function AIWealthBrief({ insights, repo }: { insights: Insight[]; repo: Repo }) {
  const top = insights[0];
  return (
    <aside className="wealth-module col-span-12 xl:col-span-4">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Wealth Brief</h2>
        </div>
        <WealthHealthIndicator status="需关注" />
      </div>
      <p className="text-lg leading-8 text-foreground">
        当前资产结构总体稳定，但港股科技暴露接近预设上限。若本月新增资金为{" "}
        <span className="number text-primary">{formatMoney(repo.goal.monthlyContributionCny, "CNY")}</span>，建议优先补充全球宽基或保留为现金缓冲。
      </p>

      <div className="mt-6 space-y-4">
        <DecisionRow label="本月最重要行动" value="新增资金优先进入全球宽基或现金缓冲" tone="primary" />
        <DecisionRow label="资产配置偏离" value="港股科技接近上限，暂缓继续抬升" tone="warning" />
        <DecisionRow label="目标轨迹状态" value="落后于 1,500 万准时达标路径" tone="warning" />
        <DecisionRow label="风险敞口状态" value="公司内部股票需单独跟踪集中度" tone="danger" />
        <DecisionRow label="下次建议复盘" value="2026 年 7 月月度投入前" />
      </div>

      <details className="mt-6 rounded-2xl bg-muted/25 p-4">
        <summary className="cursor-pointer text-sm font-medium text-primary">查看数据依据</summary>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{top?.evidence}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{top?.action}</p>
      </details>
    </aside>
  );
}

export function LiquidityWaterfall({ repo, views }: { repo: Repo; views: HoldingView[] }) {
  const cash = sumBy(views.filter((view) => view.instrument.assetType === "cash"));
  const investable = repo.snapshot.investableAssetsCny;
  const invested = Math.max(0, investable - cash);
  const restricted = sumBy(views.filter((view) => !view.account.includeInInvestableGoal));
  const total = cash + invested + restricted;
  const monthlySpendEstimate = 45000;
  const bufferMonths = cash / monthlySpendEstimate;
  const segments = [
    { label: "现金", value: cash, color: "bg-success" },
    { label: "已投入资产", value: invested, color: "bg-primary" },
    { label: "受限/外部资产", value: restricted, color: "bg-warning" }
  ];

  return (
    <section className="wealth-module col-span-12 xl:col-span-5">
      <ModuleHeader icon={<Wallet className="h-5 w-5 text-primary" />} title="可投资资产与流动性" sub="现金 → 可用资金 → 已投入资产 → 受限资产" />
      <div className="mt-6">
        <div className="mb-3 flex h-4 overflow-hidden rounded-full bg-muted/45">
          {segments.map((segment) => (
            <span key={segment.label} className={segment.color} style={{ width: `${safeRatio(segment.value, total) * 100}%` }} />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {segments.map((segment) => (
            <MetricInline key={segment.label} label={segment.label} value={formatMoney(segment.value, "CNY", true)} />
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricInline label="本月可投入金额" value={formatMoney(repo.goal.monthlyContributionCny, "CNY")} tone="primary" />
        <MetricInline label="现金缓冲月数" value={`${bufferMonths.toFixed(1)} 个月`} tone={bufferMonths >= 6 ? "success" : "warning"} />
        <MetricInline label="流动性状态" value={bufferMonths >= 6 ? "健康" : "需关注"} tone={bufferMonths >= 6 ? "success" : "warning"} />
      </div>
    </section>
  );
}

export function AllocationRiskPanel({ repo, views }: { repo: Repo; views: HoldingView[] }) {
  const byCurrency = groupAllocation(views, (view) => view.instrument.currency, (key) => key, repo.snapshot.netWorthCny);
  const byIndustry = groupAllocation(views, (view) => inferIndustry(view), (key) => key, repo.snapshot.netWorthCny);
  const largest = [...views].sort((a, b) => b.marketValueCny - a.marketValueCny)[0];
  const restrictedRatio = safeRatio(sumBy(views.filter((view) => !view.account.includeInInvestableGoal)), repo.snapshot.netWorthCny);

  return (
    <section className="wealth-module col-span-12 xl:col-span-7">
      <ModuleHeader icon={<Gauge className="h-5 w-5 text-primary" />} title="资产配置与风险敞口" sub="从投资决策维度观察资产结构" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <AllocationBars title="资产类别" data={repo.snapshot.byAssetType.slice(0, 6)} />
        <div className="space-y-3">
          <RiskBand label="地区市场" data={repo.snapshot.byMarket.slice(0, 5)} />
          <RiskBand label="币种敞口" data={byCurrency} />
          <RiskBand label="行业敞口" data={byIndustry} />
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <ThresholdTile
          label="单一标的集中度"
          value={largest ? `${largest.instrument.name} ${formatPercent(safeRatio(largest.marketValueCny, repo.snapshot.netWorthCny))}` : "暂无持仓"}
          status={largest ? "观察" : "等待交易流水"}
        />
        <ThresholdTile label="受限资产占净资产" value={formatPercent(restrictedRatio)} status="偏高" tone="warning" />
        <ThresholdTile label="港股科技上限" value="接近 15% 阈值" status="需关注" tone="warning" />
      </div>
    </section>
  );
}

export function GoalForecastPanel({ repo, scenarios }: { repo: Repo; scenarios: GoalScenario[] }) {
  const gap = repo.goal.targetAmountCny - repo.goal.currentAmountCny;
  const minimumMonthly = requiredMonthlyContribution(repo.goal, 0.07);
  const progress = (repo.goal.currentAmountCny / repo.goal.targetAmountCny) * 100;
  const achieved = getAchieveLabel(repo.goal.targetAmountCny, scenarios[1]);
  return (
    <section className="wealth-module col-span-12 xl:col-span-7">
      <ModuleHeader icon={<Target className="h-5 w-5 text-primary" />} title="目标达成预测" sub="规划控制台：1,500 万可自由投资资产" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <div className="number text-4xl font-semibold">{progress.toFixed(1)}%</div>
          <Progress value={progress} className="mt-4" />
          <div className="mt-5 space-y-3">
            <MetricInline label="目标金额" value={formatMoney(repo.goal.targetAmountCny, "CNY", true)} />
            <MetricInline label="当前可投资资产" value={formatMoney(repo.goal.currentAmountCny, "CNY", true)} />
            <MetricInline label="剩余差额" value={formatMoney(gap, "CNY", true)} tone="warning" />
            <MetricInline label="准时达标最低月投入" value={formatMoney(minimumMonthly, "CNY", true)} tone="warning" />
          </div>
        </div>
        <ScenarioPaths scenarios={scenarios} />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MetricInline label="当前月投入" value={formatMoney(repo.goal.monthlyContributionCny, "CNY")} tone="primary" />
        <MetricInline label="预计达成时间" value={achieved} tone="warning" />
        <MetricInline label="路径状态" value="落后于准时达标路径" tone="warning" />
      </div>
    </section>
  );
}

export function MarketAndExposurePanel({ repo, views }: { repo: Repo; views: HoldingView[] }) {
  const topGainers = [...views].sort((a, b) => b.dailyReturn - a.dailyReturn).slice(0, 3);
  const topLosers = [...views].sort((a, b) => a.dailyReturn - b.dailyReturn).slice(0, 3);
  return (
    <section className="wealth-module col-span-12 xl:col-span-5">
      <ModuleHeader icon={<ShieldCheck className="h-5 w-5 text-primary" />} title="市场情绪与持仓风险" sub="模拟市场数据与持仓波动" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {repo.marketMood.slice(0, 4).map((item) => (
          <div key={item.label} className="rounded-2xl bg-muted/20 p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{item.label}</span>
              <span className={item.change >= 0 ? "text-success" : "text-danger"}>{item.change > 0 ? "+" : ""}{item.change}%</span>
            </div>
            <div className="number mt-2 text-xl font-semibold">{item.value}</div>
            <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ExposureList title="涨幅前三" items={topGainers} />
        <ExposureList title="跌幅前三" items={topLosers} />
      </div>
    </section>
  );
}

export function OperationalFeed({ repo, views }: { repo: Repo; views: HoldingView[] }) {
  const pendingValuations = views.filter((view) => view.instrument.priceLabel === "估值" || view.instrument.priceLabel === "盘点值").slice(0, 4);
  const cash = sumBy(views.filter((view) => view.instrument.assetType === "cash"));
  return (
    <section className="wealth-module col-span-12">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.85fr_0.95fr_1fr]">
        <FeedColumn title="最近交易">
          {repo.transactions.slice(0, 5).map((tx) => {
            const instrument = repo.instruments.find((item) => item.id === tx.instrumentId);
            return <FeedItem key={tx.id} title={instrument?.name ?? tx.type} meta={`${tx.date} · ${tx.type}`} value={formatMoney(tx.amount, tx.currency, true)} />;
          })}
        </FeedColumn>
        <FeedColumn title="待估值资产">
          {pendingValuations.map((view) => (
            <FeedItem key={view.holding.id} title={view.instrument.name} meta={view.instrument.priceLabel ?? "估值"} value={formatMoney(view.marketValueCny, "CNY", true)} />
          ))}
        </FeedColumn>
        <FeedColumn title="待处理事项">
          <FeedItem title="复核港股科技仓位" meta="接近配置上限" value="本周" tone="warning" />
          <FeedItem title="确认月度投入去向" meta="¥30,000 待分配" value="7 月前" tone="primary" />
          <FeedItem title="更新房产盘点值" meta="外部资产估值" value="月末" />
        </FeedColumn>
        <FeedColumn title="现金流与提醒">
          <FeedItem title="账户现金余额" meta="含 CNY / USD 现金" value={formatMoney(cash, "CNY", true)} tone="success" />
          <FeedItem title="未来一周提醒" meta="关注 VIX 与港股科技波动" value="3 项" />
          <FeedItem title="账本同步" meta="最近交易已模拟入账" value="正常" tone="success" />
        </FeedColumn>
      </div>
    </section>
  );
}

export function MetricInline({
  label,
  value,
  sub,
  tone = "neutral"
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger"
  }[tone];
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className={`number mt-1 truncate text-sm font-semibold ${toneClass}`}>{value}</p>
      {sub ? <p className={`number mt-0.5 text-xs ${toneClass}`}>{sub}</p> : null}
    </div>
  );
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "primary" }) {
  return <Badge tone={tone}>{label}</Badge>;
}

export function WealthHealthIndicator({ status }: { status: "健康" | "需关注" | "风险偏高" }) {
  const tone = status === "健康" ? "success" : status === "风险偏高" ? "danger" : "warning";
  return <StatusPill label={`健康度：${status}`} tone={tone} />;
}

function SystemMeta({ icon, text, tone = "neutral" }: { icon: React.ReactNode; text: string; tone?: "neutral" | "success" }) {
  return <span className={`flex items-center gap-1.5 text-xs ${tone === "success" ? "text-success" : "text-muted-foreground"}`}>{icon}{text}</span>;
}

function ModuleHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function DecisionRow({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "primary" | "warning" | "danger" }) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <div className="border-t border-border/20 pt-4 first:border-t-0 first:pt-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm leading-6 ${toneClass}`}>{value}</p>
    </div>
  );
}

function AllocationBars({ title, data }: { title: string; data: AllocationSlice[] }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-medium">{title}</h3>
      <div className="space-y-4">
        {data.length === 0 ? <EmptyPanelText text="暂无资产类别数据" /> : data.map((item) => (
          <div key={item.key}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="number">{formatPercent(item.ratio)}</span>
            </div>
            <Progress value={item.ratio * 100} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskBand({ label, data }: { label: string; data: AllocationSlice[] }) {
  const total = data.reduce((sum, item) => sum + item.valueCny, 0);
  return (
    <div className="rounded-2xl bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{data.length} 项</span>
      </div>
      <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-muted/45">
        {data.length === 0 ? (
          <span className="w-full bg-muted/50" />
        ) : data.map((item, index) => (
          <span
            key={item.key}
            className={index % 3 === 0 ? "bg-primary" : index % 3 === 1 ? "bg-success" : "bg-warning"}
            style={{ width: `${safeRatio(item.valueCny, total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {data.length === 0 ? <Badge>暂无数据</Badge> : data.slice(0, 4).map((item) => (
          <Badge key={item.key}>{item.label} {formatPercent(item.ratio)}</Badge>
        ))}
      </div>
    </div>
  );
}

function ThresholdTile({ label, value, status, tone = "primary" }: { label: string; value: string; status: string; tone?: "primary" | "warning" }) {
  return (
    <div className="rounded-2xl bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
      <p className={tone === "warning" ? "mt-2 text-xs text-warning" : "mt-2 text-xs text-primary"}>{status}</p>
    </div>
  );
}

function ScenarioPaths({ scenarios }: { scenarios: GoalScenario[] }) {
  const rows = scenarios.map((scenario) => ({
    name: scenario.name,
    annualReturn: scenario.annualReturn,
    final: scenario.points[scenario.points.length - 1].amountCny
  }));
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.name} className="rounded-2xl bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{row.name}</span>
            <span className="text-sm text-muted-foreground">年化 {formatPercent(row.annualReturn)}</span>
          </div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <span className="number text-xl font-semibold">{formatMoney(row.final, "CNY", true)}</span>
            <span className="text-sm text-muted-foreground">40 岁预计资产</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExposureList({ title, items }: { title: string; items: HoldingView[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="space-y-2">
        {items.length === 0 ? <EmptyPanelText text="暂无持仓波动数据" /> : items.map((item) => (
          <div key={item.holding.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{item.instrument.name}</span>
            <span className={item.dailyReturn >= 0 ? "number text-success" : "number text-danger"}>{formatPercent(item.dailyReturn)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-medium">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EmptyPanelText({ text }: { text: string }) {
  return <p className="rounded-xl border border-border/20 bg-muted/15 px-3 py-2 text-sm text-muted-foreground">{text}</p>;
}

function FeedItem({
  title,
  meta,
  value,
  tone = "neutral"
}: {
  title: string;
  meta: string;
  value: string;
  tone?: "neutral" | "primary" | "success" | "warning";
}) {
  const toneClass = tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/15 pb-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <span className={`number shrink-0 text-sm font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

function buildTrajectoryData(repo: Repo, scenarios: GoalScenario[]) {
  const currentNetWorth = repo.snapshot.netWorthCny / 10000;
  const currentInvestable = repo.snapshot.investableAssetsCny / 10000;
  const target = repo.goal.targetAmountCny / 10000;
  const history = [
    currentNetWorth * 0.86,
    currentNetWorth * 0.88,
    currentNetWorth * 0.9,
    currentNetWorth * 0.93,
    currentNetWorth * 0.95,
    currentNetWorth * 0.97,
    currentNetWorth
  ];
  const labels = ["12月前", "10月前", "8月前", "6月前", "4月前", "2月前", "当前", "2年", "4年", "6年", "8年", "40岁"];
  return labels.map((label, index) => {
    const forecastPoint = scenarios[1].points[Math.min(Math.max(index - 6, 0), scenarios[1].points.length - 1)];
    const forecastInvestable = forecastPoint.amountCny / 10000;
    return {
      label,
      netWorth: index < history.length ? history[index] : undefined,
      targetPath: index < 6 ? currentInvestable + ((target - currentInvestable) * index) / 11 : currentInvestable + ((target - currentInvestable) * index) / 11,
      forecast: index < 6 ? undefined : forecastInvestable + (repo.snapshot.netWorthCny - repo.snapshot.investableAssetsCny) / 10000
    };
  });
}

function getAchieveLabel(targetAmountCny: number, scenario: GoalScenario) {
  const point = scenario.points.find((item) => item.amountCny >= targetAmountCny);
  if (!point) return "40 岁前未达";
  return `${31 + point.year} 岁`;
}

function sumBy(views: HoldingView[]) {
  return views.reduce((sum, view) => sum + view.marketValueCny, 0);
}

function safeRatio(value: number, total: number) {
  return total === 0 ? 0 : value / total;
}

function inferIndustry(view: HoldingView) {
  if (view.instrument.assetType === "cash") return "现金缓冲";
  if (view.instrument.assetType === "property") return "房产";
  if (view.instrument.assetType === "company_stock") return "雇主股权";
  if (view.instrument.assetType === "gold") return "贵金属";
  if (view.instrument.symbol.includes("QQQ") || view.instrument.symbol.includes("SMH") || view.instrument.name.includes("科技")) return "科技成长";
  if (view.instrument.assetType === "fund" || view.instrument.assetType === "etf") return "宽基/基金";
  return cnAssetType(view.instrument.assetType);
}
