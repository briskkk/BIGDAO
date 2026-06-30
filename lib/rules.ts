import { buildHoldingViews } from "@/lib/calculations";
import type { Account, FxRate, Goal, Holding, Insight, Instrument, Quote, StrategyRule } from "@/types/domain";
import { formatMoney, formatPercent } from "@/lib/format";

interface RuleInput {
  accounts: Account[];
  holdings: Holding[];
  instruments: Instrument[];
  quotes: Quote[];
  fxRates: FxRate[];
  rules: StrategyRule[];
  goal: Goal;
}

export function generateInsights(input: RuleInput): Insight[] {
  const views = buildHoldingViews(input);
  const investable = input.goal.currentAmountCny;
  const netWorth = views.reduce((sum, view) => sum + view.marketValueCny, 0);
  const hstech = views.filter((view) => view.instrument.id === "hstech").reduce((sum, view) => sum + view.marketValueCny, 0);
  const companyStock = views.filter((view) => view.instrument.assetType === "company_stock").reduce((sum, view) => sum + view.marketValueCny, 0);
  const cash = views.filter((view) => view.instrument.assetType === "cash").reduce((sum, view) => sum + view.marketValueCny, 0);
  const largestStock = views
    .filter((view) => view.instrument.assetType === "stock")
    .sort((a, b) => b.marketValueCny - a.marketValueCny)[0];

  return input.rules.map((rule) => {
    if (rule.evaluate === "allocation_range") {
      const ratio = investable === 0 ? 0 : hstech / investable;
      return insight(rule, {
        title: "港股科技仓位接近配置上限",
        evidence: `恒生科技 ETF 当前约占可投资资产 ${formatPercent(ratio)}，规则区间为 8%-12%，上限为 15%。`,
        action: "建议观察新增买入节奏，优先用后续现金流补足宽基核心仓。",
        riskNote: "该观察基于模拟估值，不代表实时行情或确定性交易建议。"
      });
    }
    if (rule.evaluate === "single_position") {
      const ratio = largestStock ? largestStock.investableRatio : 0;
      return insight(rule, {
        title: "单一个股仓位需要持续监控",
        evidence: `${largestStock?.instrument.name ?? "最大个股"} 当前约占可投资资产 ${formatPercent(ratio)}，单一个股初始仓位参考上限为 5%。`,
        action: "建议新资金优先进入宽基或篮子资产，降低单股波动对目标路径的影响。",
        riskNote: "单股上限是风险预算口径，不是买卖触发线。"
      });
    }
    if (rule.evaluate === "restricted_stock") {
      const ratio = netWorth === 0 ? 0 : companyStock / netWorth;
      return insight(rule, {
        title: "公司内部股票占家庭净资产比例偏高",
        evidence: `受限公司股票约 ${formatMoney(companyStock, "CNY", true)}，占家庭净资产 ${formatPercent(ratio)}，且暂不可自由交易。`,
        action: "建议单独列入集中度风险看板，解禁后再评估分批调配方案。",
        riskNote: "该资产与职业收入来源相关，需避免收入与资产风险同向集中。"
      });
    }
    if (rule.evaluate === "cash_buffer") {
      const ratio = investable === 0 ? 0 : cash / investable;
      return insight(rule, {
        title: "现金应被识别为风险缓冲",
        evidence: `现金与类现金约占可投资资产 ${formatPercent(ratio)}，覆盖月度投入与家庭备用金需求。`,
        action: "建议保留基础流动性，再按计划把新增现金流投入核心仓。",
        riskNote: "现金并非低效资产，其作用是降低被动卖出风险。"
      });
    }
    return insight(rule, {
      title: "可投资资产距离 1,500 万目标仍需稳定投入",
      evidence: `当前可投资资产约 ${formatMoney(investable, "CNY", true)}，距离目标仍差 ${formatMoney(input.goal.targetAmountCny - investable, "CNY", true)}。`,
      action: "建议维持每月 30,000 元投入，并用年度复盘校准收益率假设。",
      riskNote: "预测路径只用于规划，不构成收益承诺。"
    });
  });
}

function insight(
  rule: StrategyRule,
  body: Pick<Insight, "title" | "evidence" | "action" | "riskNote">
): Insight {
  return {
    id: `insight-${rule.id}`,
    type: rule.type,
    priority: rule.priority,
    updatedAt: "2026-06-30 09:30",
    handled: false,
    ...body
  };
}
