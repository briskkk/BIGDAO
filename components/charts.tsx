"use client";

import {
  Area,
  AreaChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AllocationSlice, GoalScenario } from "@/types/domain";
import { formatMoney } from "@/lib/format";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-muted)"
];

const tooltipStyle = {
  background: "rgba(8, 19, 31, 0.94)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "14px",
  color: "var(--text-primary)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.32)"
};

export function AllocationDonut({ data }: { data: AllocationSlice[] }) {
  const total = data.reduce((sum, item) => sum + item.valueCny, 0);
  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <defs>
            {colors.map((color, index) => (
              <linearGradient key={color} id={`donut-${index}`} x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.96} />
                <stop offset="100%" stopColor={index % 2 === 0 ? "var(--accent-secondary)" : "var(--accent-primary)"} stopOpacity={0.72} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            dataKey="valueCny"
            nameKey="label"
            innerRadius="60%"
            outerRadius="82%"
            paddingAngle={3}
            stroke="rgba(7,17,31,0.72)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.key} fill={`url(#donut-${index % colors.length})`} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatMoney(value, "CNY", true)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</span>
        <span className="number mt-1 text-xl font-semibold">{formatMoney(total, "CNY", true)}</span>
      </div>
    </div>
  );
}

export function GoalPathChart({ scenarios }: { scenarios: GoalScenario[] }) {
  const data = scenarios[0].points.map((point, index) => {
    const row: Record<string, number> = { year: point.year };
    scenarios.forEach((scenario) => {
      row[scenario.name] = scenario.points[index].amountCny / 10000;
    });
    return row;
  });
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(145,180,220,0.09)" vertical={false} />
          <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `${v}年`} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickFormatter={(v) => `${v}万`} width={56} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value.toFixed(0)} 万元`} labelFormatter={(label) => `第 ${label} 年`} />
          <Line type="monotone" dataKey="保守" stroke="var(--chart-muted)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="基准" stroke="var(--accent-primary)" strokeWidth={3} dot={false} activeDot={{ r: 5, stroke: "var(--bg-base)", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="乐观" stroke="var(--accent-secondary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniPerformanceChart() {
  const data = [
    { month: "1月", value: 92 },
    { month: "2月", value: 95 },
    { month: "3月", value: 93 },
    { month: "4月", value: 99 },
    { month: "5月", value: 103 },
    { month: "6月", value: 108 }
  ];
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="wealthArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(145,180,220,0.08)" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="value" stroke="var(--accent-primary)" fill="url(#wealthArea)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
