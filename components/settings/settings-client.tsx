"use client";

import { Download, RefreshCcw, ShieldCheck, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsClient() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-semibold">设置 Settings</h1><p className="mt-2 text-sm text-muted-foreground">第一阶段提供偏好与占位能力，为后续真实数据接入预留入口。</p></div>
      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>基础偏好</CardTitle></CardHeader>
          <Row label="基准货币" value={<Badge tone="primary">CNY</Badge>} />
          <Row label="主题模式" value={<ThemeToggle />} />
          <Row label="市场数据刷新频率" value={<select className="h-10 rounded-lg border border-border bg-background px-3 text-sm"><option>手动刷新（占位）</option><option>15 分钟（占位）</option><option>每日收盘后（占位）</option></select>} />
        </Card>
        <Card>
          <CardHeader><CardTitle>家庭成员</CardTitle></CardHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {["本人", "配偶", "子女教育金", "家庭公共账户"].map((name) => <div key={name} className="rounded-lg bg-muted/55 p-4"><p className="font-medium">{name}</p><p className="mt-1 text-sm text-muted-foreground">占位，后续支持权限与资产归属</p></div>)}
          </div>
        </Card>
        <Card>
          <CardHeader><CardTitle>数据导入导出</CardTitle></CardHeader>
          <div className="flex flex-wrap gap-2"><Button variant="secondary"><Upload className="h-4 w-4" />导入 CSV 占位</Button><Button variant="secondary"><Download className="h-4 w-4" />导出 JSON 占位</Button></div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">后续可接入数据库、只读券商账单和手动对账流程；第一阶段不会连接真实账户。</p>
        </Card>
        <Card>
          <CardHeader><CardTitle>隐私与安全</CardTitle><ShieldCheck className="h-5 w-5 text-primary" /></CardHeader>
          <p className="text-sm leading-6 text-muted-foreground">当前所有数据为本地代码中的模拟样本，不包含真实 API key、银行登录、券商授权、交易下单或自动交易能力。</p>
          <Button className="mt-5" variant="outline"><RefreshCcw className="h-4 w-4" />重置模拟数据</Button>
        </Card>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><div>{value}</div></div>;
}
