import {
  AIWealthBrief,
  AllocationRiskPanel,
  CommandBar,
  GoalForecastPanel,
  LiquidityWaterfall,
  MarketAndExposurePanel,
  OperationalFeed,
  WealthTrajectoryPanel
} from "@/components/dashboard/dashboard-panels";
import { buildHoldingViews, projectGoal } from "@/lib/calculations";
import { getWealthRepository } from "@/lib/repository";
import { generateInsights } from "@/lib/rules";

export default async function DashboardPage() {
  const repo = await getWealthRepository();
  const views = buildHoldingViews(repo);
  const scenarios = projectGoal(repo.goal);
  const insights = generateInsights({ ...repo, rules: repo.strategyRules, goal: repo.goal });

  return (
    <div className="space-y-5">
      <DataModeBanner mode={repo.mode} updatedAt={repo.operational.updatedAt} />
      <CommandBar />
      <div className="grid grid-cols-12 gap-5">
        <WealthTrajectoryPanel repo={repo} scenarios={scenarios} />
        <AIWealthBrief repo={repo} insights={insights} />
        <LiquidityWaterfall repo={repo} views={views} />
        <AllocationRiskPanel repo={repo} views={views} />
        <GoalForecastPanel repo={repo} scenarios={scenarios} />
        <MarketAndExposurePanel repo={repo} views={views} />
        <OperationalFeed repo={repo} views={views} />
      </div>
    </div>
  );
}

function DataModeBanner({ mode, updatedAt }: { mode: string; updatedAt: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-muted/25 px-4 py-2 text-xs text-muted-foreground">
      数据模式：<span className="text-primary">{mode === "demo" ? "Demo Mode / Mock Repository" : "Supabase 持久化账本"}</span>
      <span className="ml-3">更新时间：{new Date(updatedAt).toLocaleString("zh-CN")}</span>
    </div>
  );
}
