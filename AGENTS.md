# AGENTS.md

Operational knowledge for any AI coding agent working on this repo (Claude Code, Codex, Cursor, Continue.dev, Aider, etc.). Claude Code users get a richer SKILL.md auto-loaded; this file is the universal subset everyone reads.

## What this project is

`daily-brief` is a local-first pipeline that fetches 23 RSS / API news sources daily (22 in en mode after locale filtering), runs LLM enrichment, and renders a single self-contained HTML report. It runs on the user's machine via the OS scheduler, OR in GitHub Actions publishing to GitHub Pages. No web framework, no DB, no servers.

The repo's `CLAUDE.md` includes this file via `@AGENTS.md`. Don't add stack-specific lore (Next.js, etc.) — there's none in this codebase.

## Project layout (essentials)

```
lib/
  ai/           # LLM dispatcher + 5 backend implementations + prompts
  sources/      # fetcher dispatch + per-source TS modules
  trading/      # Yahoo finance + technical indicators + watchlist
  output/       # render.ts (HTML+MD generation), all CSS inlined
  utils.ts      # tiny shared helpers (todayKey, getReportTz)
scripts/
  _env.ts             # dotenv preload — imported FIRST by every entry script
  daily.ts            # main pipeline (5-8 min, ~6 LLM calls)
  dry-run.ts          # fetch-only validation (~30s, no LLM)
  render.ts           # re-render HTML/MD from cached sidecar (~1s)
  regen-trading.ts    # rerun just the trading commentary
  regen-enrich.ts     # top up missing summaries for a subgroup
  build-site.mjs      # generate index.html + archive.html for static hosting
  deploy.mjs          # scp HTML to a remote nginx host (opt-in)
  sources.ts          # `npm run sources` — list/validate sources.config.json
  install.mjs         # cross-platform OS scheduler registration
  run-daily.mjs       # scheduler wrapper (daily + log + deploy + open)
  open-report.mjs     # cross-platform "open latest report" helper
  uninstall.mjs       # tear down scheduler + ~/.claude/ links
  quota-report.ts     # LLM call usage summary
sources.config.json   # SINGLE SOURCE OF TRUTH for the source registry
```

## Core invariants

1. **`sources.config.json` is the only place sources live.** `lib/sources/registry.ts` is just a JSON loader + locale filter. Never hardcode a source list in TS.

2. **LLM calls go through `lib/ai/llm.ts` `runLlm()`.** Backends behind `LLM_BACKEND` include `claude-cli` (default), `anthropic`, `openai`, `deepseek`, `minimax`, `atlascloud`, and `zhipu`. Never import a specific backend directly — that defeats the switch.

3. **Date keying uses `lib/utils.ts` `todayKey()`.** Honors `REPORT_TZ` env var; defaults to system local TZ. Don't hardcode `Asia/Shanghai` or `UTC` anywhere.

4. **Localization via `REPORT_LOCALE` (`zh` | `en`).** All UI text in render.ts goes through `STR.<key>`; LLM prompts have ZH/EN pairs picked at module-init. When adding strings, add both.

5. **Per-source fetch errors are non-fatal.** `scripts/daily.ts` has a try/catch per source. Never `process.exit()` inside a fetcher.

6. **No agent-specific build steps.** No `next build`, no bundling. `tsx` runs TS directly. The HTML is hand-rendered, CSS is inlined string-templated.

## Commands

| Task | Command | Cost |
|---|---|---|
| Full pipeline | `npm run daily` | ~5-8 min, ~6 LLM calls |
| Fetch-only sanity check | `npm run dry-run` | ~30s, no LLM |
| Re-render from cache | `npm run render [date]` | <1s |
| Re-run trading section | `npm run regen-trading [date]` | ~2 min, 1 LLM call |
| Top up missing summaries | `npm run regen-enrich <cat:sub> [date]` | ~30s, 1 LLM call |
| Static-site generator | `npm run build-site` | <1s |
| List sources by status | `npm run sources` | instant |
| Validate sources.config.json | `npm run sources:check` | instant |

`[date]` defaults to today in `REPORT_TZ`. Output is `daily_reports/<date>/<date>.html` + `<date>.json` + `<date>-articles.json` (note the hyphen in the articles cache filename); add `<date>.md` if `OUTPUT_MARKDOWN=true`.

## Adding a source

1. Edit `sources.config.json` — append an entry. Fields: `id` (unique), `name`, `type` (`rss`/`api`/`scrape`), `url`, `category` (`tech`/`finance`/`politics`), optional `subcategory`, `enabled`, `useCurl`, `lang`, `locales`, `notes`.
2. For non-RSS types: add a fetcher in `lib/sources/<id>.ts` exporting `fetchXxx(sourceId)` returning `RawArticle[]`, then add a branch in `lib/sources/dispatch.ts`.
3. Run `npm run sources:check` to validate the JSON, then `npm run dry-run` to verify the fetch.

## Adding an LLM backend

1. New file `lib/ai/backends/<name>.ts` exporting a function compatible with the existing backends (see `claude-cli.ts` as the minimum reference).
2. Add a branch in `lib/ai/llm.ts` `runLlm()`.
3. Add `<NAME>_API_KEY` + optional `<NAME>_BASE_URL` to `.env.example`.

## Debugging a failed run

1. `logs/daily-<YYYY-MM-DD>.log` — full pipeline output for that day (date in local time, NOT UTC)
2. `logs/llm-calls.jsonl` — every LLM call with input size, latency, success, error category
3. `npm run quota-report` — usage summary by backend
4. If a tab renders wrong but the data is right, `npm run render` (1s) usually fixes display-only bugs without rerunning LLM

## What NOT to do

- Don't add Playwright / Puppeteer for fetching — the project stays light with curl + JSON APIs
- Don't import a specific LLM backend module directly; always go through `runLlm`
- Don't hardcode sources in TS — use `sources.config.json`
- Don't write into `daily_reports/` directly from agent code; let `scripts/daily.ts` or `render.ts` own that
- Don't add a web framework (Next.js, Express, etc.) — the project is intentionally static
- Don't bypass the per-source try/catch — let `daily.ts` aggregate failures

## Where to learn more

- `README.md` — user-facing intro, install, configuration
- `FORKING.md` — common customizations (LLM provider, sources, layout, styling)
- `.claude/skills/daily-brief/SKILL.md` — fuller operational reference (Claude Code auto-loads it; other agents can read it directly)
- `sources.config.json` — see what sources look like in practice
