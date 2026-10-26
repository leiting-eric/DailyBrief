import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFallbackDailyReport,
  generateDailyReport,
  type ArticleInput,
} from "./pipeline";

function article(
  category: ArticleInput["category"],
  index: number,
  summary?: string,
): ArticleInput {
  return {
    sourceId: `${category}-source-${index % 2}`,
    source: `Source ${index % 2}`,
    title: `${category} title ${index}`,
    url: `https://example.com/${category}/${index}`,
    excerpt: `${category} excerpt ${index}`,
    summary,
    category,
    publishedAt: new Date(Date.now() - index * 1_000),
  };
}

test("buildFallbackDailyReport preserves enriched summaries and category caps", () => {
  const articles = [
    ...Array.from({ length: 7 }, (_, i) =>
      article("tech", i, i === 0 ? "enriched tech summary" : undefined),
    ),
    ...Array.from({ length: 6 }, (_, i) => article("finance", i)),
    ...Array.from({ length: 4 }, (_, i) => article("politics", i)),
  ];

  const report = buildFallbackDailyReport(articles);

  assert.equal(report.tech_briefs.length, 5);
  assert.equal(report.finance_briefs.length, 5);
  assert.equal(report.politics_briefs.length, 3);
  assert.equal(report.tech_briefs[0]?.summary, "enriched tech summary");
  assert.equal(report.finance_briefs[0]?.summary, "finance excerpt 0");
});

test("generateDailyReport falls back after two truncated JSON responses", async () => {
  const articles = [article("tech", 0, "summary")];
  let attempts = 0;

  const { report } = await generateDailyReport(articles, async () => {
    attempts += 1;
    throw new SyntaxError("Unexpected end of JSON input");
  });

  assert.equal(attempts, 2);
  assert.equal(report.tech_briefs.length, 1);
  assert.equal(report.tech_briefs[0]?.summary, "summary");
});

test("generateDailyReport does not hide provider/auth failures", async () => {
  const articles = [article("tech", 0)];
  let attempts = 0;

  await assert.rejects(
    generateDailyReport(articles, async () => {
      attempts += 1;
      throw new Error("401 invalid API key");
    }),
    /401 invalid API key/,
  );
  assert.equal(attempts, 2);
});
