import type { RawArticle } from "./types";

/**
 * 华尔街见闻（WallStreetCN）—— 国内财经主力源。
 *
 * 官方信息流 API（与 news-aggregator skill 长期共用，稳定可用）：
 *   channel=global-channel 为全球频道，含中国市场/宏观/公司条目。
 * 返回结构：data.items[].resource.{title, content_short, uri, display_time}。
 *
 * 标题级过滤：丢弃空标题、过短标题、广告/活动类条目，按 URL 去重。
 */

interface WallstcnResource {
  title?: string;
  content_text?: string;
  uri?: string;
  display_time?: number;
}

interface WallstcnItem {
  resource?: WallstcnResource;
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; DailyBriefBot/1.0)",
  Accept: "application/json",
} as const;

// 广告 / 活动 / 无信息量标题
const JUNK_RE = /(广告|推广|报名|直播预告|限时|领券|抽奖|扫码|下载\s*App|会员日|双11|双十一|618)/i;

export async function fetchWallstreetcn(
  sourceId: string,
  limit = 20,
): Promise<RawArticle[]> {
  try {
    const url =
      "https://api-one.wallstcn.com/apiv1/content/information-flow?channel=global-channel&accept=article&limit=30";
    const r = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) return [];

    const data = (await r.json()) as { data?: { items?: WallstcnItem[] } };
    const items = data.data?.items ?? [];

    const seen = new Set<string>();
    const out: RawArticle[] = [];

    for (const it of items) {
      const res = it.resource;
      if (!res) continue;

      const title = (res.title || "").trim();
      const uri = (res.uri || "").trim();
      if (!title || title.length < 8) continue;
      if (JUNK_RE.test(title)) continue;
      if (seen.has(uri)) continue;
      seen.add(uri);

      out.push({
        sourceId,
        title,
        url: /^https?:\/\//i.test(uri)
          ? uri
          : `https://wallstreetcn.com${uri.startsWith("/") ? uri : `/${uri}`}`,
        excerpt: (res.content_text || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 200),
        publishedAt: res.display_time
          ? new Date(res.display_time * 1000)
          : undefined,
        category: "finance" as const,
      });

      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}
