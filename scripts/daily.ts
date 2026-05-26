import "./_env";

import fs from "node:fs";
import path from "node:path";

import { sources, REPORT_LOCALE } from "../lib/sources/registry";
import { fetchSource } from "../lib/sources/dispatch";
import {
  generateDailyReport,
  type ArticleInput,
} from "../lib/ai/pipeline";
import { getModelTag, validateBackendCredentials } from "../lib/ai/llm";
import {
  enrichFinanceNewsSummaries,
  enrichGithubTrendingSummaries,
  enrichXViralSummaries,
} from "../lib/ai/enrich";
import {
  groupRaw,
  isSportsArticle,
  MERGED_SUBGROUP_LIMITS,
  renderHtml,
  renderMarkdown,
} from "../lib/output/render";
import { analyzeWatchlist } from "../lib/trading/runner";
import { fetchCryptoFearGreed } from "../lib/trading/fear-greed";
import { fetchCryptoGlobal } from "../lib/trading/coingecko";
import { generateTradingCommentary } from "../lib/ai/trading-commentary";
import type { TradingSection } from "../lib/ai/pipeline";
import { todayKey } from "../lib/utils";

const OUTPUT_DIR = "daily_reports";

async function fetchAll(): Promise<ArticleInput[]> {
  const articles: ArticleInput[] = [];
  const enabled = sources.filter((s) => s.enabled !== false);
  for (const source of enabled) {
    try {
      const items = await fetchSource(source);
      console.log(`  ${source.id.padEnd(20)} ${items.length}`);
      articles.push(...items.map((it) => ({ ...it, source: source.name })));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ${source.id.padEnd(20)} FAILED — ${msg}`);
    }
  }
  return articles;
}

async function enrichGhTrending(articles: ArticleInput[]): Promise<void> {
  const gh = articles.filter((a) => a.sourceId === "github-trending");
  if (gh.length === 0) return;
  console.log(
    `[daily] enriching ${gh.length} GitHub Trending repos with ${REPORT_LOCALE} summaries…`,
  );
  const t0 = Date.now();
  const summaries = await enrichGithubTrendingSummaries(gh);
  for (const a of gh) {
    const s = summaries.get(a.url);
    if (s) a.summary = s;
  }
  console.log(
    `[daily] enrichment done in ${((Date.now() - t0) / 1000).toFixed(1)}s, matched ${summaries.size}/${gh.length}`,
  );
}

/**
 * finance:news is rendered as a merged time-sorted list (see
 * MERGED_SUBGROUP_LIMITS in render.ts). Enrich exactly the items that
 * will be displayed: take all enabled finance:news articles, sort by
 * publishedAt desc, slice to the merge limit, ask Sonnet for Chinese
 * factual summaries.
 */
async function enrichFinanceNews(articles: ArticleInput[]): Promise<void> {
  await enrichMergedSubgroup(articles, "finance", "news");
}

async function enrichPolitics(articles: ArticleInput[]): Promise<void> {
  await enrichMergedSubgroup(articles, "politics", "world");
}

async function enrichAiNews(articles: ArticleInput[]): Promise<void> {
  await enrichMergedSubgroup(articles, "tech", "ai-news");
}

/**
 * X 热帖 enrichment is different from merged subgroups — we preserve the
 * AttentionVC API's heat-rank order (do NOT sort by date) and cap to the
 * displayed limit (matches SOURCE_DISPLAY_LIMITS["tech:x-viral"]).
 *
 * The Sonnet prompt also differs (XVIRAL_SYSTEM_PROMPT in enrich.ts) — X
 * tweet titles are clickbait, the previewText holds the actual claim.
 */
async function enrichXViral(articles: ArticleInput[]): Promise<void> {
  const xPosts = articles
    .filter((a) => a.sourceId === "attentionvc-ai")
    .slice(0, 20);
  if (xPosts.length === 0) return;
  console.log(`[daily] enriching ${xPosts.length} X posts with ${REPORT_LOCALE} summaries…`);
  const t0 = Date.now();
  // Author handle is encoded in the URL (https://x.com/{handle}/status/{id})
  // — extract it to help the model identify whose claim it is.
  const summaries = await enrichXViralSummaries(
    xPosts.map((a) => ({
      url: a.url,
      title: a.title,
      excerpt: a.excerpt,
      author: a.url.match(/x\.com\/([^/]+)\//)?.[1] ?? "",
    })),
  );
  for (const a of xPosts) {
    const s = summaries.get(a.url);
    if (s) a.summary = s;
  }
  console.log(
    `[daily] enrichment done in ${((Date.now() - t0) / 1000).toFixed(1)}s, matched ${summaries.size}/${xPosts.length}`,
  );
}

/**
 * Shared implementation for "merged subgroup" enrichment: collect all
 * enabled articles in (category, subcategory), sort by date desc, take
 * the display cap (from MERGED_SUBGROUP_LIMITS), and ask the LLM to
 * summarize them into REPORT_LOCALE in a single batch. Symmetric to the
 * merge logic in render.ts groupRaw, so display and enrichment stay aligned.
 *
 * Sources whose `lang` already matches REPORT_LOCALE are skipped — no
 * point translating English to English (en mode) or Chinese to Chinese
 * (zh mode).
 */
async function enrichMergedSubgroup(
  articles: ArticleInput[],
  category: "tech" | "finance" | "politics",
  subcategory: string,
): Promise<void> {
  const subSources = sources.filter(
    (s) =>
      s.category === category &&
      s.subcategory === subcategory &&
      s.enabled !== false,
  );
  const enabledIds = new Set(subSources.map((s) => s.id));
  const sameLocaleIds = new Set(
    subSources.filter((s) => (s.lang ?? "en") === REPORT_LOCALE).map((s) => s.id),
  );
  const limit = MERGED_SUBGROUP_LIMITS[`${category}:${subcategory}`] ?? 12;
  // Top-N respects all enabled sources (so we don't reshape the merged
  // timeline). Enrichment only targets items NOT already in the target
  // language within that slice.
  const top = articles
    .filter((a) => enabledIds.has(a.sourceId))
    .filter((a) => category !== "politics" || !isSportsArticle(a.title))
    .sort(
      (a, b) =>
        (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
    )
    .slice(0, limit);
  const toEnrich = top.filter((a) => !sameLocaleIds.has(a.sourceId));
  if (toEnrich.length === 0) return;
  console.log(
    `[daily] enriching ${toEnrich.length}/${top.length} ${category}:${subcategory} items with ${REPORT_LOCALE} summaries…`,
  );
  const t0 = Date.now();
  const summaries = await enrichFinanceNewsSummaries(toEnrich);
  for (const a of toEnrich) {
    const s = summaries.get(a.url);
    if (s) a.summary = s;
  }
  console.log(
    `[daily] enrichment done in ${((Date.now() - t0) / 1000).toFixed(1)}s, matched ${summaries.size}/${toEnrich.length}`,
  );
}

/**
 * Pull daily OHLCV from Yahoo for every ticker in the watchlist, compute
 * indicators + signals, then ask Sonnet for a market overview + a
 * picks-to-watch list. Returns null if no ticker came back.
 */
async function runTrading(): Promise<TradingSection | null> {
  console.log(`[daily] analyzing watchlist + crypto context (Yahoo / alt.me / CoinGecko)…`);
  const t0 = Date.now();
  const [tickers, cryptoFearGreed, cryptoGlobal] = await Promise.all([
    analyzeWatchlist(),
    fetchCryptoFearGreed(),
    fetchCryptoGlobal(),
  ]);
  console.log(
    `[daily] indicators ready in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${tickers.length} tickers` +
      (cryptoFearGreed ? `, F&G ${cryptoFearGreed.value}` : ", F&G ✗") +
      (cryptoGlobal
        ? `, BTC dom ${cryptoGlobal.btcDominance.toFixed(1)}%`
        : ", CG ✗"),
  );
  if (tickers.length === 0) return null;
  console.log(`[daily] generating trading commentary with ${getModelTag()}…`);
  const t1 = Date.now();
  const commentary = await generateTradingCommentary({
    tickers,
    cryptoFearGreed: cryptoFearGreed ?? undefined,
    cryptoGlobal: cryptoGlobal ?? undefined,
  });
  console.log(
    `[daily] trading commentary ready in ${((Date.now() - t1) / 1000).toFixed(1)}s`,
  );
  return {
    ...commentary,
    tickers,
    crypto_fear_greed: cryptoFearGreed ?? undefined,
    crypto_global: cryptoGlobal ?? undefined,
    generated_at: new Date().toISOString(),
  };
}

/** 从 JSON 文件加载旧文章，将 publishedAt 转回 Date 对象 */
function loadCachedArticles(file: string): ArticleInput[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  const list: any[] = raw.articles || [];
  return list.map((a: any) => ({
    ...a,
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : undefined,
  }));
}

async function main() {
  // Fail fast on misconfigured backend before we spend 30s fetching
  // 500+ articles only to discover the LLM has no credentials.
  validateBackendCredentials();

  const date = todayKey();
  const dateDir = path.join(OUTPUT_DIR, date);
  const articlesFile = path.join(dateDir, `${date}-articles.json`);

  console.log(`[daily] ${date} — fetching sources…\n`);
  const articles = await fetchAll();
  console.log(`\n[daily] total articles: ${articles.length}`);
  if (articles.length === 0) {
    throw new Error("no articles fetched — aborting");
  }

  // 如果当天已有旧数据，合并去重（按 URL）
  if (fs.existsSync(articlesFile)) {
    try {
      const existing = loadCachedArticles(articlesFile);
      if (existing.length > 0) {
        const seen = new Map(articles.map((a) => [a.url, a]));
        let added = 0;
        for (const old of existing) {
          const existingNew = seen.get(old.url);
          if (existingNew) {
            // 同 URL：保留旧文摘要（新取的文章没有 summary）
            if (old.summary && !existingNew.summary) {
              existingNew.summary = old.summary;
            }
          } else {
            articles.push(old);
            seen.set(old.url, old);
            added++;
          }
        }
        console.log(`[daily] merged ${added} new + ${existing.length - added} duplicate summaries kept → ${articles.length} total`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[daily] failed to load cached articles, continuing fresh: ${msg}`);
    }
  }

  // Enrich GH Trending, finance news, and politics with Chinese summaries.
  await enrichGhTrending(articles);
  await enrichFinanceNews(articles);
  await enrichPolitics(articles);
  await enrichAiNews(articles);
  await enrichXViral(articles);

  // Trading signals: Yahoo fetch + indicators + commentary. Non-fatal —
  // if it errors, we still ship the news digest.
  let trading: TradingSection | null = null;
  try {
    trading = await runTrading();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[daily] trading section failed: ${msg}`);
  }

  console.log(`[daily] generating digest with ${getModelTag()}…`);
  const t0 = Date.now();
  const { report } = await generateDailyReport(articles);
  if (trading) report.trading = trading;
  console.log(`[daily] digest ready in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // 写入文件（每日仅一份，无后缀覆盖）
  fs.mkdirSync(dateDir, { recursive: true });
  const base = path.join(dateDir, date);
  const raw = groupRaw(articles, sources);

  // 原子写入：先写 .tmp 后 rename，防止读取到半写文件
  fs.writeFileSync(`${base}.json.tmp`, JSON.stringify(report, null, 2), "utf8");
  fs.renameSync(`${base}.json.tmp`, `${base}.json`);

  fs.writeFileSync(
    `${base}-articles.json.tmp`,
    JSON.stringify({ date, articles }, null, 2),
    "utf8",
  );
  fs.renameSync(`${base}-articles.json.tmp`, `${base}-articles.json`);

  fs.writeFileSync(`${base}.html.tmp`, renderHtml(report, raw, date), "utf8");
  fs.renameSync(`${base}.html.tmp`, `${base}.html`);

  if (process.env.OUTPUT_MARKDOWN === "true") {
    fs.writeFileSync(`${base}.md.tmp`, renderMarkdown(report, date), "utf8");
    fs.renameSync(`${base}.md.tmp`, `${base}.md`);
    console.log(`[daily] wrote ${base}.{json,html,md,articles.json}`);
  } else {
    console.log(`[daily] wrote ${base}.{json,html,articles.json}`);
  }

  console.log(`[daily] done.`);
}

main().catch((e) => {
  console.error(`[daily] FAILED:`, e);
  process.exit(1);
});
