"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Table2, X } from "lucide-react";
import { MiniPerformanceChart } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildHoldingViews, type HoldingView } from "@/lib/calculations";
import { cnAssetType, formatMoney, formatPercent } from "@/lib/format";
import type { WealthRepositoryData } from "@/lib/repository";
import { cn } from "@/lib/utils";

type Repo = WealthRepositoryData;
type ViewMode = "card" | "table";

export function PortfolioClient({ repo }: { repo: Repo }) {
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState("all");
  const [assetType, setAssetType] = useState("all");
  const [market, setMarket] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [sort, setSort] = useState("marketValue");
  const [mode, setMode] = useState<ViewMode>("table");
  const [selected, setSelected] = useState<HoldingView | null>(null);
  const views = useMemo(() => buildHoldingViews(repo), [repo]);
  const filtered = views
    .filter((view) => [view.instrument.name, view.instrument.symbol, view.account.name].join(" ").toLowerCase().includes(query.toLowerCase()))
    .filter((view) => account === "all" || view.account.id === account)
    .filter((view) => assetType === "all" || view.instrument.assetType === assetType)
    .filter((view) => market === "all" || view.instrument.market === market)
    .filter((view) => currency === "all" || view.instrument.currency === currency)
    .sort((a, b) => {
      if (sort === "pnl") return b.cumulativePnlCny - a.cumulativePnlCny;
      if (sort === "daily") return b.dailyPnlCny - a.dailyPnlCny;
      if (sort === "ratio") return b.investableRatio - a.investableRatio;
      return b.marketValueCny - a.marketValueCny;
    });

  return (
    <div className="space-y-6">
      <PageTitle title="持仓 Portfolio" sub={repo.mode === "demo" ? "可筛选、搜索、排序与详情观察；全部价格与估值均为模拟数据。" : "持仓由交易流水自动聚合生成，标准金融资产不直接手工编辑数量。缺少报价或估值时显示待估值。"} />
      <Card>
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,1fr)_auto]">
          <label className="aurora-input flex h-10 items-center gap-2 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="搜索名称、代码、账户" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <Select value={account} onChange={setAccount} options={[["all", "全部账户"], ...repo.accounts.map((item) => [item.id, item.name] as [string, string])]} />
          <Select value={assetType} onChange={setAssetType} options={[["all", "全部类型"], ["stock", "股票"], ["etf", "ETF"], ["fund", "基金"], ["gold", "黄金"], ["cash", "现金"], ["property", "房产"], ["company_stock", "公司内部股票"]]} />
          <Select value={market} onChange={setMarket} options={[["all", "全部市场"], ...Array.from(new Set(repo.instruments.map((item) => item.market))).map((item) => [item, item] as [string, string])]} />
          <Select value={currency} onChange={setCurrency} options={[["all", "全部币种"], ["CNY", "CNY"], ["USD", "USD"], ["HKD", "HKD"]]} />
          <Select value={sort} onChange={setSort} options={[["marketValue", "按市值"], ["pnl", "按收益"], ["daily", "按今日"], ["ratio", "按仓位"]]} />
          <Button variant="outline" size="icon" onClick={() => setMode(mode === "table" ? "card" : "table")} aria-label="切换视图">
            {mode === "table" ? <SlidersHorizontal className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
          </Button>
        </div>
      </Card>

      {filtered.length === 0 ? <Card><p className="text-sm text-muted-foreground">暂无持仓。请先在交易账本新增买入/申购/转入交易，或通过 CSV 导入交易流水。</p></Card> : mode === "table" ? <PortfolioTable items={filtered} onSelect={setSelected} /> : <PortfolioCards items={filtered} onSelect={setSelected} />}
      <HoldingDrawer item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PageTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return (
    <select className="aurora-input h-10 px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  );
}

function PortfolioTable({ items, onSelect }: { items: HoldingView[]; onSelect: (item: HoldingView) => void }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            {["名称", "类型", "市场", "账户", "数量", "成本价", "最新价/估值", "市值", "今日盈亏", "累计收益", "仓位", "更新时间"].map((head) => (
              <th key={head} className="px-4 py-3 font-medium">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.holding.id} className="cursor-pointer border-t border-border/35" onClick={() => onSelect(item)}>
              <td className="px-4 py-3">
                <div className="font-medium">{item.instrument.name}</div>
                <div className="text-xs text-muted-foreground">{item.instrument.symbol}</div>
              </td>
              <td className="px-4 py-3">{cnAssetType(item.instrument.assetType)}</td>
              <td className="px-4 py-3">{item.instrument.market}</td>
              <td className="px-4 py-3">{item.account.name}</td>
              <td className="number px-4 py-3">{item.holding.quantity.toLocaleString("zh-CN")}</td>
              <td className="number px-4 py-3">{formatMoney(item.holding.costPrice, item.instrument.currency)}</td>
              <td className="number px-4 py-3">
                <span>{formatMoney(item.quote.latestPrice, item.instrument.currency)}</span>
                <Badge className="ml-2">{item.instrument.priceLabel ?? "实时价格"}</Badge>
              </td>
              <td className="number px-4 py-3 font-medium">{formatMoney(item.marketValueCny, "CNY")}</td>
              <td className={cn("number px-4 py-3", item.dailyPnlCny >= 0 ? "text-success" : "text-danger")}>{formatMoney(item.dailyPnlCny, "CNY")}</td>
              <td className={cn("number px-4 py-3", item.cumulativePnlCny >= 0 ? "text-success" : "text-danger")}>{formatMoney(item.cumulativePnlCny, "CNY")} · {formatPercent(item.cumulativeReturn)}</td>
              <td className="number px-4 py-3">{formatPercent(item.investableRatio)}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.quote.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function PortfolioCards({ items, onSelect }: { items: HoldingView[]; onSelect: (item: HoldingView) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.holding.id} className="cursor-pointer" onClick={() => onSelect(item)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">{item.instrument.name}</h2>
              <p className="text-sm text-muted-foreground">{item.instrument.symbol} · {item.account.name}</p>
            </div>
            <Badge>{cnAssetType(item.instrument.assetType)}</Badge>
          </div>
          <div className="mt-5 number text-2xl font-semibold">{formatMoney(item.marketValueCny, "CNY")}</div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">累计收益</span>
            <span className={item.cumulativePnlCny >= 0 ? "text-success" : "text-danger"}>{formatMoney(item.cumulativePnlCny, "CNY")} · {formatPercent(item.cumulativeReturn)}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function HoldingDrawer({ item, onClose }: { item: HoldingView | null; onClose: () => void }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/55 backdrop-blur-sm" onClick={onClose}>
      <aside className="aurora-panel absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto rounded-none border-y-0 border-r-0 p-6 shadow-soft" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{item.instrument.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.instrument.symbol} · {item.instrument.market} · {item.instrument.currency}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="关闭详情"><X className="h-4 w-4" /></Button>
        </div>
        <MiniPerformanceChart />
        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="市值" value={formatMoney(item.marketValueCny, "CNY")} />
          <Info label="成本" value={formatMoney(item.costValueCny, "CNY")} />
          <Info label="今日盈亏" value={formatMoney(item.dailyPnlCny, "CNY")} />
          <Info label="累计收益率" value={formatPercent(item.cumulativeReturn)} />
        </div>
        <section className="mt-6 space-y-3">
          <h3 className="font-semibold">持仓理由</h3>
          <p className="text-sm leading-6 text-muted-foreground">{item.holding.thesis}</p>
          <div className="flex flex-wrap gap-2">{item.holding.riskTags.map((tag) => <Badge key={tag} tone="warning">{tag}</Badge>)}</div>
        </section>
        <section className="mt-6 rounded-2xl border border-primary/15 bg-primary/10 p-4">
          <h3 className="font-semibold">模拟 AI 观察</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">该持仓应与核心仓、现金缓冲和目标路径一起观察。这里展示的是规则引擎生成的策略观察，不是确定性投资建议。</p>
        </section>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border/30 bg-muted/35 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="number mt-2 font-semibold">{value}</p></div>;
}
