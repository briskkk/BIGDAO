# BIGDAO Family Wealth Dashboard

面向长期投资与家庭资产配置的家庭财富管理 Web 原型。它不是普通记账软件，而是一个用于观察家庭净资产、可自由投资金融资产、资产配置、长期目标和策略风险的“家庭财富驾驶舱”。

当前版本是第一阶段高保真前端原型：不连接真实银行、券商、行情源或 AI 服务，所有体验均基于统一 mock data 和可测试的领域计算函数。

## 功能概览

- 财富总览 Dashboard：家庭净资产、可投资金融资产、当日盈亏、累计收益、目标进度、资产配置、市场情绪和策略观察。
- 持仓 Portfolio：支持搜索、筛选、排序、表格/卡片视图切换，以及持仓详情抽屉。
- 资产与账户 Assets：展示账户余额、可用金额、资产数量、流动性状态，以及是否计入 1,500 万可投资资产目标。
- 交易账本 Ledger：支持前端模拟新增、编辑、删除和筛选交易记录。
- 目标 Goals：围绕“40 岁前可自由投资金融资产达到 1,500 万人民币”进行情景预测和投入测算。
- AI 策略 Insights：使用 mock rule engine 输出机会、风险、再平衡、目标偏离和数据提醒，不调用 LLM。
- 设置 Settings：基准货币、深浅色主题、刷新频率占位、家庭成员占位、导入导出占位、隐私说明和模拟数据重置入口。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- Radix UI primitives
- Lucide React icons
- Vitest

## 项目结构

```text
app/          路由与页面
components/   通用 UI、图表、布局和业务组件
hooks/        界面状态 hooks
lib/          mock 数据、repository、计算、格式化和规则引擎
types/        领域模型 TypeScript 类型
tests/        领域计算单元测试
```

核心领域对象包括：

- `Account`
- `Instrument`
- `Holding`
- `Transaction`
- `Quote`
- `FxRate`
- `AssetSnapshot`
- `Goal`
- `GoalScenario`
- `StrategyRule`
- `Insight`

## Mock 数据口径

样本数据模拟一个长期财富规划场景：

- 家庭净资产约 760 万人民币。
- 可自由投资、可交易、可调配金融资产约 100 万人民币。
- 房产约 450 万人民币，计入家庭净资产，不计入 1,500 万目标。
- 公司内部股票约 200 万人民币，标记为受限资产，计入家庭净资产，不计入 1,500 万目标。
- 可投资资产由现金、基金、黄金、ETF、港股和美股构成。
- 月可投资金额为 30,000 CNY。
- 默认目标为 40 岁前形成 15,000,000 CNY 可自由投资金融资产。

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

## 校验命令

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

## 风险边界

本项目当前只用于产品原型和规划体验验证：

- 不包含真实 API key。
- 不接入真实金融行情。
- 不连接真实银行或券商账户。
- 不提供交易下单或自动交易能力。
- AI 策略页内容来自本地规则引擎和模拟数据，不构成确定性投资建议。
- 目标预测仅用于家庭财务规划，不代表收益承诺。

## 下一阶段方向

- 增加数据库和本地持久化。
- 支持券商账单、基金平台账单和银行流水导入。
- 建立价格快照、手动估值和对账流程。
- 将策略规则引擎配置化。
- 增加家庭成员、资产归属、权限和审计日志。
