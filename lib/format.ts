import type { Currency } from "@/types/domain";

export function formatMoney(value: number, currency: Currency = "CNY", compact = false) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 0
  }).format(value);
}

export function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function cnAssetType(type: string) {
  const map: Record<string, string> = {
    cash: "现金",
    fund: "基金",
    etf: "ETF",
    stock: "股票",
    gold: "黄金",
    property: "房产",
    company_stock: "公司内部股票"
  };
  return map[type] ?? type;
}
