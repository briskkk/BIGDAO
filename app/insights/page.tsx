import { Activity, BrainCircuit, CheckCircle2, DatabaseZap, Radar, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getWealthRepository } from "@/lib/repository";
import { generateInsights } from "@/lib/rules";

export default async function InsightsPage() {
  const repo = await getWealthRepository();
  const insights = generateInsights({ ...repo, rules: repo.strategyRules, goal: repo.goal });
  const highPriority = insights.filter((item) => item.priority === "高").length;
  const openCount = insights.filter((item) => !item.handled).length;
  return (
    <div className="space-y-6">
      <section className="aurora-panel rounded-[1.4rem] p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] xl:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone="primary">AI Wealth Intelligence</Badge>
              <Badge tone="success">Rule Engine Online</Badge>
              <Badge>Mock Data</Badge>
            </div>
            <h1 className="text-4xl font-semibold tracking-normal">AI 策略 Insights</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              系统正在基于家庭资产结构、目标差距、集中度和现金缓冲生成策略观察。当前内容来自 mock rule engine，不调用 LLM，不接真实市场数据。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <InsightStat label="未处理" value={String(openCount)} icon={<Activity className="h-4 w-4" />} />
            <InsightStat label="高优先级" value={String(highPriority)} icon={<Radar className="h-4 w-4" />} />
            <InsightStat label="规则数量" value={String(repo.strategyRules.length)} icon={<DatabaseZap className="h-4 w-4" />} />
          </div>
        </div>
      </section>

      <Card className="p-6">
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2 text-xl"><BrainCircuit className="h-5 w-5 text-primary" />AI Summary</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">当前家庭财富状态摘要</p>
          </div>
          <Badge tone="primary">Live Simulation</Badge>
        </CardHeader>
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl border border-primary/15 bg-primary/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary"><Sparkles className="h-4 w-4" />策略观察结论</div>
            <p className="text-sm leading-7 text-muted-foreground">
              可投资资产距离 1,500 万目标仍处于早期积累阶段；港股科技和公司内部股票是主要集中度来源；现金缓冲具备防守价值，应与月度投入计划共同管理。
            </p>
          </div>
          <div className="space-y-4 rounded-2xl border border-border/30 bg-muted/30 p-5">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">策略处理进度</span><span className="number">{Math.round(((insights.length - openCount) / insights.length) * 100)}%</span></div>
            <Progress value={((insights.length - openCount) / insights.length) * 100} />
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniSignal label="风险预算" value="可控但需跟踪" tone="warning" />
              <MiniSignal label="目标路径" value="需持续投入" tone="primary" />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {insights.map((item) => (
          <Card key={item.id} className="p-0">
            <div className="grid gap-0 overflow-hidden rounded-2xl lg:grid-cols-[0.28fr_1fr]">
              <div className={`border-b border-border/25 p-5 lg:border-b-0 lg:border-r ${panelTone(item.type)}`}>
                <div className="mb-5 flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/20 bg-current/10">
                    {item.handled ? <CheckCircle2 className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                  </span>
                  <Badge tone={toneForType(item.type)}>{item.type}</Badge>
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Priority</p>
                <p className="mt-2 text-2xl font-semibold">{item.priority}</p>
                <p className="mt-5 text-xs uppercase tracking-[0.16em] text-muted-foreground">Impact Scope</p>
                <p className="mt-2 text-sm text-foreground">{scopeForType(item.type)}</p>
              </div>
              <div className="p-5">
                <CardHeader className="mb-5">
                  <div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">更新时间：{item.updatedAt}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={item.priority === "高" ? "danger" : item.priority === "中" ? "warning" : "neutral"}>{item.priority}优先级</Badge>
                    <Badge>{item.handled ? "已处理" : "未处理"}</Badge>
                  </div>
                </CardHeader>
                <div className="grid gap-4 md:grid-cols-3">
                  <Block title="数据依据" text={item.evidence} />
                  <Block title="建议动作" text={item.action} />
                  <Block title="风险说明" text={item.riskNote} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-border/30 bg-muted/30 p-4"><h3 className="text-sm font-medium text-foreground">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function toneForType(type: string) {
  if (type === "风险") return "danger" as const;
  if (type === "机会") return "success" as const;
  if (type === "再平衡") return "primary" as const;
  return "warning" as const;
}

function panelTone(type: string) {
  if (type === "风险") return "text-danger bg-danger/5";
  if (type === "机会") return "text-success bg-success/5";
  if (type === "再平衡") return "text-primary bg-primary/5";
  if (type === "目标偏离") return "text-warning bg-warning/5";
  return "text-muted-foreground bg-muted/20";
}

function scopeForType(type: string) {
  if (type === "风险") return "集中度 / 资产安全边际";
  if (type === "机会") return "现金缓冲 / 投入节奏";
  if (type === "再平衡") return "资产配置 / 卫星仓";
  if (type === "目标偏离") return "长期目标 / 月度投入";
  return "数据质量 / 更新频率";
}

function InsightStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/30 bg-muted/35 p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-[0.16em]">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="number mt-3 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MiniSignal({ label, value, tone }: { label: string; value: string; tone: "primary" | "warning" }) {
  return (
    <div className="rounded-xl border border-border/25 bg-muted/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${tone === "primary" ? "text-primary" : "text-warning"}`}>{value}</p>
    </div>
  );
}
