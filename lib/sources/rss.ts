import Parser from "rss-parser";
import { curlFetch } from "./curl-fetch";
import type { Category, RawArticle } from "./types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; DailyBriefBot/1.0; +https://github.com/)",
  },
});

const CURL_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function fetchRss(
  sourceId: string,
  url: string,
  category: Category,
  options: { limit?: number; useCurl?: boolean } = {},
): Promise<RawArticle[]> {
  const limit = options.limit ?? 30;
  const proxyConfigured = Boolean(
    process.env.HTTPS_PROXY?.trim() ||
      process.env.https_proxy?.trim() ||
      process.env.ALL_PROXY?.trim() ||
      process.env.all_proxy?.trim(),
  );

  let feed;
  // rss-parser uses node:https directly and does not honor proxy environment
  // variables. curl does, so route RSS through curl whenever a proxy is active.
  if (options.useCurl || proxyConfigured) {
    const xml = await curlFetch(url, CURL_HEADERS);
    feed = await parser.parseString(xml);
  } else {
    feed = await parser.parseURL(url);
  }

  return (feed.items ?? [])
    .slice(0, limit)
    .map((item) => ({
      sourceId,
      title: (item.title ?? "").trim(),
      url: (item.link ?? "").trim(),
      excerpt: stripHtml(item.contentSnippet ?? item.content ?? "").slice(
        0,
        300,
      ),
      publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
      category,
    }))
    .filter((a) => a.title && a.url);
}
