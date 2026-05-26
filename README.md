<a id="zh"></a>

# 📰 daily-brief · 10 分钟拥有你自己的 AI 每日简报

**中文** · [English ↓](#en)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/node-20%2B-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![LLM: pluggable](https://img.shields.io/badge/LLM-pluggable%20(5%20backends)-orange.svg)](#-llm-后端配置)
[![Deploy: GH Actions](https://img.shields.io/badge/deploy-GitHub%20Actions-2088ff.svg)](#a-github-actions--pages零基础设施推荐)
[![Demo: live](https://img.shields.io/badge/demo-leiting--eric.github.io%2FDailyBrief-brightgreen.svg)](https://leiting-eric.github.io/DailyBrief)
[![Stars](https://img.shields.io/github/stars/leiting-eric/DailyBrief?style=social)](https://github.com/leiting-eric/DailyBrief)

> **你的私人 AI 每日简报，跑在你自己掌控的基础设施上。** 23 个数据源 · LLM 摘要 · 21 个股票/加密标的**技术指标 + AI 交易点评** · 中英双语 · 5 个 LLM 后端可选。
>
> **三种部署任选**：[**🚀 5 分钟 Fork 到 GitHub Actions**](#a-github-actions--pages零基础设施推荐) · [**💻 本地一键装**](#b-本地一键装) · [**🤖 一句话让 AI Agent 帮你装**](#c-给-ai-agent-一句话装)。

**🌐 Live demos** —
[📰 leiting-eric.github.io/DailyBrief](https://leiting-eric.github.io/DailyBrief)（A 方式 · GitHub Actions + Pages）
·
[📰 daily.leiting.tech](https://daily.leiting.tech)（B 方式 · 本地服务器部署）

---

## ✨ 核心特性

- **🌍 全网多源聚合**：23 个数据源覆盖硅谷科技、AI 前沿、全球财经、国际时政、中文社区，一份报告通吃
- **📈 21 个标的实时行情**：美股 / 加密 / 港股 / 商品外汇 / 宏观信号，附 SMA / RSI / MACD 技术指标 + LLM 每日交易点评
- **🤖 5 个 LLM 后端可插拔**：Claude CLI / Anthropic / OpenAI / DeepSeek / MiniMax，一个环境变量切换，不绑死任何家
- **🌐 中英双语**：`REPORT_LOCALE=en` 一切——数据源、prompt、UI 文案、Bullish/Bearish stance 全套切英文
- **🚀 部署灵活**：GitHub Actions（零基础设施）/ 本地系统调度器 / 自托管服务器三选一，互不冲突可并存
- **🆓 数据源零 API key**：所有源走免费公开端点（RSS / 公开 JSON），不需要付费订阅
- **🔒 不绑定第三方阅读服务**：Feedly / Inoreader / Pocket 那些都不沾，你看了什么是你自己的事
- **📁 单文件 HTML**：CSS + JS 全内联，无外部依赖，scp 上服务器直接当首页

---

## 📚 信源图谱

23 个数据源（zh 模式）/ 22 个（en 模式），分布如下：

### 🧑‍💻 技术动态

<p align="center"><img src="docs/screenshots/tech.png" alt="技术动态 — GitHub Trending / X 推文 / AI 媒体" width="720"></p>

- **GitHub Trending** · 热榜每日刷新
- **AI 媒体**（merged）：OpenAI / DeepMind / Hugging Face Blog / TLDR AI / Smol AI / Latent Space / MIT Tech Review
- **X 推文**（attentionvc-ai）：精选 AI 圈大佬动态

### 📈 市场行情（非新闻源，21 个标的）

<p align="center"><img src="docs/screenshots/trading.png" alt="市场行情 — 21 ticker 技术指标 + AI 中文点评" width="720"></p>

- **美股 / ETF**：SPY / QQQ / AAPL / MSFT / NVDA / GOOGL / TSLA / META
- **加密**：BTC / ETH / SOL（附 alt.me 加密恐慌贪婪指数 + CoinGecko 总览）
- **中港**：BABA / PDD / JD / 0700.HK
- **商品外汇**：GC=F（黄金）/ CL=F（WTI 原油）/ USDCNY=X
- **宏观信号**：^VIX / ^TNX（10Y 美债）/ DXY（美元指数）

### 🌍 时政观察

<p align="center"><img src="docs/screenshots/politics.png" alt="时政观察 — BBC / Guardian / NYT 等国际要闻" width="720"></p>

**BBC / Guardian / NYT / NPR / DW 中文 / Al Jazeera / The Diplomat** — 7 家主流国际媒体的 World 频道

### 💰 财经要点

<p align="center"><img src="docs/screenshots/finance.png" alt="财经要点 — Bloomberg / WSJ / FT 全球财经" width="720"></p>

**Bloomberg / WSJ / FT / BBC Business / Economist** — 5 家全球财经主力

### 💬 社区讨论
- **zh 模式**：V2EX 热榜 / LinuxDo 热帖
- **en 模式**：Hacker News / Reddit r/stocks（自动替换上面两个）

> 完整列表 + 启用状态：`npm run sources` 查看；改源 → 编辑 [`sources.config.json`](sources.config.json)。

---

## 🚀 三种部署方式选一种

| 方式 | 适合谁 | 你需要 | 几分钟搞定 |
|---|---|---|---|
| **A. GitHub Actions + Pages** | 没服务器、不想常开电脑 | 一个 API key（Anthropic / OpenAI / DeepSeek / MiniMax 任一） | ~5 分钟（推荐） |
| **B. 本地一键装** | 有常开的电脑/服务器、想极致便宜 | Node 20+，可选 Claude Code 登录 | ~3 分钟 |
| **C. 给 AI Agent 一句话** | 懒、想让 Cursor / Codex / Claude Code 帮你装 | 同上 | 一句话 |

### A. GitHub Actions + Pages（零基础设施，推荐）

1. **Fork 这个 repo**（GitHub 右上角 Fork 按钮）
2. 进 Fork 的 repo → **Settings → Actions → General → Workflow permissions** 设为 **Read and write permissions**
3. **Settings → Pages → Build and deployment → Source** 选 "Deploy from a branch"，分支 `gh-pages` / 路径 `/ (root)`（第一次跑完才会出现 gh-pages 分支，先建 secret 再触发一次即可）
4. **🔑 配置 LLM 后端** —— 这步是关键。每个后端都要**一个 secret + 对应的 `LLM_BACKEND` variable**（不只是 secret），按下表对照填：

   > ⚠️ **最常踩的坑**：只加了 secret（比如 `DEEPSEEK_API_KEY`）忘了加 `LLM_BACKEND` variable —— workflow 默认 `LLM_BACKEND=anthropic`，所以无论你填的是哪家的 key，运行时都会报 `ANTHROPIC_API_KEY required`。两个都要加。

   | 你想用 | Secrets 标签加 | Variables 标签加 `LLM_BACKEND` | 大致成本 |
   |---|---|---|---|
   | 🟣 **Anthropic Sonnet**（默认，prompt 按 Sonnet 调优） | `ANTHROPIC_API_KEY` | 不填或填 `anthropic` | ~$0.03-0.05 / 天，月 < $2 |
   | 🐋 **DeepSeek**（便宜大碗，中文友好） | `DEEPSEEK_API_KEY` | `deepseek` | ~$0.01-0.02 / 天，月 < $1 |
   | 🟢 **OpenAI** | `OPENAI_API_KEY` | `openai` | gpt-4o-mini ~$0.02 / 天 |
   | 🔵 **MiniMax** | `MINIMAX_API_KEY` | `minimax` | 类似 DeepSeek 量级 |
   | 🌀 **中转站 / 反代 / 其他 OpenAI 兼容服务**（Moonshot / SiliconFlow / OpenRouter / 自建 Claude 反代 / 本地 Ollama / LM Studio 等） | `LLM_API_KEY` | `openai`（极少数 Anthropic 协议反代填 `anthropic`） | 看服务方定价 |

   位置：**Settings → Secrets and variables → Actions**，左边切换 Secrets / Variables 两个标签。

   > 🌀 **选了最后一行"中转站"的额外步骤**：Variables 还要加 `LLM_BASE_URL`（中转站给的 endpoint，如 `https://api.moonshot.cn/v1`）和 `LLM_MODEL`（如 `moonshot-v1-8k`）。不确定协议？默认 `LLM_BACKEND=openai` 覆盖 95% 中转站；如果跑挂报 404 / 协议错误再改成 `anthropic`。

5. （可选）同页 Variables 再加：
   - `LLM_MODEL` —— 覆盖该 backend 的默认模型（不填用 [`.env.example`](.env.example) 里列的默认）
   - `LLM_BASE_URL` —— 自定义 endpoint。**选了上面"中转站"那行的话必填**；本地 Ollama 填 `http://localhost:11434/v1`、LM Studio 填 `http://localhost:1234/v1`
   - `REPORT_LOCALE` —— `zh`（默认）或 `en`，控制数据源 + UI + prompt 全套切英文
   - `REPORT_TZ` —— IANA 时区名（默认 UTC），例 `Asia/Shanghai` / `America/Los_Angeles`。**同时影响触发时间和日期标签**
   - `REPORT_HOUR` —— 触发的小时（基于 `REPORT_TZ`），默认 `8`（早 8 点）。逗号分隔可多次触发，如 `8,18` = 早 8 + 晚 6
   - `REPORT_DAYS` —— 触发的星期（cron 风格，`0`=周日 ... `6`=周六），默认 `*`（每天）。例 `1-5` = 工作日；`1,3,5` = 周一三五
6. **Actions 标签 → 选 "Daily Brief" workflow → Run workflow** 手动触发一次

跑完后报告在 `https://<你的用户名>.github.io/<repo-名字>/`。之后**默认每天 `REPORT_TZ` 时区的 08:00 自动更新**（不设 `REPORT_TZ` 就是 UTC 08:00）。

> ⏰ **触发机制**：GitHub Actions 的 cron 只接受 UTC，所以工作流 cron 设置为**每小时跑一次**，里面有一个 `gate` 任务用 `REPORT_TZ` 把当前小时和 `REPORT_HOUR/REPORT_DAYS` 对照——匹配才往下跑 build，否则秒退。这样不论你在哪个时区都能精准命中本地时间，**夏令时也自动跟着切换**（IANA 时区数据库内置）。

**常用 schedule 配方：**

| 想要 | `REPORT_HOUR` | `REPORT_DAYS` |
|---|---|---|
| 每天 08:00（默认） | 不填或 `8` | 不填或 `*` |
| 每天早晚两次（8 + 18 点） | `8,18` | `*` |
| 工作日 09:00 | `9` | `1-5` |
| 周一/三/五 早 7 晚 9 两次 | `7,21` | `1,3,5` |
| 每 6 小时一次 | `0,6,12,18` | `*` |

只想要默认每天 08:00 本地时间，**只填 `REPORT_TZ` 一个变量就够了**（如 `Asia/Shanghai`），其他全部留空。

**💸 成本估算**：GitHub Actions 公开 repo 完全免费。Pages 公开 repo 也免费。唯一花钱的就是 LLM API 调用——DeepSeek 月成本不到 $1，Anthropic Sonnet < $2。

> ⚠️ 用 GH Actions 模式就意味着**用不了本地 `claude` CLI**——Claude Code 的 OAuth 登录在你本机，GitHub 的服务器看不到。如果你已经在 Max 订阅里，建议两条路并行：本地装（B 方式）用 Claude CLI 跑你自己的服务器版本，GH Actions 用 DeepSeek 跑 Pages 公开版本。两份报告独立，互不影响。

#### 🐛 A 方式常见坑

- **"Upgrade or make this repository public to enable Pages"** —— GitHub Pages 在 Free 账户的 Private repo 上不可用。Settings → General → Danger Zone → Change visibility 改 Public。Actions Secrets 在 Public repo 里依然加密保护，对其他人不可见
- **Variable name 报 "alphanumeric only"** —— 输入 `LLM_BACKEND` 时下划线被中文输入法替换成了全角 `＿`（U+FF3F）。切到英文输入法 Shift+`-` 重打
- **第一次跑完才能选 Pages source** —— Pages 设置页要求选已存在的分支，但 `gh-pages` 是首次 workflow 跑成功后才创建出来。顺序：配 secret → 触发 workflow → 跑完 → 回 Settings → Pages 选 `gh-pages`
- **Action 红 X 怎么看具体原因** —— 点失败的 build → 左边列出每个 step → 找有红 X 的那步点开看 log。最常见两类：`401/402` = API key 拼错或没余额；`403` = workflow permissions 没设成 Read and write
- **报错 `ANTHROPIC_API_KEY (or generic LLM_API_KEY) is required`，但我填的是别家的 key** —— 经典 secret/variable 不配对。Workflow 默认 `LLM_BACKEND=anthropic`，光填 `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` 不够，**必须同时去 Variables 标签加 `LLM_BACKEND=deepseek` / `openai`**。从 v1.x 起启动期会直接告诉你哪个 key 已设、应该把 `LLM_BACKEND` 改成什么
- **配齐了 secret + variable 还是报同样的错** —— 99% 是配置放错了作用域。GitHub 上有两个长得几乎一样的页面：
  - ✅ **Settings → Secrets and variables → Actions**（页眉是 "Repository secrets" / "Repository variables"）—— 本项目默认走这里
  - ⚠️ **Settings → Environments → \<某个 environment\>**（页眉是 "Environment secrets" / "Environment variables"）—— 这里的值**只有当 workflow job 显式声明了 `environment: <name>` 才会注入**；本项目默认 workflow 没声明，所以放这里运行时拿不到
  
  排查方法：进配置页面看页眉。如果写的是 "Environment ..." 你有**两种修法**任选其一：
  - **简单做法（推荐）**：把所有 secret **和** variable 从 Environment scope 移到 Repository scope（路径：Settings 左栏 → "Secrets and variables → Actions"，注意**不要从 "Environments" 进**），workflow 不用改。**特别提醒**：secret（如 `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY`）因为隐藏了值，最容易被忘掉只搬 variable 不搬 secret，导致换了个新错误（"key 未设置"）。两边都要搬完整
  - **保留 Environment 的做法**：编辑 `.github/workflows/daily.yml`，在 `gate` 和 `build` 两个 job 各加一行 `environment: <你的环境名>`（两个都要加，因为 `gate` 也读 `vars.REPORT_TZ` 等变量），名字必须跟 Settings → Environments 里建的一字不差。适合想用 environment 做审批门禁 / branch 限制的人
- **跑了 30 秒就挂（其他情况）** —— LLM API 返 400 / key 没余额 / 配额耗尽。看 step "Generate today's report" 的 log

### B. 本地一键装

```bash
# Linux / macOS
curl -sSL https://raw.githubusercontent.com/leiting-eric/DailyBrief/main/bootstrap.mjs | node

# Windows PowerShell
irm https://raw.githubusercontent.com/leiting-eric/DailyBrief/main/bootstrap.mjs | node -
```

这条命令会自动：
1. 检查 Node / git / claude CLI 是否就位（没装 claude CLI 只发警告，可继续走 API 后端）
2. `git clone` 到 `~/daily-brief`（Windows: `%USERPROFILE%\daily-brief`）
3. `npm install`
4. 注册系统定时（Windows Task Scheduler / macOS launchd / Linux cron，默认 08:00 本地时间）
5. 写 `~/.daily-brief-config` 记录项目路径
6. 在 `~/.claude/` 建符号链接让 Claude Code 的 skill 和 slash command 全局可用
7. 跑一次 `npm run dry-run` 烟测

**🎁 Claude Code 用户额外福利**：装完后任意目录都能 `/run-daily`、`/check-daily`，描述问题（"日报又挂了"）也能触发 `daily-brief` skill 自动加载。**其他 agent**（Cursor / Codex）没有 skill 加载机制，但定时任务跑得起来。手动触发用：

| 平台 | 手动触发 |
|---|---|
| Windows | `Start-ScheduledTask -TaskName DailyBrief` |
| macOS | `launchctl start com.daily-brief` |
| Linux | `node scripts/run-daily.mjs`（cron 不支持手动触发） |

自定义路径 / 触发时间：

```bash
node bootstrap.mjs --target /custom/path --at 07:30
```

**LLM 后端**：默认走本地 `claude` CLI（首次需在浏览器登录一次：`echo "hi" | claude --print --model sonnet`，登录后永久生效）。不用 Claude Code，或想换模型 / 换家 / 接中转，都在 `.env.local` 里改 —— 完整可复制的配置示例见下方 [🤖 LLM 后端配置](#-llm-后端配置)。

### C. 给 AI Agent 一句话装

无论你用哪个 AI Agent（Claude Code / Cursor / Codex / Continue.dev / OpenClaw 等），把下面这段发给它：

> 帮我装这个开源项目，按 README 的"本地一键装"流程跑 bootstrap，完成后告诉我下次自动触发的时间：
> https://github.com/leiting-eric/DailyBrief

项目里有 [`AGENTS.md`](AGENTS.md)（通用 agent 协议）+ [`.claude/skills/daily-brief/SKILL.md`](.claude/skills/daily-brief/SKILL.md)（Claude Code 专属，更详细），Agent 装完后能直接帮你诊断"今天报告没出来"、"加个新数据源"这类问题。

---

## 📋 前置要求

- **Node.js 20+** + **npm** + **git**（B/C 方式本地需要；A 方式不需要——GH Actions 容器自带）
- **一个能跑的 LLM**（任选其一）：Claude Code CLI 已登录 / Anthropic / OpenAI / DeepSeek / MiniMax 任一家的 API key
- 平台：Windows 10/11、macOS 12+、Linux（任一平台都支持，定时机制自动适配）

---

## 🔧 手动安装

```bash
# 1. clone + 依赖
git clone https://github.com/leiting-eric/DailyBrief.git
cd DailyBrief
npm install

# 2. 配置 LLM 后端
#    默认 claude CLI（如果没登录会引导你登录）：
echo "say hi in Chinese" | claude --print --model sonnet
#    或用其他 backend：cp .env.example .env.local 编辑 LLM_BACKEND 和对应 API key

# 3. 注册定时 + 启用全局 skill
node scripts/install.mjs --global
# 也可指定时间：node scripts/install.mjs --at 07:30 --global

# 4. 立即触发一次测试
# Windows:  Start-ScheduledTask -TaskName DailyBrief
# macOS:    launchctl start com.daily-brief
# Linux:    node scripts/run-daily.mjs
```

下次触发时机：
- **🪟 Windows** — 系统会自动唤醒电脑（如在睡眠），跑完再回睡
- **🍎 macOS** — launchd 不会主动唤醒，电脑睡着的话跳过这次（需要 `pmset wake schedule` 配合）
- **🐧 Linux** — cron 同理，挂起期间不跑

---

## 🛠️ 日常命令

| 命令 | 用途 | 耗时 |
|---|---|---|
| `npm run daily` | 手动完整跑一次 | 5-8 min |
| `npm run dry-run` | 只抓取不调 LLM，验证数据源 | ~30s |
| `npm run render [date]` | 改了 CSS/排版后重渲染 | <1s |
| `npm run regen-trading [date]` | 重做交易部分 | ~2 min |
| `npm run regen-enrich <cat:sub> [date]` | 补缺失的中文摘要 | ~30s |
| `npm run open` | 在 Chrome 打开今日报告 | 即时 |
| `npm run quota-report` | 看各 LLM backend 用量统计 | 即时 |
| `npm run sources` | 列出所有数据源（按 locale 标注启用/过滤状态）| 即时 |
| `npm run sources:check` | 仅校验 `sources.config.json` schema（适合 CI / pre-commit）| 即时 |
| `npm run serve` | 启动 Web 管理后台（仪表盘/配置/数据源编辑/一键运行），默认 http://localhost:3456 | 即时 |

---

## 📊 数据源配置

数据源以 JSON 数组形式集中存储在项目根的 [`sources.config.json`](sources.config.json) —— **唯一配置入口**，不需要改 TypeScript 代码即可加/禁/调整源。每条记录的字段：

| 字段 | 必填 | 说明 |
|---|---|---|
| `id` | ✓ | 全局唯一短标识（dispatch.ts 用 id 路由到对应 fetcher）|
| `name` | ✓ | UI 显示名 |
| `type` | ✓ | `rss` / `api` / `scrape` |
| `url` | ✓ | RSS feed 或 API endpoint |
| `category` | ✓ | `tech` / `finance` / `politics`，决定 L1 tab |
| `subcategory` |   | `tech` 下的 L2 分组（`github-trending` / `ai-news` / `x-viral` / `cn-community`）；`finance` 下统一 `news` |
| `enabled` |   | 默认 `true`，设 `false` 跳过抓取（保留记录便于回滚）|
| `useCurl` |   | 若该源被 Cloudflare TLS-fingerprint 拦了 Node undici，设 `true` 让 rss.ts 走 curl 子进程 |
| `lang` |   | `zh` 表示源内容是中文 — enrich 阶段会跳过它（无需把中文翻译成中文）|
| `locales` |   | 数组，标明该源出现在哪些 report locale 下。默认 `["zh", "en"]` |
| `notes` |   | 任意备注（如"被废弃因为 feed 死了"），运行时忽略 |

### 加一个 RSS 源

1. 编辑 `sources.config.json`，追加一条记录
2. 跑 `npm run sources:check` 校验 schema
3. `npm run dry-run` 抓一次验证拉取正常
4. 下次 `npm run daily` 自动包含

### 🌐 Locale 模式（zh / en）

通过 `REPORT_LOCALE` 环境变量切换：

```bash
# .env.local
REPORT_LOCALE=zh    # 默认 — 中文 mode，含 V2EX / LinuxDo / DW 中文等中文源
# REPORT_LOCALE=en  # 英文 mode — 自动过滤掉 zh-only 源，挂上 en-only 源
```

每个源在 JSON 里的 `locales` 字段决定它在哪些模式下出现：

- `["zh"]` — **仅中文 mode**（V2EX / LinuxDo / DW 中文）。英文用户读不懂，英文 mode 自动 drop
- `["en"]` — **仅英文 mode**（Hacker News / r/stocks 英文社区源，替代中文社区源）。zh mode 不显示
- `["zh", "en"]`（默认）— 两 mode 都参与（BBC / Bloomberg / WSJ / NYT 全球英文源 + AI 资讯源）

当前启用源（`enabled: true`）按 locale 分布：

| Locale | 启用源数 | 主要构成 |
|---|---|---|
| `zh` | 23 | 20 个全球英文源（附中文摘要）+ 3 个中文专属（V2EX / LinuxDo / DW 中文）|
| `en` | 22 | 20 个全球英文源 + 2 个英文社区（Hacker News + r/stocks）|

英文 mode 完整切换：HTML UI 文案、enrichment / digest / trading-commentary 三套 prompt、stance 词（"偏上行/偏下行/中性" → Bullish/Bearish/Neutral）、日期格式（zh-CN → en-GB）、Markdown 输出 —— 全部跟着 `REPORT_LOCALE` 切。**中文社区源在英文 mode 下被自动过滤掉**。

---

## 🤖 LLM 后端配置

项目通过 `LLM_BACKEND` 环境变量切换后端。**默认 `claude-cli`** —— 直接复用 Claude Code 已登录的认证，不需要额外配 API key。不用 Claude Code、或想走自己的 API key，按下表切换。

### 配置文件在哪

**本地安装**：所有 LLM 配置都在仓库根目录的 `.env.local`（被 gitignore 了，安全存 key）。第一次没有这个文件就 `cp .env.example .env.local`，编辑器打开按 backend 解开对应几行即可。改完保存就生效，不用重启 shell —— 所有入口脚本（`npm run daily` / `regen-trading` / `regen-enrich`）第一行都会 dotenv 预加载它。

**GitHub Actions 部署**：不需要 `.env.local`，改成在 Settings → Secrets and variables → Actions 里加（见上面 [A 方式](#a-github-actions--pages零基础设施推荐) 第 4 步）。

### 支持的 backend

| backend | API key 环境变量 | 默认 model | base URL |
|---|---|---|---|
| 🎯 `claude-cli` （默认）| 不需要，复用 Claude Code OAuth | `sonnet` | — |
| 🟣 `anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` | `api.anthropic.com` |
| 🟢 `openai` | `OPENAI_API_KEY` | `gpt-4o-mini` | `api.openai.com/v1` |
| 🐋 `deepseek` | `DEEPSEEK_API_KEY` | `deepseek-v4-flash` | `api.deepseek.com/v1` |
| 🔵 `minimax` | `MINIMAX_API_KEY` | `MiniMax-M2.7` | `api.minimax.io/v1` <sup>1</sup> |

<sup>1</sup> 中国大陆访问设 `MINIMAX_BASE_URL=https://api.minimaxi.com/v1`。

### 本地 `.env.local` 最小配置示例（任选一组复制走）

```bash
# 默认：复用本机 claude CLI（Max 订阅最划算）
#   什么都不用填，留空 .env.local 即可

# Anthropic API
LLM_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-...
# LLM_MODEL=claude-sonnet-4-6        # 可选，默认即此

# DeepSeek（便宜，中文友好）
LLM_BACKEND=deepseek
DEEPSEEK_API_KEY=sk-...
# LLM_MODEL=deepseek-v4-flash        # 可选

# OpenAI
LLM_BACKEND=openai
OPENAI_API_KEY=sk-...
# LLM_MODEL=gpt-4o-mini              # 可选；想用更大模型填 gpt-4o / gpt-4.1 等

# MiniMax
LLM_BACKEND=minimax
MINIMAX_API_KEY=...
# MINIMAX_BASE_URL=https://api.minimaxi.com/v1   # 国内访问用这条

# 中转 / 反代 / OpenAI 兼容服务（Moonshot / SiliconFlow / OpenRouter / Ollama / LM Studio …）
LLM_BACKEND=openai                   # 协议是 openai 兼容就填 openai
LLM_API_KEY=<中转给的 key>
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k             # 中转/自托管必须显式指定 model

# Anthropic 协议反代（claude-relay 之类）
LLM_BACKEND=anthropic
ANTHROPIC_API_KEY=<反代 key>           # 也可写成 LLM_API_KEY
ANTHROPIC_BASE_URL=https://你的反代/    # 也可写成 LLM_BASE_URL
```

### 通用覆盖项

- `LLM_MODEL=<id>` —— 任意 backend 的 model 都能用这个变量覆盖默认（如 `LLM_MODEL=gpt-4o` 走 openai 的更大模型）
- `<BACKEND>_BASE_URL` —— 走自托管代理 / 兼容服务（如 LM Studio / Ollama 跑 OpenAI 兼容接口 → `LLM_BACKEND=openai` + `OPENAI_BASE_URL=http://localhost:1234/v1`）
- `LLM_API_KEY` / `LLM_BASE_URL` —— **通用别名**，专用变量没设时 fallback 到这里。用 Moonshot / SiliconFlow / OpenRouter / 自建反代等非预设服务时推荐用这对，避免 `OPENAI_API_KEY` 这样的语义错位

### 验证配置是否对

改完 `.env.local` 不想等 5-8 分钟的完整 daily 跑完才知道 key 通不通？跑这个 ~30 秒、只用 1 次 LLM 调用的小指令：

```bash
npm run regen-enrich -- finance:news
```

通了会看到 `[regen-enrich] enrichment done in 28s, matched 12/12`；不通会在 1 秒内被启动校验拦下并告诉你具体怎么修（哪个 key 没填 / `LLM_BACKEND` 该写啥）。

### 怎么选

| 你的情况 | 推荐 backend |
|---|---|
| 已经在用 Claude Code（任意订阅等级）| `claude-cli` — 零配置，按你订阅的等级走 |
| 不用 Claude Code，只想低成本跑日报 | `openai` 配 `gpt-4o-mini`、或 `deepseek` 配 `deepseek-v4-flash`（更便宜）|
| 中文摘要质量优先，预算可放宽 | `anthropic` 配 `claude-sonnet-4-6` |
| 国内网络访问，要规避 GFW | `deepseek` 或 `minimax`（都是国内厂商）|

**切 backend 不需要改代码**：所有 prompt 都在 `lib/ai/prompts.ts` 抽离，跟 backend 无关；JSON 错误兜底（`jsonrepair`）也是 backend-agnostic。切完后跑一次 `npm run daily`，进 `logs/llm-calls.jsonl` 看新 backend 的调用记录。

---

## 🌐 自托管部署（可选）

每次 `npm run daily` 跑完，自动把新 HTML 推到自己的服务器，访客打开 `https://your-domain/` 就能看到当天最新报告。**默认不启用**，环境变量不设就跳过。

### 一次性服务器准备

假设服务器跑 Ubuntu + nginx + 已申请域名，登录用户有 sudo NOPASSWD：

```bash
# 服务器上
sudo mkdir -p /var/www/your-domain && sudo chown -R www-data:www-data /var/www/your-domain
```

`/etc/nginx/sites-available/your-domain.conf`：

```nginx
server {
    listen 80;
    server_name your-domain;
    root /var/www/your-domain;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
```

启用 + 自动签 SSL：

```bash
sudo ln -s /etc/nginx/sites-available/your-domain.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain --agree-tos --redirect
```

### 本地启用 auto-deploy

`.env.local`（gitignored）加两行：

```
DEPLOY_HOST=user@your-server-ip
DEPLOY_PATH=/var/www/your-domain
```

之后：
- ✅ 每次 `npm run daily` 跑完，自动 scp 当天 HTML 到服务器 + 刷新 `index.html`
- ✅ `npm run deploy [YYYY-MM-DD]` 手动推任意一天
- ✅ 部署失败不阻断 daily 本身（HTML 已经在本地 `daily_reports/` 落盘，可重跑 `npm run deploy` 补推）

---

## 💡 Claude Code 集成

装好后**任意目录**（不必 cd 进项目）打开 Claude Code 都可用：

| 触发 | 行为 |
|---|---|
| `/run-daily` | 立即触发 daily 并后台监听到完成。从任意目录都行 |
| `/check-daily` | 查任务状态 + 报告文件 + 配额 |
| 描述问题（"日报又挂了"、"X 推文为啥没更新"等）| `daily-brief` skill 的关键词触发自动加载，让 Claude 直接懂这个项目 |

**实现机制**：`scripts/install.mjs --global` 在 `~/.claude/` 下建符号链接，指向项目内的 [`.claude/skills/daily-brief/SKILL.md`](.claude/skills/daily-brief/SKILL.md) 和 [`.claude/commands/`](.claude/commands/) 文件——**单一源**，编辑项目文件等于编辑用户级 skill。当 symlink 因权限受限失败时（如 Windows 无开发者模式），自动 fallback 到 copy。`~/.daily-brief-config` 记录项目实际路径，让 slash command 在任意 cwd 都能找到项目。

---

## 📁 项目结构

```
daily-brief/
├── lib/
│   ├── sources/        # RSS / API / curl 抓取器；新加源在这里
│   ├── ai/             # 可插拔 LLM 后端 + 提示词（lib/ai/backends/ 下每个 backend）
│   ├── trading/        # Yahoo Finance + 技术指标
│   ├── output/         # 渲染层 (HTML / Markdown)
│   └── utils.ts        # 小工具（todayKey / getReportTz）
├── scripts/
│   ├── _env.ts         # dotenv 预加载（被所有入口脚本第一个 import）
│   ├── daily.ts        # 主管线
│   ├── dry-run.ts      # 只抓取不调 LLM，验证数据源
│   ├── render.ts       # 重渲染
│   ├── regen-*.ts      # 局部重跑（trading / enrich）
│   ├── quota-report.ts # LLM 用量统计
│   ├── sources.ts      # `npm run sources` — 列源 + 校验 JSON
│   ├── run-daily.mjs   # OS 调度器调用的包装（含自动 deploy + open）
│   ├── open-report.mjs # 打开最新报告（跨平台）
│   ├── build-site.mjs  # 生成 GH Pages 静态站 (index + archive)
│   ├── deploy.mjs      # scp 到远端 nginx 服务器（可选）
│   ├── install.mjs     # 注册定时任务（Win/Mac/Linux 自适应）
│   └── uninstall.mjs   # 卸载
├── sources.config.json # 数据源唯一配置入口
├── daily_reports/      # 输出 (gitignored)
│   └── 2026-05-15/     # 每日一个子目录，内含 .html (主) / .json (缓存) / -articles.json (缓存)
│                       #   .md 默认不生成，可在 .env.local 设 OUTPUT_MARKDOWN=true 开启
├── logs/               # 运行日志 (gitignored)
├── .github/workflows/  # GitHub Actions 工作流（A 方式部署）
└── .claude/
    ├── skills/         # Claude Code 操作 skill
    └── commands/       # slash commands
```

---

## 🗑️ 卸载

```bash
node scripts/uninstall.mjs
# 移除：定时任务 (Task Scheduler / launchd / cron) + ~/.claude/ 下的链接 + ~/.daily-brief-config
# 不动：项目文件、daily_reports/、logs/、power plan 设置
# 想彻底清理就 rm -rf 整个项目目录
```

---

## 🛠️ 自定义 / Fork

改源、改时间、改排版、加新栏目 —— 见 [FORKING.md](FORKING.md)。

---

## 🙏 致谢

本项目在 [LINUX DO](https://linux.do) 开源社区分享推广，感谢佬友们的反馈与建议。

## 📝 License

MIT

---

<br>

<a id="en"></a>

# 📰 daily-brief · your own AI-curated daily news brief in 10 minutes

[↑ 中文](#zh) · **English**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node 20+](https://img.shields.io/badge/node-20%2B-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![LLM: pluggable](https://img.shields.io/badge/LLM-pluggable%20(5%20backends)-orange.svg)](#-llm-backend-configuration)
[![Deploy: GH Actions](https://img.shields.io/badge/deploy-GitHub%20Actions-2088ff.svg)](#a-github-actions--pages-zero-infra-recommended)
[![Demo: live](https://img.shields.io/badge/demo-leiting--eric.github.io%2FDailyBrief-brightgreen.svg)](https://leiting-eric.github.io/DailyBrief)
[![Stars](https://img.shields.io/github/stars/leiting-eric/DailyBrief?style=social)](https://github.com/leiting-eric/DailyBrief)

> **Your own AI-curated daily news brief, on infrastructure you control.** 23 sources · LLM summaries · 21-ticker market panel with SMA/RSI/MACD signals + AI commentary · bilingual (zh/en) · 5 swappable LLM backends.
>
> **Three deployment paths, pick one:** [**🚀 5-min GitHub Actions fork**](#a-github-actions--pages-zero-infra-recommended) · [**💻 local one-liner install**](#b-local-one-liner-install) · [**🤖 have an AI agent install it for you**](#c-have-an-ai-agent-install-it-for-you).

**🌐 Live demos** —
[📰 leiting-eric.github.io/DailyBrief](https://leiting-eric.github.io/DailyBrief) (path A · GitHub Actions + Pages)
·
[📰 daily.leiting.tech](https://daily.leiting.tech) (path B · self-hosted server)

---

## ✨ Core features

- **🌍 Multi-source aggregation** — 23 sources spanning Silicon Valley tech, AI frontier, global finance, international politics, and developer communities. One report covers it all.
- **📈 21 live tickers** — US stocks / crypto / HK / commodities / macro signals, with SMA / RSI / MACD indicators + daily LLM-written trading commentary
- **🤖 5 swappable LLM backends** — Claude CLI / Anthropic / OpenAI / DeepSeek / MiniMax. One env var to switch, no vendor lock-in.
- **🌐 Bilingual (zh/en)** — set `REPORT_LOCALE=en` to flip the entire stack: sources, prompts, UI text, Bullish/Bearish stance labels — all switch.
- **🚀 Flexible deployment** — GitHub Actions (zero infra) / local OS scheduler / self-hosted server — pick one or run them in parallel
- **🆓 Zero data-source API keys** — every source uses free public endpoints (RSS / public JSON), no paid subscriptions
- **🔒 No third-party reader lock-in** — Feedly / Inoreader / Pocket all profile your reading; this project never talks to them. Your reading habits stay yours.
- **📁 Single-file HTML output** — CSS and JS inlined, no external dependencies, scp'able onto a server as `index.html`

---

## 📚 Source roster

23 sources in zh mode / 22 in en mode, organized as:

### 🧑‍💻 Tech

<p align="center"><img src="docs/screenshots/tech.png" alt="Tech panel — GitHub Trending / X posts / AI media" width="720"></p>

- **GitHub Trending** · refreshed daily
- **AI media** (merged): OpenAI / DeepMind / Hugging Face Blog / TLDR AI / Smol AI / Latent Space / MIT Tech Review
- **X posts** (attentionvc-ai): curated AI thought-leader feed

### 📈 Markets (21 tickers, not news)

<p align="center"><img src="docs/screenshots/trading.png" alt="Markets — 21-ticker technicals + AI commentary" width="720"></p>

- **US stocks / ETFs**: SPY / QQQ / AAPL / MSFT / NVDA / GOOGL / TSLA / META
- **Crypto**: BTC / ETH / SOL (+ alt.me Fear & Greed index + CoinGecko macro)
- **China / HK**: BABA / PDD / JD / 0700.HK
- **Commodities / FX**: GC=F (gold) / CL=F (WTI crude) / USDCNY=X
- **Macro signals**: ^VIX / ^TNX (10Y Treasury) / DXY

### 🌍 World

<p align="center"><img src="docs/screenshots/politics.png" alt="World — BBC / Guardian / NYT etc." width="720"></p>

**BBC / Guardian / NYT / NPR / DW Chinese / Al Jazeera / The Diplomat** — 7 major international outlets' World feeds

### 💰 Finance

<p align="center"><img src="docs/screenshots/finance.png" alt="Finance — Bloomberg / WSJ / FT" width="720"></p>

**Bloomberg / WSJ / FT / BBC Business / Economist** — 5 global finance heavyweights

### 💬 Community
- **zh mode**: V2EX top threads / LinuxDo trending
- **en mode**: Hacker News / Reddit r/stocks (auto-substituted)

> Full list + enabled status: run `npm run sources`. To edit sources, modify [`sources.config.json`](sources.config.json).

---

## 🚀 Pick one deployment path

| Path | Who it's for | What you need | Setup time |
|---|---|---|---|
| **A. GitHub Actions + Pages** | No server, don't want to keep a laptop running | One API key (Anthropic / OpenAI / DeepSeek / MiniMax) | ~5 min (recommended) |
| **B. Local one-liner** | Have an always-on machine; want it cheapest | Node 20+, optionally Claude Code login | ~3 min |
| **C. Have an AI agent install it** | Lazy; want Cursor / Codex / Claude Code to handle setup | Same as B | One sentence |

### A. GitHub Actions + Pages (zero-infra, recommended)

1. **Fork this repo** (Fork button, top-right of GitHub)
2. **Settings → Actions → General → Workflow permissions** → set to **Read and write permissions**
3. **Settings → Pages → Build and deployment → Source** → "Deploy from a branch" → branch `gh-pages` / path `/ (root)` (the `gh-pages` branch only exists after the first successful workflow run — configure secrets first, trigger once, then come back)
4. **🔑 Configure the LLM backend** — this is the critical step. Each backend needs **a secret AND the matching `LLM_BACKEND` variable** (not just the secret). Pick one row:

   > ⚠️ **Most common mistake**: adding only the secret (e.g. `DEEPSEEK_API_KEY`) and forgetting the `LLM_BACKEND` variable. The workflow defaults `LLM_BACKEND` to `anthropic`, so whatever key you set, the run will crash with `ANTHROPIC_API_KEY required`. Both pieces are required.

   | You want | Secret to add | `LLM_BACKEND` variable | Rough cost |
   |---|---|---|---|
   | 🟣 **Anthropic Sonnet** (default; prompts tuned for it) | `ANTHROPIC_API_KEY` | leave unset or `anthropic` | ~$0.03-0.05/day, <$2/month |
   | 🐋 **DeepSeek** (cheap, China-friendly) | `DEEPSEEK_API_KEY` | `deepseek` | ~$0.01-0.02/day, <$1/month |
   | 🟢 **OpenAI** | `OPENAI_API_KEY` | `openai` | gpt-4o-mini ~$0.02/day |
   | 🔵 **MiniMax** | `MINIMAX_API_KEY` | `minimax` | Similar to DeepSeek |
   | 🌀 **Proxy / aggregator / any OpenAI-compatible service** (Moonshot, SiliconFlow, OpenRouter, self-hosted Claude relay, local Ollama / LM Studio, ...) | `LLM_API_KEY` | `openai` (use `anthropic` only if the proxy speaks Anthropic protocol — rare) | Depends on provider |

   Location: **Settings → Secrets and variables → Actions**. The page has two tabs — **Secrets** for keys, **Variables** for `LLM_BACKEND`.

   > 🌀 **Extras if you picked the last "proxy" row**: also add `LLM_BASE_URL` (the endpoint your proxy gave you, e.g. `https://api.moonshot.cn/v1`) and `LLM_MODEL` (e.g. `moonshot-v1-8k`) under Variables. Not sure which protocol? Default `LLM_BACKEND=openai` — covers 95% of proxies; switch to `anthropic` only if you get 404s or protocol errors.

5. (Optional) On the same Variables tab, add:
   - `LLM_MODEL` — override the backend's default model (otherwise uses the default listed in [`.env.example`](.env.example))
   - `LLM_BASE_URL` — custom endpoint. **Required if you picked the "proxy" row above.** For local Ollama use `http://localhost:11434/v1`, LM Studio `http://localhost:1234/v1`
   - `REPORT_LOCALE` — `zh` (default) or `en` — switches sources + UI + LLM prompts as a set
   - `REPORT_TZ` — IANA timezone name (default UTC); e.g. `Asia/Shanghai` / `America/Los_Angeles`. **Drives both the trigger time and the date label.**
   - `REPORT_HOUR` — hour(s) to fire in `REPORT_TZ`, default `8` (08:00). Comma-separated for multiple, e.g. `8,18` = 8 AM and 6 PM
   - `REPORT_DAYS` — day-of-week filter (cron-style, `0`=Sunday ... `6`=Saturday), default `*` (every day). E.g. `1-5` = weekdays; `1,3,5` = Mon/Wed/Fri
6. **Actions tab → "Daily Brief" workflow → Run workflow** to trigger manually for the first time

Once the workflow turns green, your report lives at `https://<your-username>.github.io/<repo-name>/`. After that, **it refreshes daily at 08:00 in `REPORT_TZ`** (or 08:00 UTC if `REPORT_TZ` is unset).

> ⏰ **How the schedule works**: GitHub Actions cron is UTC-only, so the workflow runs **hourly** and uses a `gate` job to check if the current hour in `REPORT_TZ` matches `REPORT_HOUR` / `REPORT_DAYS`. If so, the build job proceeds; otherwise it exits in seconds. This lets the schedule track any local timezone precisely, and **handles DST transitions automatically** (via the IANA tz database).

**Common schedule recipes:**

| You want | `REPORT_HOUR` | `REPORT_DAYS` |
|---|---|---|
| Every day at 08:00 (default) | unset or `8` | unset or `*` |
| Twice daily (8 AM + 6 PM) | `8,18` | `*` |
| Weekdays at 09:00 | `9` | `1-5` |
| Mon/Wed/Fri at 7 AM + 9 PM | `7,21` | `1,3,5` |
| Every 6 hours | `0,6,12,18` | `*` |

If you just want the default (08:00 local daily), **set only `REPORT_TZ`** (e.g. `Asia/Shanghai`) and leave the rest at defaults.

**💸 Cost summary**: GitHub Actions on public repos is free. Pages on public repos is free. The only thing you pay for is LLM API calls — DeepSeek runs under $1/month, Anthropic Sonnet under $2.

> ⚠️ **GH Actions mode can't reuse a local `claude` CLI login** — your Claude Code OAuth token lives on your machine, GitHub's runners can't see it. If you have a Max subscription, run both paths side by side: path B locally (uses Claude CLI), path A on GitHub Actions (uses DeepSeek). Independent reports, no interference.

#### 🐛 Common gotchas

- **"Upgrade or make this repository public to enable Pages"** — Free-tier GitHub Pages requires a public repo. Settings → General → Danger Zone → Change visibility → Public. Your Actions Secrets remain encrypted and invisible to others even on public repos.
- **"Variable name can only contain alphanumeric characters"** — most likely the underscore in `LLM_BACKEND` got autocorrected by a CJK input method to a full-width `＿` (U+FF3F). Switch to English input, retype Shift+`-`, or copy-paste.
- **Pages source dropdown doesn't show `gh-pages`** — that branch only exists after the first successful workflow run. Order: configure secret → trigger workflow → wait for green → go back to Settings → Pages.
- **Where to read a failed run** — Actions tab → click the red X → left sidebar lists each step → click the failing one to expand its log. Most common causes: `401`/`402` (API key wrong or out of credit), `403` (workflow permissions still set to "Read only").
- **Error: `ANTHROPIC_API_KEY (or generic LLM_API_KEY) is required` — but I set a different provider's key** — classic secret-without-variable mismatch. The workflow defaults `LLM_BACKEND=anthropic`; setting `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` alone is not enough — you **also need to add the matching `LLM_BACKEND=deepseek` / `openai` under Variables**. As of v1.x the startup check prints exactly which key it found and which `LLM_BACKEND` value to set.
- **I added both the secret and variable, still the same error** — 99% sure your values went into the wrong scope. GitHub has two near-identical-looking pages:
  - ✅ **Settings → Secrets and variables → Actions** (header reads "Repository secrets" / "Repository variables") — this is the default this project uses
  - ⚠️ **Settings → Environments → \<some environment\>** (header reads "Environment secrets" / "Environment variables") — values here are **only injected when a workflow job declares `environment: <name>`**; the default workflow doesn't, so anything stored here is invisible at runtime
  
  Open your config page and check the section header. If it says "Environment ..." you have **two fixes**, pick one:
  - **Simple fix (recommended)**: move every secret **and** variable from Environment scope to Repository scope (Settings sidebar → "Secrets and variables → Actions" — **don't enter via "Environments"**). No workflow edit needed. **Watch out**: secrets like `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` hide their values, so it's easy to "move" only the visible variables and forget the secrets — then you trade the old error for a new one ("key is not set"). Move both, completely.
  - **Keep-the-environment fix**: edit `.github/workflows/daily.yml` and add `environment: <your-env-name>` to BOTH the `gate` and `build` jobs (both, because `gate` reads `vars.REPORT_TZ` etc. too). The name must exactly match the environment you created under Settings → Environments. Useful if you want environment-based approval gates or branch restrictions.
- **Fails after ~30s (other cases)** — LLM API returned 400, the key has no credit, or quota is exhausted. Check the "Generate today's report" step's log.

### B. Local one-liner install

```bash
# Linux / macOS
curl -sSL https://raw.githubusercontent.com/leiting-eric/DailyBrief/main/bootstrap.mjs | node

# Windows PowerShell
irm https://raw.githubusercontent.com/leiting-eric/DailyBrief/main/bootstrap.mjs | node -
```

This script will:
1. Check that Node / git / claude CLI are on PATH (claude CLI missing is a warning, not an error — you can use an API backend instead)
2. `git clone` to `~/daily-brief` (Windows: `%USERPROFILE%\daily-brief`)
3. `npm install`
4. Register the OS scheduler (Windows Task Scheduler / macOS launchd / Linux cron, default 08:00 local time)
5. Write `~/.daily-brief-config` recording the project path
6. Symlink the Claude Code skill + slash commands into `~/.claude/` so they work from any directory
7. Run `npm run dry-run` as a smoke test

**🎁 Claude Code bonus**: after install, any Claude Code session anywhere can use `/run-daily` and `/check-daily`. Describing a problem in plain English ("today's report didn't come out") also auto-loads the `daily-brief` skill. **Other agents** (Cursor / Codex) don't have a skill auto-load mechanism, but the scheduled task still runs at the OS level. Manual triggers:

| Platform | Command |
|---|---|
| Windows | `Start-ScheduledTask -TaskName DailyBrief` |
| macOS | `launchctl start com.daily-brief` |
| Linux | `node scripts/run-daily.mjs` (cron doesn't support manual trigger) |

Custom install path / time:

```bash
node bootstrap.mjs --target /custom/path --at 07:30
```

**LLM backend**: defaults to the local `claude` CLI (first time you'll need to log in once in a browser: `echo "hi" | claude --print --model sonnet` — once is forever). To skip Claude Code, change the model, switch providers, or point at a proxy — edit `.env.local`. Copy-paste recipes are in [🤖 LLM backend configuration](#-llm-backend-configuration) below.

### C. Have an AI agent install it for you

Whichever AI agent you use (Claude Code / Cursor / Codex / Continue.dev / OpenClaw / etc.), send it this prompt:

> Please install this open-source project following the README's "local one-liner" path with bootstrap, and tell me when the next auto-trigger will fire:
> https://github.com/leiting-eric/DailyBrief

The repo includes [`AGENTS.md`](AGENTS.md) (universal agent protocol) and [`.claude/skills/daily-brief/SKILL.md`](.claude/skills/daily-brief/SKILL.md) (Claude Code-specific, more detailed). After install, the agent can help diagnose things like "today's report didn't come out" or "add a new source".

---

## 📋 Requirements

- **Node.js 20+**, **npm**, **git** (local for paths B/C; path A runs in GitHub's containers — no local install needed)
- **One working LLM** (any of): Claude Code CLI logged in, OR Anthropic / OpenAI / DeepSeek / MiniMax API key
- Platform: Windows 10/11, macOS 12+, Linux (any platform — scheduler picks the matching mechanism)

---

## 🔧 Manual install

```bash
# 1. Clone + dependencies
git clone https://github.com/leiting-eric/DailyBrief.git
cd DailyBrief
npm install

# 2. Pick an LLM backend
#    Default = claude CLI (will guide you through login if not done):
echo "say hi" | claude --print --model sonnet
#    Or use a different backend: cp .env.example .env.local
#    and set LLM_BACKEND + the matching API key

# 3. Register the scheduler + enable the global skill
node scripts/install.mjs --global

# 4. Test trigger immediately
# Windows:  Start-ScheduledTask -TaskName DailyBrief
# macOS:    launchctl start com.daily-brief
# Linux:    node scripts/run-daily.mjs
```

Sleep-wake behavior at next trigger time:
- **🪟 Windows** — wakes the computer if asleep, runs, returns to sleep
- **🍎 macOS** — launchd doesn't wake from deep sleep; skipped if asleep (configure `pmset wake schedule` separately if needed)
- **🐧 Linux** — cron doesn't wake either; skipped if suspended

---

## 🛠️ Daily commands

| Command | Purpose | Time |
|---|---|---|
| `npm run daily` | Full pipeline (fetch + LLM + render) | 5-8 min |
| `npm run dry-run` | Fetch only, no LLM — validates sources | ~30s |
| `npm run render [date]` | Re-render HTML after editing CSS/layout | <1s |
| `npm run regen-trading [date]` | Re-do the trading section only | ~2 min |
| `npm run regen-enrich <cat:sub> [date]` | Fill in missing summaries for a subgroup | ~30s |
| `npm run open` | Open today's report in Chrome | instant |
| `npm run quota-report` | Per-backend LLM usage summary | instant |
| `npm run sources` | List all sources with locale / enabled status | instant |
| `npm run sources:check` | Validate `sources.config.json` schema (good for CI / pre-commit) | instant |
| `npm run serve` | Launch Web dashboard (config, sources, one-click run, logs), default http://localhost:3456 | instant |

---

## 📊 Source configuration

Sources live as a JSON array in [`sources.config.json`](sources.config.json) at the project root — **the single source of truth**. Add / disable / re-categorize feeds without touching TypeScript. Per-entry fields:

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | Short unique identifier (used by `dispatch.ts` to route to the right fetcher) |
| `name` | ✓ | Display name in the UI |
| `type` | ✓ | `rss` / `api` / `scrape` |
| `url` | ✓ | RSS feed URL or API endpoint |
| `category` | ✓ | `tech` / `finance` / `politics` — drives the L1 tab |
| `subcategory` |  | L2 grouping (`github-trending` / `ai-news` / `x-viral` / `cn-community` for tech; `news` for finance) |
| `enabled` |  | Default `true`; set to `false` to skip without deleting the record |
| `useCurl` |  | `true` if the source's host blocks Node's TLS fingerprint (Cloudflare); the fetcher will shell out to curl |
| `lang` |  | `zh` means the source is already in Chinese — enrich skips it (no need to translate Chinese into Chinese) |
| `locales` |  | Array listing which `REPORT_LOCALE` the source appears in. Default `["zh", "en"]` |
| `notes` |  | Free-form (e.g. "removed because feed died"); ignored at runtime |

### Adding an RSS source

1. Append an entry to `sources.config.json`
2. Run `npm run sources:check` to validate schema
3. `npm run dry-run` to confirm the fetch works
4. The next `npm run daily` picks it up automatically

### 🌐 Locale mode (zh / en)

Switch with the `REPORT_LOCALE` environment variable:

```bash
# .env.local
REPORT_LOCALE=zh    # default — Chinese mode, includes V2EX / LinuxDo / DW Chinese
# REPORT_LOCALE=en  # English mode — drops zh-only sources, picks up en-only ones
```

Each source's `locales` field decides which mode it appears in:

- `["zh"]` — **zh mode only** (V2EX / LinuxDo / DW Chinese). English readers can't read these, so auto-dropped in en mode.
- `["en"]` — **en mode only** (Hacker News / r/stocks etc., picked up to replace Chinese community sources). Not shown in zh mode.
- `["zh", "en"]` (default) — appears in both modes (BBC / Bloomberg / WSJ / NYT / AI media)

Currently enabled sources by locale:

| Locale | Enabled sources | Mix |
|---|---|---|
| `zh` | 23 | 20 global / English sources (with LLM-generated Chinese summaries) + 3 Chinese-only (V2EX / LinuxDo / DW Chinese) |
| `en` | 22 | 20 global / English sources + 2 English community (Hacker News + r/stocks) |

The full en-mode switch covers: HTML UI text, the three LLM prompt sets (enrichment / digest / trading commentary), stance labels (Bullish/Bearish/Neutral vs. 偏上行/偏下行/中性), date format (`zh-CN` ↔ `en-GB`), Markdown output. **Chinese community sources are auto-hidden in en mode** since the audience can't read them.

---

## 🤖 LLM backend configuration

The project switches backends via the `LLM_BACKEND` environment variable. **Default is `claude-cli`** — it reuses your existing Claude Code login, no API key needed. To use your own API key with another provider, set up `.env.local`:

### Where the config lives

**Local install**: everything goes in `.env.local` at the repo root (gitignored — safe place for keys). First time? `cp .env.example .env.local`, open it in your editor, uncomment the rows you need. Changes take effect on next run, no shell restart — every entry script (`npm run daily` / `regen-trading` / `regen-enrich`) dotenv-loads the file on its first line.

**GitHub Actions deploy**: no `.env.local` needed — set values under Settings → Secrets and variables → Actions instead (see [Path A](#a-github-actions--pages-zero-infra-recommended) step 4 above).

### Supported backends

| backend | API key env var | Default model | Base URL |
|---|---|---|---|
| 🎯 `claude-cli` (default) | None — reuses Claude Code OAuth | `sonnet` | — |
| 🟣 `anthropic` | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` | `api.anthropic.com` |
| 🟢 `openai` | `OPENAI_API_KEY` | `gpt-4o-mini` | `api.openai.com/v1` |
| 🐋 `deepseek` | `DEEPSEEK_API_KEY` | `deepseek-v4-flash` | `api.deepseek.com/v1` |
| 🔵 `minimax` | `MINIMAX_API_KEY` | `MiniMax-M2.7` | `api.minimax.io/v1` <sup>1</sup> |

<sup>1</sup> Inside mainland China, set `MINIMAX_BASE_URL=https://api.minimaxi.com/v1`.

### Minimal `.env.local` recipes (pick one and copy)

```bash
# Default: reuse local claude CLI (best deal if you have a Max subscription)
#   Leave .env.local empty — done.

# Anthropic API
LLM_BACKEND=anthropic
ANTHROPIC_API_KEY=sk-ant-...
# LLM_MODEL=claude-sonnet-4-6           # optional — this is the default

# DeepSeek (cheap, strong on Chinese)
LLM_BACKEND=deepseek
DEEPSEEK_API_KEY=sk-...
# LLM_MODEL=deepseek-v4-flash           # optional

# OpenAI
LLM_BACKEND=openai
OPENAI_API_KEY=sk-...
# LLM_MODEL=gpt-4o-mini                 # optional; use gpt-4o / gpt-4.1 for bigger

# MiniMax
LLM_BACKEND=minimax
MINIMAX_API_KEY=...
# MINIMAX_BASE_URL=https://api.minimaxi.com/v1   # use this from mainland China

# Proxy / aggregator / OpenAI-compatible service (Moonshot / SiliconFlow / OpenRouter / Ollama / LM Studio …)
LLM_BACKEND=openai                       # most proxies speak OpenAI protocol
LLM_API_KEY=<key from your provider>
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-8k                 # always explicit for proxies / self-hosted

# Anthropic-protocol relay (claude-relay etc.)
LLM_BACKEND=anthropic
ANTHROPIC_API_KEY=<relay key>            # or use LLM_API_KEY
ANTHROPIC_BASE_URL=https://your-relay/   # or use LLM_BASE_URL
```

### Universal overrides

- `LLM_MODEL=<id>` — works for any backend (e.g. `LLM_MODEL=gpt-4o` to use OpenAI's bigger model)
- `<BACKEND>_BASE_URL` — for self-hosted proxies or OpenAI-compatible services (e.g. LM Studio / Ollama → `LLM_BACKEND=openai` + `OPENAI_BASE_URL=http://localhost:1234/v1`)
- `LLM_API_KEY` / `LLM_BASE_URL` — **generic aliases**, used as fallback when the provider-specific vars aren't set. Use this pair for Moonshot / SiliconFlow / OpenRouter / self-hosted proxies — anything not in the preset list — so you don't have to misuse `OPENAI_API_KEY` just to reach a non-OpenAI service

### Verify the config is good

Don't want to wait 5-8 min for a full `npm run daily` just to learn your key is wrong? This 30-second, 1-LLM-call command tells you fast:

```bash
npm run regen-enrich -- finance:news
```

Working: `[regen-enrich] enrichment done in 28s, matched 12/12`. Broken: the startup check stops it within 1 second and prints exactly what to fix (which key is missing, which `LLM_BACKEND` value to use).

### How to pick

| Your situation | Recommended backend |
|---|---|
| Already using Claude Code (any subscription tier) | `claude-cli` — zero config, billed against your subscription |
| Not on Claude Code, want it cheapest | `openai` with `gpt-4o-mini`, or `deepseek` (cheaper still) |
| Chinese summary quality matters most | `anthropic` with `claude-sonnet-4-6` |
| Need to bypass China's network restrictions | `deepseek` or `minimax` (both are domestic providers) |

**Switching backends needs no code changes**: all prompts are factored out in `lib/ai/prompts.ts` independently of any backend; JSON repair fallback (`jsonrepair`) is backend-agnostic. After switching, run `npm run daily` once and look at `logs/llm-calls.jsonl` for the new backend's call log.

---

## 🌐 Self-hosted deployment (optional)

After each `npm run daily`, automatically scp the fresh HTML to your own server; visitors hit `https://your-domain/` and see today's report. **Disabled by default** — leave the env vars unset to skip.

### One-time server setup

Assumes Ubuntu + nginx, domain configured, login user has sudo NOPASSWD:

```bash
# On the server
sudo mkdir -p /var/www/your-domain && sudo chown -R www-data:www-data /var/www/your-domain
```

`/etc/nginx/sites-available/your-domain.conf`:

```nginx
server {
    listen 80;
    server_name your-domain;
    root /var/www/your-domain;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
```

Enable + auto-issue SSL:

```bash
sudo ln -s /etc/nginx/sites-available/your-domain.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain --agree-tos --redirect
```

### Enable auto-deploy locally

In `.env.local` (gitignored), add:

```
DEPLOY_HOST=user@your-server-ip
DEPLOY_PATH=/var/www/your-domain
```

Then:
- ✅ Every `npm run daily` auto-scp's the new HTML to the server and refreshes `index.html`
- ✅ `npm run deploy [YYYY-MM-DD]` to push any specific date manually
- ✅ A deploy failure doesn't break the daily run itself (HTML is already on disk in `daily_reports/`; `npm run deploy` retries it)

---

## 💡 Claude Code integration

**After install, any directory** (no need to `cd` into the project) running Claude Code can use:

| Trigger | Behavior |
|---|---|
| `/run-daily` | Triggers daily immediately, monitors in the background until done. Works from any directory. |
| `/check-daily` | Checks task state + report files + quota |
| Describing a problem ("today's report didn't come out", "why didn't X posts update") | Auto-loads the `daily-brief` skill so Claude understands the project context |

**How it works**: `scripts/install.mjs --global` symlinks files in `~/.claude/` pointing at the project's [`.claude/skills/daily-brief/SKILL.md`](.claude/skills/daily-brief/SKILL.md) and [`.claude/commands/`](.claude/commands/) — **single source**, editing the project files is editing the user-level skill. If symlinks aren't permitted (Windows without Developer Mode), it falls back to copying. `~/.daily-brief-config` records the absolute project path so slash commands find it from any CWD.

---

## 📁 Project structure

```
daily-brief/
├── lib/
│   ├── sources/        # RSS / API / curl fetchers; add new sources here
│   ├── ai/             # Pluggable LLM backends + prompts (lib/ai/backends/ per backend)
│   ├── trading/        # Yahoo Finance + technical indicators
│   ├── output/         # Rendering (HTML / Markdown)
│   └── utils.ts        # Tiny shared helpers (todayKey / getReportTz)
├── scripts/
│   ├── _env.ts         # dotenv preload — imported FIRST by every entry script
│   ├── daily.ts        # Main pipeline
│   ├── dry-run.ts      # Fetch-only validation (no LLM)
│   ├── render.ts       # Re-render from cached data
│   ├── regen-*.ts      # Targeted re-runs (trading / enrich)
│   ├── quota-report.ts # LLM usage stats
│   ├── sources.ts      # `npm run sources` — list + validate sources.config.json
│   ├── run-daily.mjs   # OS scheduler wrapper (daily + log + deploy + open)
│   ├── open-report.mjs # Cross-platform "open latest" helper
│   ├── build-site.mjs  # GH Pages static-site generator (index + archive)
│   ├── deploy.mjs      # scp HTML to a remote nginx host (opt-in)
│   ├── install.mjs     # Cross-platform scheduler registration
│   └── uninstall.mjs   # Removal
├── sources.config.json # Single source of truth for the source registry
├── daily_reports/      # Output (gitignored)
│   └── 2026-05-15/     # One subdir per day, contains .html (main) / .json (cache) / -articles.json (cache)
│                       #   .md not generated by default; set OUTPUT_MARKDOWN=true in .env.local to enable
├── logs/               # Run logs (gitignored)
├── .github/workflows/  # GitHub Actions workflow (path A deployment)
└── .claude/
    ├── skills/         # Claude Code operational skill
    └── commands/       # Slash commands
```

---

## 🗑️ Uninstall

```bash
node scripts/uninstall.mjs
# Removes: scheduled task (Task Scheduler / launchd / cron) + ~/.claude/ symlinks + ~/.daily-brief-config
# Leaves alone: project files, daily_reports/, logs/, power plan settings
# For a full cleanup: rm -rf the project directory
```

---

## 🛠️ Customize / Fork

Change sources, schedule, layout, add new panels — see [FORKING.md](FORKING.md).

---

## 🙏 Acknowledgments

This project is shared on the [LINUX DO](https://linux.do) open-source community. Thanks to the community members for feedback and suggestions.

## 📝 License

MIT
