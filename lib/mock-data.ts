import type {
  Account,
  FxRate,
  Goal,
  Holding,
  Instrument,
  MarketMood,
  Quote,
  StrategyRule,
  Transaction
} from "@/types/domain";

export const fxRates: FxRate[] = [
  { from: "CNY", to: "CNY", rate: 1, updatedAt: "2026-06-30 09:30" },
  { from: "USD", to: "CNY", rate: 7.18, updatedAt: "2026-06-30 09:30" },
  { from: "HKD", to: "CNY", rate: 0.92, updatedAt: "2026-06-30 09:30" }
];

export const accounts: Account[] = [
  {
    id: "hsbc-trade25",
    name: "汇丰 Trade25",
    institution: "HSBC",
    currencies: ["USD", "HKD"],
    liquidityStatus: "tradable",
    includeInInvestableGoal: true,
    description: "海外股票与 ETF 主账户"
  },
  {
    id: "cmb",
    name: "招商银行",
    institution: "CMB",
    currencies: ["CNY"],
    liquidityStatus: "tradable",
    includeInInvestableGoal: true,
    description: "家庭现金与活期理财"
  },
  {
    id: "alipay",
    name: "支付宝",
    institution: "Ant Group",
    currencies: ["CNY"],
    liquidityStatus: "tradable",
    includeInInvestableGoal: true,
    description: "货币基金与日常备用金"
  },
  {
    id: "a-share",
    name: "A 股证券账户",
    institution: "Mainland Broker",
    currencies: ["CNY"],
    liquidityStatus: "tradable",
    includeInInvestableGoal: true,
    description: "A 股 ETF 与场内基金"
  },
  {
    id: "fund",
    name: "基金账户",
    institution: "Fund Platform",
    currencies: ["CNY"],
    liquidityStatus: "tradable",
    includeInInvestableGoal: true,
    description: "中国基金与指数增强"
  },
  {
    id: "family-cash",
    name: "家庭现金账户",
    institution: "Family",
    currencies: ["CNY"],
    liquidityStatus: "tradable",
    includeInInvestableGoal: true,
    description: "月度投入与生活备用金"
  },
  {
    id: "company-stock",
    name: "公司内部股票账户",
    institution: "Employer",
    currencies: ["USD"],
    liquidityStatus: "restricted",
    includeInInvestableGoal: false,
    description: "受限股票，暂不计入可自由投资资产目标"
  },
  {
    id: "property",
    name: "房产账户",
    institution: "External",
    currencies: ["CNY"],
    liquidityStatus: "external",
    includeInInvestableGoal: false,
    description: "家庭自住房产，计入净资产，不计入 1,500 万目标"
  }
];

export const instruments: Instrument[] = [
  { id: "cash-cny", name: "人民币现金", symbol: "CNY", assetType: "cash", market: "现金", currency: "CNY", priceLabel: "盘点值" },
  { id: "cash-usd", name: "美元现金", symbol: "USD", assetType: "cash", market: "现金", currency: "USD", priceLabel: "盘点值" },
  { id: "nvda", name: "NVIDIA", symbol: "NVDA", assetType: "stock", market: "美股", currency: "USD" },
  { id: "tsm", name: "台积电 ADR", symbol: "TSM", assetType: "stock", market: "美股", currency: "USD" },
  { id: "pdd", name: "拼多多", symbol: "PDD", assetType: "stock", market: "美股", currency: "USD" },
  { id: "qqqm", name: "Invesco NASDAQ 100 ETF", symbol: "QQQM", assetType: "etf", market: "美股", currency: "USD" },
  { id: "voo", name: "Vanguard S&P 500 ETF", symbol: "VOO", assetType: "etf", market: "美股", currency: "USD" },
  { id: "smh", name: "VanEck Semiconductor ETF", symbol: "SMH", assetType: "etf", market: "美股", currency: "USD" },
  { id: "tencent", name: "腾讯控股", symbol: "0700.HK", assetType: "stock", market: "港股", currency: "HKD" },
  { id: "baba-hk", name: "阿里巴巴", symbol: "9988.HK", assetType: "stock", market: "港股", currency: "HKD" },
  { id: "meituan", name: "美团", symbol: "3690.HK", assetType: "stock", market: "港股", currency: "HKD" },
  { id: "hstech", name: "恒生科技 ETF", symbol: "3067.HK", assetType: "etf", market: "港股", currency: "HKD" },
  { id: "china-fund", name: "中证红利指数基金", symbol: "CN-FUND-01", assetType: "fund", market: "中国基金", currency: "CNY", priceLabel: "估值" },
  { id: "csi300", name: "沪深 300 ETF", symbol: "510300", assetType: "etf", market: "A股", currency: "CNY", priceLabel: "估值" },
  { id: "gold", name: "实物黄金与积存金", symbol: "AU9999", assetType: "gold", market: "黄金", currency: "CNY", priceLabel: "估值" },
  { id: "home", name: "家庭房产", symbol: "PROPERTY", assetType: "property", market: "其他", currency: "CNY", priceLabel: "盘点值" },
  { id: "rsu", name: "公司内部股票", symbol: "PRIVATE-RSU", assetType: "company_stock", market: "其他", currency: "USD", priceLabel: "盘点值" }
];

export const quotes: Quote[] = [
  { instrumentId: "cash-cny", latestPrice: 1, previousClose: 1, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "cash-usd", latestPrice: 1, previousClose: 1, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "nvda", latestPrice: 126, previousClose: 123.2, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "tsm", latestPrice: 182, previousClose: 178.5, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "pdd", latestPrice: 138, previousClose: 141.2, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "qqqm", latestPrice: 219, previousClose: 216.8, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "voo", latestPrice: 512, previousClose: 510.1, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "smh", latestPrice: 268, previousClose: 270.3, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "tencent", latestPrice: 398, previousClose: 392, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "baba-hk", latestPrice: 78.2, previousClose: 79.6, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "meituan", latestPrice: 122.4, previousClose: 119.8, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "hstech", latestPrice: 4.76, previousClose: 4.68, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "china-fund", latestPrice: 1.42, previousClose: 1.41, updatedAt: "2026-06-29 21:00" },
  { instrumentId: "csi300", latestPrice: 4.08, previousClose: 4.1, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "gold", latestPrice: 552, previousClose: 548, updatedAt: "2026-06-30 09:30" },
  { instrumentId: "home", latestPrice: 4500000, previousClose: 4500000, updatedAt: "2026-06-01 00:00" },
  { instrumentId: "rsu", latestPrice: 87.5, previousClose: 86.9, updatedAt: "2026-06-30 09:30" }
];

export const holdings: Holding[] = [
  { id: "h-cash-cny", accountId: "family-cash", instrumentId: "cash-cny", quantity: 120000, costPrice: 1, thesis: "家庭 6-9 个月风险缓冲与月度投入蓄水池。", riskTags: ["流动性", "机会成本低"] },
  { id: "h-cash-usd", accountId: "hsbc-trade25", instrumentId: "cash-usd", quantity: 8000, costPrice: 1, thesis: "海外账户待配置现金，保留美元购买力。", riskTags: ["汇率波动"] },
  { id: "h-nvda", accountId: "hsbc-trade25", instrumentId: "nvda", quantity: 45, costPrice: 92, thesis: "AI 算力核心暴露，控制单股初始仓位。", riskTags: ["估值", "单股波动"] },
  { id: "h-tsm", accountId: "hsbc-trade25", instrumentId: "tsm", quantity: 40, costPrice: 145, thesis: "全球半导体制造基础设施。", riskTags: ["地缘", "周期"] },
  { id: "h-pdd", accountId: "hsbc-trade25", instrumentId: "pdd", quantity: 25, costPrice: 118, thesis: "中国消费互联网的高弹性卫星仓。", riskTags: ["监管", "竞争"] },
  { id: "h-qqqm", accountId: "hsbc-trade25", instrumentId: "qqqm", quantity: 65, costPrice: 188, thesis: "纳指科技核心仓，承担长期成长暴露。", riskTags: ["科技集中"] },
  { id: "h-voo", accountId: "hsbc-trade25", instrumentId: "voo", quantity: 25, costPrice: 455, thesis: "美股宽基核心仓，作为全球权益底仓。", riskTags: ["美元资产"] },
  { id: "h-smh", accountId: "hsbc-trade25", instrumentId: "smh", quantity: 18, costPrice: 238, thesis: "AI 产业链卫星仓。", riskTags: ["行业集中"] },
  { id: "h-tencent", accountId: "hsbc-trade25", instrumentId: "tencent", quantity: 400, costPrice: 342, thesis: "港股科技核心持仓，现金流质量较好。", riskTags: ["港股情绪", "监管"] },
  { id: "h-baba", accountId: "hsbc-trade25", instrumentId: "baba-hk", quantity: 1000, costPrice: 72, thesis: "中国电商与云业务修复仓位。", riskTags: ["竞争", "估值修复不确定"] },
  { id: "h-meituan", accountId: "hsbc-trade25", instrumentId: "meituan", quantity: 450, costPrice: 132, thesis: "本地生活平台型资产，卫星配置。", riskTags: ["利润率", "竞争"] },
  { id: "h-hstech", accountId: "hsbc-trade25", instrumentId: "hstech", quantity: 20000, costPrice: 4.22, thesis: "港股科技篮子化表达，避免单股过度集中。", riskTags: ["中国科技", "港币"] },
  { id: "h-china-fund", accountId: "fund", instrumentId: "china-fund", quantity: 50000, costPrice: 1.31, thesis: "红利低波补充，平衡成长仓波动。", riskTags: ["风格切换"] },
  { id: "h-csi300", accountId: "a-share", instrumentId: "csi300", quantity: 15000, costPrice: 3.9, thesis: "A 股宽基小比例配置。", riskTags: ["宏观周期"] },
  { id: "h-gold", accountId: "alipay", instrumentId: "gold", quantity: 90, costPrice: 505, thesis: "家庭资产的尾部风险对冲。", riskTags: ["无现金流", "金价波动"] },
  { id: "h-home", accountId: "property", instrumentId: "home", quantity: 1, costPrice: 4200000, thesis: "家庭自住房产，外部资产，不纳入可投资目标。", riskTags: ["低流动性", "区域价格"] },
  { id: "h-rsu", accountId: "company-stock", instrumentId: "rsu", quantity: 3185, costPrice: 64.2, thesis: "公司内部股票，暂受限，单独监控集中度。", riskTags: ["不可流通", "雇主集中"] }
];

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-06-28", accountId: "hsbc-trade25", instrumentId: "qqqm", type: "买入", quantity: 12, price: 216.2, amount: 2594.4, currency: "USD", fxRate: 7.18, fee: 1.2, note: "月度定投纳指核心仓", tags: ["定投", "核心仓"] },
  { id: "t2", date: "2026-06-24", accountId: "fund", instrumentId: "china-fund", type: "申购", quantity: 3500, price: 1.4, amount: 4900, currency: "CNY", fxRate: 1, fee: 0, note: "红利低波补充", tags: ["基金", "防守"] },
  { id: "t3", date: "2026-06-21", accountId: "hsbc-trade25", instrumentId: "hstech", type: "买入", quantity: 4000, price: 4.55, amount: 18200, currency: "HKD", fxRate: 0.92, fee: 18, note: "港股科技回调加仓", tags: ["卫星仓"] },
  { id: "t4", date: "2026-06-18", accountId: "family-cash", type: "转账", amount: 30000, currency: "CNY", fxRate: 1, fee: 0, note: "本月可投资资金划拨", tags: ["月度投入"] },
  { id: "t5", date: "2026-06-12", accountId: "hsbc-trade25", type: "汇兑", amount: 4000, currency: "USD", fxRate: 7.19, fee: 35, note: "人民币换美元", tags: ["汇兑"] },
  { id: "t6", date: "2026-06-08", accountId: "alipay", instrumentId: "gold", type: "买入", quantity: 8, price: 540, amount: 4320, currency: "CNY", fxRate: 1, fee: 0, note: "黄金对冲补充", tags: ["黄金"] }
];

export const goal: Goal = {
  id: "goal-1500w",
  name: "40 岁前可自由投资金融资产达到 1,500 万",
  targetAmountCny: 15000000,
  currentAge: 31,
  targetAge: 40,
  monthlyContributionCny: 30000,
  currentAmountCny: 0
};

export const marketMood: MarketMood[] = [
  { label: "VIX", value: "16.8", change: -0.6, note: "波动率温和" },
  { label: "VXN", value: "21.4", change: 0.9, note: "科技股波动略升" },
  { label: "USD/CNY", value: "7.18", change: 0.03, note: "美元小幅偏强" },
  { label: "纳指", value: "18,920", change: 0.7, note: "成长风格延续" },
  { label: "标普 500", value: "5,488", change: 0.3, note: "宽基稳定" },
  { label: "恒生科技", value: "4,260", change: 1.2, note: "情绪修复" }
];

export const strategyRules: StrategyRule[] = [
  { id: "r-hstech", title: "恒生科技仓位区间", type: "再平衡", priority: "中", evaluate: "allocation_range" },
  { id: "r-single", title: "单一个股仓位", type: "风险", priority: "中", evaluate: "single_position" },
  { id: "r-rsu", title: "公司内部股票集中度", type: "风险", priority: "高", evaluate: "restricted_stock" },
  { id: "r-cash", title: "现金缓冲识别", type: "机会", priority: "低", evaluate: "cash_buffer" },
  { id: "r-goal", title: "目标达成缺口", type: "目标偏离", priority: "高", evaluate: "goal_gap" }
];
