import type { RawArticle } from "./types";

/**
 * 新浪财经滚动新闻 —— A股/港股/美股中文财经补充源。
 *
 * 官方滚动 API：pageid=153&lid=2516 为财经新闻频道，返回 JSON。
 * 结构：result.data[]，字段 title / url / intro（摘要）/ ctime（Unix 秒）/ media_name。
 * 与华尔街见闻互为兜底：一个不可达时另一个仍提供国内财经内容。
 */

interface SinaItem {
  title?: string;
  url?: string;
  intro?: string;
  ctime?: number;
  media_name?: string;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; DailyBriefBot/1.0)",
  Accept: "application/json",
} as const;

const JUNK_RE = /(广告|推广|报名|限时|抽奖|扫码)/i;

export async function fetchSinaFinance(
  sourceId: string,
  limit = 20,
): Promise<RawArticle[]> {
  try {
    const url =
      "https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=50&page=1";
    const r = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return [];

    const data = (await r.json()) as { result?: { data?: SinaItem[] } };
    const items = data.result?.data ?? [];

    const seen = new Set<string>();
    const out: RawArticle[] = [];

    for (const it of items) {
      const title = (it.title || "").trim();
      const u = (it.url || "").trim();
      if (!title || title.length < 6) continue;
      if (JUNK_RE.test(title)) continue;
      if (seen.has(u)) continue;
      seen.add(u);

      out.push({
        sourceId,
        title,
        url: u,
        excerpt: (it.intro || "").slice(0, 200),
        publishedAt: it.ctime ? new Date(it.ctime * 1000) : undefined,
        category: "finance" as const,
        meta: it.media_name ? `来源：${it.media_name}` : undefined,
      });

      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}
