import { fetchAttentionVc } from "./attentionvc";
import { fetchGithubTrending } from "./github-trending";
import { fetchHackerNews } from "./hackernews";
import { fetchHuggingfacePapers } from "./huggingface-papers";
import { fetchLinuxDo } from "./linuxdo";
import { fetchRss } from "./rss";
import { fetchSinaFinance } from "./sina-finance";
import { fetchV2ex } from "./v2ex";
import { fetchWallstreetcn } from "./wallstreetcn";
import type { RawArticle, SourceDef } from "./types";

/**
 * Single dispatcher used by daily.ts, dry-run.ts, and the cron route.
 * Add a new branch here when introducing a non-RSS fetcher.
 */
export async function fetchSource(source: SourceDef): Promise<RawArticle[]> {
  if (source.id === "hackernews") return fetchHackerNews(source.id);
  if (source.id === "github-trending") return fetchGithubTrending(source.id);
  if (source.id === "v2ex-hot") return fetchV2ex(source.id);
  if (source.id === "linuxdo") return fetchLinuxDo(source.id);
  if (source.id === "attentionvc-ai") return fetchAttentionVc(source.id);
  if (source.id === "huggingface-papers") return fetchHuggingfacePapers(source.id, source.keywords);
  if (source.id === "wallstreetcn") return fetchWallstreetcn(source.id);
  if (source.id === "sina-finance") return fetchSinaFinance(source.id);
  return fetchRss(source.id, source.url, source.category, {
    useCurl: source.useCurl,
    keywords: source.keywords,
  });
}
