"use client";

import { useMemo, useState } from "react";
import { GoalPathChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { projectGoal, requiredAnnualReturn, requiredMonthlyContribution } from "@/lib/calculations";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Goal } from "@/types/domain";

export function GoalsClient({ goal, mode, updatedAt }: { goal: Goal; mode?: string; updatedAt?: string }) {
  const [monthly, setMonthly] = useState(goal.monthlyContributionCny);
  const [baseReturn, setBaseReturn] = useState(0.07);
  const activeGoal = useMemo(() => ({ ...goal, monthlyContributionCny: monthly }), [goal, monthly]);
  const scenarios = useMemo(() => projectGoal(activeGoal, [Math.max(0, baseReturn - 0.03), baseReturn, baseReturn + 0.03]), [activeGoal, baseReturn]);
  const minMonthly = requiredMonthlyContribution(activeGoal, baseReturn);
  const neededReturn = requiredAnnualReturn(activeGoal);
  const progress = (goal.currentAmountCny / goal.targetAmountCny) * 100;

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-semibold">目标 Goals</h1><p className="mt-2 text-sm text-muted-foreground">预测用于规划，不代表保证收益；目标口径为可自由投资、可交易、可调配金融资产。{mode === "supabase" ? ` 当前值来自持久化账本，更新时间 ${updatedAt ? new Date(updatedAt).toLocaleString("zh-CN") : "-"}` : " 当前为 Demo Mode 模拟数据。"}</p></div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="目标金额" value={formatMoney(goal.targetAmountCny, "CNY")} sub={goal.name} />
        <MetricCard label="当前可投资资产" value={formatMoney(goal.currentAmountCny, "CNY")} sub={`${progress.toFixed(1)}% 已完成`} />
        <MetricCard label="最低月投入" value={formatMoney(minMonthly, "CNY")} sub={`按 ${formatPercent(baseReturn)} 年化估算`} />
        <MetricCard label="当前投入所需年化" value={formatPercent(neededReturn)} sub="二分法规划估算" />
      </section>
      <Card>
        <CardHeader><CardTitle>目标进度</CardTitle><span className="text-sm text-muted-foreground">31 岁至 40 岁</span></CardHeader>
        <Progress value={progress} />
        <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <span>当前年龄：{goal.currentAge}</span>
          <span>目标年龄：{goal.targetAge}</span>
          <span>剩余年限：{goal.targetAge - goal.currentAge} 年</span>
        </div>
      </Card>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader><CardTitle>三情景预测路径</CardTitle><span className="text-sm text-muted-foreground">保守 / 基准 / 乐观</span></CardHeader>
          <GoalPathChart scenarios={scenarios} />
        </Card>
        <Card>
          <CardHeader><CardTitle>参数控制</CardTitle></CardHeader>
          <Control label="月度投入" min={0} max={100000} step={1000} value={monthly} suffix="元" onChange={setMonthly} />
          <Control label="基准年化收益率" min={0} max={0.16} step={0.005} value={baseReturn} suffix="%" onChange={setBaseReturn} percent />
          <div className="mt-6 rounded-2xl border border-border/30 bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
            计算口径：每月月底投入，收益率按月复利折算；房产与公司内部受限股票不计入目标资产。预测结果仅用于家庭规划，不构成收益承诺或投资建议。
          </div>
        </Card>
      </section>
      <Card>
        <CardHeader><CardTitle>达成时间轴</CardTitle></CardHeader>
        <div className="grid gap-4 md:grid-cols-3">
          {scenarios.map((scenario) => {
            const final = scenario.points[scenario.points.length - 1].amountCny;
            return <div key={scenario.name} className="rounded-2xl border border-border/30 bg-muted/35 p-4"><p className="font-medium">{scenario.name}</p><p className="number mt-2 text-xl font-semibold">{formatMoney(final, "CNY", true)}</p><p className="mt-2 text-sm text-muted-foreground">年化假设 {formatPercent(scenario.annualReturn)}</p></div>;
          })}
        </div>
      </Card>
    </div>
  );
}

function Control({ label, value, min, max, step, suffix, percent, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; percent?: boolean; onChange: (value: number) => void }) {
  const display = percent ? (value * 100).toFixed(1) : value.toLocaleString("zh-CN");
  return (
    <label className="mb-5 block">
      <div className="mb-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="number font-medium">{display}{suffix}</span></div>
      <input className="w-full accent-[hsl(var(--primary))]" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
