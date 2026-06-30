import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getWealthRepository } from "@/lib/repository";
import { generateInsights } from "@/lib/rules";

export default function InsightsPage() {
  const repo = getWealthRepository();
  const insights = generateInsights({ ...repo, rules: repo.strategyRules, goal: repo.goal });
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-semibold">AI 策略 Insights</h1><p className="mt-2 text-sm text-muted-foreground">当前内容来自 mock rule engine，不调用 LLM，不接真实市场数据。</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-muted-foreground">未处理</p><p className="mt-3 text-3xl font-semibold">{insights.filter((item) => !item.handled).length}</p></Card>
        <Card><p className="text-sm text-muted-foreground">高优先级</p><p className="mt-3 text-3xl font-semibold">{insights.filter((item) => item.priority === "高").length}</p></Card>
        <Card><p className="text-sm text-muted-foreground">规则数量</p><p className="mt-3 text-3xl font-semibold">{repo.strategyRules.length}</p></Card>
      </div>
      <div className="grid gap-4">
        {insights.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div>
                <div className="mb-2 flex flex-wrap gap-2"><Badge tone={toneForType(item.type)}>{item.type}</Badge><Badge tone={item.priority === "高" ? "danger" : item.priority === "中" ? "warning" : "neutral"}>{item.priority}优先级</Badge><Badge>{item.handled ? "已处理" : "未处理"}</Badge></div>
                <CardTitle>{item.title}</CardTitle>
              </div>
              <span className="text-sm text-muted-foreground">{item.updatedAt}</span>
            </CardHeader>
            <div className="grid gap-4 md:grid-cols-3">
              <Block title="数据依据" text={item.evidence} />
              <Block title="建议动作" text={item.action} />
              <Block title="风险说明" text={item.riskNote} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return <div className="rounded-lg bg-muted/55 p-4"><h3 className="text-sm font-medium">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function toneForType(type: string) {
  if (type === "风险") return "danger" as const;
  if (type === "机会") return "success" as const;
  if (type === "再平衡") return "primary" as const;
  return "warning" as const;
}
