# Forking & Customization

This project is intentionally easy to fork — most customization is single-file edits. **No code generators, no manifests, no DI containers**.

## Change daily schedule

```bash
node scripts/install.mjs --at 07:30   # re-registers at 07:30 local time
```

Times are local system time. Default is 08:00 (a morning brief — before market open, with trading commentary fresh for the day ahead). Works on Windows / macOS / Linux.

## Add / remove / disable a source

The source registry lives in [`sources.config.json`](sources.config.json) at the project root — **the single source of truth**. `lib/sources/registry.ts` is just a JSON loader + locale filter; you almost never edit the TS. Append a JSON object:

```json
{
  "id": "my-blog",
  "name": "My Blog",
  "type": "rss",
  "url": "https://example.com/feed.xml",
  "category": "tech",
  "subcategory": "ai-news",
  "enabled": true,
  "useCurl": false,
  "lang": "en",
  "locales": ["zh", "en"],
  "notes": "Why this source was added / any quirk"
}
```

Field reference:

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | Unique short identifier; routed by `dispatch.ts` to the matching fetcher |
| `name` | ✓ | Display name in the UI |
| `type` | ✓ | `rss` / `api` / `scrape` |
| `url` | ✓ | Feed URL or API endpoint |
| `category` | ✓ | `tech` / `finance` / `politics` — drives the L1 tab |
| `subcategory` |  | L2 grouping; see `SUBCATEGORY_ORDER` in `lib/output/render.ts` |
| `enabled` |  | Default `true`; set `false` to skip without deleting |
| `useCurl` |  | `true` if the host blocks Node's TLS fingerprint (Cloudflare) — fetcher shells out to curl |
| `lang` |  | `zh` means the source is already Chinese — enrich skips it when `REPORT_LOCALE=zh` |
| `locales` |  | Array of `REPORT_LOCALE` values where this source appears. Default `["zh", "en"]` |
| `notes` |  | Free-form; useful for explaining `enabled: false` or unusual flags |

Workflow:
1. Edit `sources.config.json`, append the new entry
2. `npm run sources:check` — validates the JSON schema (also handy as a pre-commit hook)
3. `npm run dry-run` — verifies the fetcher actually returns articles (~30s, no LLM)
4. Next `npm run daily` picks it up automatically

For **non-RSS source types** (custom JSON API, scraping), create a new file in `lib/sources/`, export a `fetchXxx(sourceId)` function returning `RawArticle[]`, then add a branch in [`lib/sources/dispatch.ts`](lib/sources/dispatch.ts) so `type: "api"` or `type: "scrape"` entries route there.

## Rename L1 tabs / change order

[`lib/output/render.ts`](lib/output/render.ts):

```ts
const CATEGORY_LABELS: Record<Category, string> = {
  tech: "技术动态",        // ← rename here
  finance: "财经要点",
  politics: "时政观察",
};
```

L1 panel order is hardcoded in `renderHtml()` (search for `<nav class="tabs">`). Reorder the `<button>` lines.

## Add a new L2 subcategory under tech

1. In `registry.ts`: tag sources with `subcategory: "my-new-sub"`
2. In `render.ts`:
   - Add `"my-new-sub"` to `SUBCATEGORY_ORDER.tech`
   - Add `"my-new-sub": "我的新栏目"` to `SUBCATEGORY_LABELS`
   - Add to `TECH_MAIN_SUBS` (or `TECH_COMMUNITY_SUBS` for community panel) — controls which L1 panel renders it
   - Optionally: `SOURCE_DISPLAY_LIMITS["tech:my-new-sub"]` for per-source cap
   - Optionally: `MERGED_SUBGROUP_LIMITS["tech:my-new-sub"]` to merge sources into single time-sorted list

## Add Chinese summary enrichment for a new subcategory

1. In [`lib/ai/enrich.ts`](lib/ai/enrich.ts), copy the `XVIRAL_SYSTEM_PROMPT` block and adjust:
   - The system prompt (writing style, output structure)
   - Add an `enrichXxxSummaries()` function calling `runEnrichment(payload, MY_PROMPT, "scope label")`
2. In [`scripts/daily.ts`](scripts/daily.ts):
   - Add an `enrichXxx(articles)` wrapper that filters to your subcategory and calls the function from step 1
   - Add `await enrichXxx(articles)` to the `main()` enrichment chain

## Adjust HTML styling

All CSS is inline inside `renderHtml()` in [`lib/output/render.ts`](lib/output/render.ts). Search for `<style>` and edit. After saving, `npm run render` (1 second) regenerates the latest HTML using cached article data — no LLM cost.

## Change trading watchlist

[`lib/trading/watchlist.ts`](lib/trading/watchlist.ts) — `WATCHLIST` array. Each entry:

```ts
{ symbol: "AAPL", displayName: "苹果", group: "us-equity" }
```

Valid `group` values are in `AssetGroup` (same file): `us-equity` / `crypto` / `china-equity` / `commodity-fx` / `macro`. The L2 trading sub-tabs render groups in `ASSET_GROUP_ORDER` order.

## Disable trading section entirely

Comment out the `runTrading()` call near the end of [`scripts/daily.ts`](scripts/daily.ts) `main()`. The report will skip the "市场行情" L1 tab.

## Disable a whole category

Two ways:
- **Set all its sources to `enabled: false`** in registry — category disappears automatically (empty)
- **Remove the L1 panel from `renderHtml()`** — search for `data-panel="finance"` and delete that `<button>` + `<section>`

## Change LLM provider

All LLM calls funnel through [`lib/ai/llm.ts`](lib/ai/llm.ts) `runLlm()`, which dispatches to a selected backend based on the `LLM_BACKEND` env var:

| `LLM_BACKEND` | Implementation | Auth |
|---|---|---|
| `claude-cli` *(default)* | [`lib/ai/backends/claude-cli.ts`](lib/ai/backends/claude-cli.ts) — spawns the local `claude` CLI | Whatever the CLI is logged in as (e.g. Max subscription) |
| `anthropic` | [`lib/ai/backends/anthropic.ts`](lib/ai/backends/anthropic.ts) — direct API | `ANTHROPIC_API_KEY` |
| `openai` / `deepseek` / `minimax` / `atlascloud` | [`lib/ai/backends/openai-compat.ts`](lib/ai/backends/openai-compat.ts) — OpenAI-compatible Chat Completions | Matching provider `*_API_KEY` |

To **switch backend**: set `LLM_BACKEND=...` in `.env.local`. No code changes.

To **add a new backend** (e.g. Mistral): drop a new file in `lib/ai/backends/`, export a function matching the existing signatures (see `claude-cli.ts` as the simplest reference), then add a branch in `runLlm()` in `lib/ai/llm.ts`.

The prompts (in `lib/ai/prompts.ts`, `enrich.ts`, `trading-commentary.ts`) assume a Sonnet-class model — Chinese fluency, structured JSON output, long context. Switching to a smaller model may need prompt adjustments and JSON-repair fallbacks (already present, but less reliable on weaker models).

## Configure secrets

Whether you need any secret depends on how you've deployed:

| Setup | Secrets you need |
|---|---|
| Local install + default `claude-cli` backend (reuses Claude Code OAuth) | **None** — just be logged into `claude` CLI |
| Local install + any API backend (`anthropic` / `openai` / `deepseek` / `minimax` / `atlascloud`) | That backend's `*_API_KEY` in `.env.local` |
| GitHub Actions deploy | The chosen backend's API key as a GH **Secret** (Claude OAuth is unreachable from GH runners) — see README §"GH Actions" for the secret/variable matrix |

Adding a NEW secret (e.g. you wire up a paid data source like Bloomberg):

1. `.env.local` at project root (gitignored)
2. Add `MY_API_KEY=...`
3. It's already loaded — every entry script does `import "./_env"` first, which dotenv-loads `.env.local` before any other module init

## Debug a failed run

**Last run state (per-OS):**

```powershell
# Windows
Get-ScheduledTaskInfo -TaskName DailyBrief | Format-List LastRunTime, LastTaskResult
```

```bash
# macOS
launchctl list | grep com.daily-brief

# Linux (cron doesn't track per-job state, so just inspect cron + log)
crontab -l | grep daily-brief
```

**Tail today's log** (date = local time, not UTC):

```bash
# Cross-platform (uses node — works in PowerShell / bash / zsh)
node -e "const fs=require('fs'),d=new Date(),pad=n=>String(n).padStart(2,'0');console.log(fs.readFileSync('logs/daily-'+d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'.log','utf8').split('\n').slice(-40).join('\n'))"
```

**Check LLM call history**:

```bash
npm run quota-report
```

Common error shapes:
- `429` / `quota` in `logs/llm-calls.jsonl` — backend rate limit; wait or temporarily switch `LLM_BACKEND` in `.env.local`
- single source `FAILED — <reason>` in the daily log — read that source's fetcher in `lib/sources/<id>.ts`; per-source failures are non-fatal
- empty trading watchlist — Sonnet's "no investment advice" guardrail occasionally bites; `trading-commentary.ts` retries 3× with a softer prompt, then falls back to an empty panel

Decode `LastTaskResult`:
- `0` = success
- `267009` = currently running
- `267011` = never run
- Anything else = error code; check log

If the task didn't fire at all: ensure Task Scheduler service is running, your Windows user account was logged in at trigger time (or `StartWhenAvailable` will catch up after next login), and `WakeToRun` works on your hardware.

## Run without Task Scheduler

```powershell
npm run daily                  # foreground, ~5-8 min, blocks the shell
```

Or schedule with your own tooling (cron, Linux systemd timer, macOS launchd) — call `npm run daily` from the project root.
