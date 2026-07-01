# BIGDAO Family Wealth OS

面向长期投资与家庭资产配置的家庭财富驾驶舱。它不是普通记账软件，而是用于观察家庭净资产、可自由投资金融资产、资产配置、风险敞口、长期目标和交易账本质量的财富管理应用。

当前阶段支持两种数据模式：

- **Demo Mode**：没有 Supabase 环境变量时自动启用，继续使用 mock repository，适合 UI 开发和演示。
- **Supabase Mode**：配置 Supabase URL 和 publishable key 后启用，登录后使用家庭空间、RLS、持久化账户、标的、交易、估值、目标和 CSV 导入批次。

## 技术栈

- Next.js App Router + TypeScript
- Tailwind CSS + Radix UI primitives + Lucide React
- Recharts
- Vitest
- Supabase：`@supabase/supabase-js` + `@supabase/ssr`

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

## 开发分支规则

后续新增功能、修复 bug 或调整项目配置时，不直接在 `main` 分支上修改。

- 新功能使用 `feature/<short-description>` 分支。
- Bug 修复使用 `bugfix/<short-description>` 分支。
- 修改完成后先在本地确认效果，并至少运行相关质量检查。
- 确认无误后再提交并推送到 GitHub 远端仓库。
- `main` 分支仅用于合并或接收已验证完成的修改。

## Demo Mode

不创建 `.env.local`，或不填写 Supabase 环境变量时，应用会自动进入 Demo Mode：

- 页面继续使用 mock repository。
- 不需要登录。
- 设置页和首页会显示当前数据模式。
- 新增交易只在浏览器状态中模拟，不写入数据库。

## Supabase 配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

填写：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

不要配置、提交或在前端使用 `service_role` key。`.env.local` 已由 `.gitignore` 忽略。

## Supabase 本地开发

需要先安装 Supabase CLI，然后运行：

```bash
supabase start
supabase db reset
```

数据库配置在 [supabase/config.toml](/Users/hua/Code/FamilyWealth/supabase/config.toml)，migration 在 [supabase/migrations/202606300001_family_wealth_os.sql](/Users/hua/Code/FamilyWealth/supabase/migrations/202606300001_family_wealth_os.sql)。

生成 TypeScript database types：

```bash
supabase gen types typescript --local > types/database.types.ts
```

当前仓库已提供一份手写的基础 [types/database.types.ts](/Users/hua/Code/FamilyWealth/types/database.types.ts)，后续接入真实项目时建议用 CLI 生成覆盖。

## 认证与家庭空间

配置 Supabase 后：

- 未登录访问业务页面会跳转 `/login`。
- 支持邮箱密码注册、登录、退出。
- 新用户注册后由数据库 trigger 自动创建：
  - `profiles`
  - `families`
  - `family_members` owner 角色
  - 默认现金账户
  - 默认 1,500 万可自由投资金融资产目标

## 数据模型

核心表：

- `profiles`
- `families`
- `family_members`
- `accounts`
- `instruments`
- `transactions`
- `manual_valuations`
- `quotes`
- `fx_rates`
- `goals`
- `import_batches`
- `audit_logs`

所有业务表启用 RLS。家庭级隔离通过 `is_family_member`、`has_family_role`、`current_user_family_ids` 辅助函数实现。`owner` 可管理家庭和成员，`editor` 可维护账户、交易、资产和目标，`viewer` 只读。账户、标的、交易和目标删除采用 `deleted_at` 软删除。

RLS 验证说明在 [tests/sql/rls-verification.sql](/Users/hua/Code/FamilyWealth/tests/sql/rls-verification.sql)。

## Repository 架构

页面不直接调用 Supabase。数据访问统一从 [lib/repository.ts](/Users/hua/Code/FamilyWealth/lib/repository.ts) 进入：

- Demo Mode：`MockWealthRepository`
- Supabase Mode：`SupabaseWealthRepository`
- DTO 与领域模型转换：`lib/repository/mappers.ts`

账本计算服务在：

- `lib/domain/ledger-calculator.ts`
- `lib/domain/portfolio-calculator.ts`
- `lib/domain/valuation-calculator.ts`
- `lib/domain/currency-calculator.ts`
- `lib/domain/goal-calculator.ts`

## 创建账户

Supabase Mode 登录后进入“资产账户”页：

1. 填写账户名称、机构、账户类型、币种、流动性状态。
2. 设置是否计入家庭净资产。
3. 设置是否计入可自由投资金融资产。
4. 提交后写入 `accounts`，并记录 `audit_logs`。

支持券商、银行、基金平台、现金、房产、公司内部股票/私募等类型。

## 导入 CSV

入口：

- 设置页 -> 数据导入导出
- 交易账本页 -> 导入 CSV
- `/imports`

流程：

1. 下载通用模板：`/api/csv-template`
2. 上传 UTF-8 CSV，浏览器解析，不上传原始文件到公开存储。
3. 映射字段：`trade_at`、`account`、`instrument_symbol`、`transaction_type`、`quantity`、`price`、`gross_amount`、`currency`、`fx_rate_to_base` 等。
4. 预览前 20 行，校验日期、类型、币种、金额、账户和标的。
5. 可选择自动创建未知账户和标的。
6. 确认后创建 `import_batches` 和 `transactions`，交易 `source = csv_import`，并写入审计日志。

重复检测 fingerprint：

```text
account + trade_at + instrument + transaction_type + quantity + gross_amount + reference_no
```

## Seed Demo Data

可用 publishable key + 测试用户密码执行，不需要 service role：

```bash
SEED_USER_EMAIL=you@example.com SEED_USER_PASSWORD=your-password npm run seed:demo
```

## 质量门禁

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## 数据安全边界

- 不提交真实密钥。
- 不在浏览器、日志、README 中使用 Supabase secret 或 service role key。
- 所有业务数据通过 RLS 做家庭级隔离。
- 交易、账户、目标等重要对象删除采用软删除。
- 修改、删除、导入交易写入 audit log。
- CSV 原始文件不上传公开存储。

## 当前未实现能力

- 实时股票、基金、ETF 行情。
- 券商、银行、支付宝、汇丰等真实账户自动同步。
- 自动交易或下单。
- AI 投资建议或 LLM 服务。
- 完整家庭成员邀请 UI。
- 复杂税务 lot / FIFO / LIFO 计算。
- 长期账单文件云存储。
- 实时 WebSocket 行情。
