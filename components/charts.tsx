"use client";

import {
  Area,
  AreaChart,
  Cell,
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

const colors = ["#123d2b", "#6f8f7a", "#c4a35a", "#6d7783", "#9b5f54", "#2f6f8f", "#a7b2a2"];

export function AllocationDonut({ data }: { data: AllocationSlice[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="valueCny" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.key} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatMoney(value, "CNY", true)} />
        </PieChart>
      </ResponsiveContainer>
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
          <XAxis dataKey="year" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}年`} />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}万`} width={56} />
          <Tooltip formatter={(value: number) => `${value.toFixed(0)} 万元`} labelFormatter={(label) => `第 ${label} 年`} />
          <Line type="monotone" dataKey="保守" stroke="#7d897f" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="基准" stroke="#123d2b" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="乐观" stroke="#c4a35a" strokeWidth={2} dot={false} />
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
              <stop offset="0%" stopColor="#123d2b" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#123d2b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#123d2b" fill="url(#wealthArea)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
