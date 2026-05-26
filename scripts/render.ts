import "./_env";

import fs from "node:fs";
import path from "node:path";

import type { ArticleInput, DailyReport } from "../lib/ai/pipeline";
import { groupRaw, renderHtml, renderMarkdown } from "../lib/output/render";
import { sources } from "../lib/sources/registry";
import { todayKey } from "../lib/utils";

const OUTPUT_DIR = "daily_reports";

/**
 * Re-render HTML + Markdown from a previously-saved daily report.
 *
 * Use this for UI-only iteration (CSS / layout / labels) — no RSS fetch,
 * no LLM call, no Max quota consumed. Requires that `npm run daily` has
 * been run for the target date so the sidecar `<date>-articles.json`
 * exists.
 *
 * Usage:
 *   npm run render              # today
 *   npm run render -- 2026-05-15  # specific date
 */
function resolveFile(dateDir: string, name: string): string {
  return path.join(dateDir, name);
}

function loadReport(date: string): DailyReport {
  const dateDir = path.join(OUTPUT_DIR, date);
  const file = resolveFile(dateDir, `${date}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Report JSON not found for ${date}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8")) as DailyReport;
}

function loadArticles(date: string): ArticleInput[] {
  const dateDir = path.join(OUTPUT_DIR, date);
  const file = resolveFile(dateDir, `${date}-articles.json`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `Articles sidecar not found: ${file}\n` +
        `Run \`npm run daily\` for ${date} first (or any date >= when sidecar was introduced).`,
    );
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8")) as {
    articles: Array<
      Omit<ArticleInput, "publishedAt"> & { publishedAt?: string }
    >;
  };
  return data.articles.map((a) => ({
    ...a,
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : undefined,
  }));
}

async function main() {
  const date = process.argv[2] || todayKey();
  console.log(`[render] re-rendering ${date} from cached data…`);

  const report = loadReport(date);
  const articles = loadArticles(date);
  console.log(`[render] loaded ${articles.length} articles + report`);

  const raw = groupRaw(articles, sources);
  const dateDir = path.join(OUTPUT_DIR, date);
  fs.mkdirSync(dateDir, { recursive: true });
  const base = path.join(dateDir, date);
  // 原子写入
  fs.writeFileSync(`${base}.html.tmp`, renderHtml(report, raw, date), "utf8");
  fs.renameSync(`${base}.html.tmp`, `${base}.html`);
  if (process.env.OUTPUT_MARKDOWN === "true") {
    fs.writeFileSync(`${base}.md.tmp`, renderMarkdown(report, date), "utf8");
    fs.renameSync(`${base}.md.tmp`, `${base}.md`);
    console.log(`[render] wrote ${base}.{html,md}`);
  } else {
    console.log(`[render] wrote ${base}.html`);
  }
}

main().catch((e) => {
  console.error("[render] FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
