import fs from "node:fs";
import path from "node:path";

/**
 * Summarise LLM usage from logs/llm-calls.jsonl, grouped by backend.
 *
 * Every backend (claude-cli / anthropic / openai / deepseek / minimax / atlascloud)
 * logs a record per call via lib/ai/log.ts:
 *   { ts, backend, model, durationMs, success, inputChars, outputChars,
 *     errorCategory, errorSnippet }
 *
 * For claude-cli we additionally visualise the Max-subscription 5-hour
 * rolling window since that's the actual rate-limit unit. For API
 * backends we show 24h spending instead since they bill per-token, not
 * per rolling window.
 *
 * Usage: npm run quota-report
 */

interface CallRecord {
  ts: string;
  backend?: string;
  model: string;
  durationMs: number;
  success: boolean;
  inputChars: number;
  outputChars: number;
  errorCategory: "timeout" | "quota" | "auth" | "other" | null;
  errorSnippet?: string | null;
  /** Pre-v2 records stored the same field under stderrSnippet. */
  stderrSnippet?: string | null;
}

const LOG_PATH = path.join("logs", "llm-calls.jsonl");
const LEGACY_LOG_PATH = path.join("logs", "claude-calls.jsonl");

const CHARS_PER_TOKEN = 3;

function loadCalls(): CallRecord[] {
  const out: CallRecord[] = [];
  for (const p of [LEGACY_LOG_PATH, LOG_PATH]) {
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const rec = JSON.parse(line) as CallRecord;
        // Legacy records (pre-v2) lack `backend` — they were all claude-cli.
        if (!rec.backend) rec.backend = "claude-cli";
        if (!rec.errorSnippet && rec.stderrSnippet) {
          rec.errorSnippet = rec.stderrSnippet;
        }
        out.push(rec);
      } catch {
        // skip malformed line
      }
    }
  }
  return out;
}

function fmtTokens(chars: number): string {
  const tok = chars / CHARS_PER_TOKEN;
  if (tok >= 1_000_000) return `${(tok / 1_000_000).toFixed(2)}M`;
  if (tok >= 1_000) return `${(tok / 1_000).toFixed(1)}K`;
  return tok.toFixed(0);
}

function fmtTime(ts: string): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function bar(value: number, max: number, width = 24): string {
  const ratio = Math.min(1, value / max);
  const filled = Math.round(ratio * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function sumChars(arr: CallRecord[]): { input: number; output: number } {
  return arr.reduce(
    (acc, c) => {
      acc.input += c.inputChars;
      acc.output += c.outputChars;
      return acc;
    },
    { input: 0, output: 0 },
  );
}

function reportClaudeCli(calls: CallRecord[]) {
  const now = Date.now();
  const fiveHoursAgo = now - 5 * 3600 * 1000;
  const recent5h = calls.filter((c) => new Date(c.ts).getTime() >= fiveHoursAgo);
  const w5 = sumChars(recent5h);
  const SOFT_CAP_TOK = 1_000_000;

  console.log(`■ 当前 5 小时滚动窗口 (Max 订阅扣额单位)`);
  console.log(`  调用次数:        ${recent5h.length}`);
  console.log(
    `  累计 input:      ${fmtTokens(w5.input).padStart(7)}  ${bar(w5.input / CHARS_PER_TOKEN, SOFT_CAP_TOK)}  / ~1M 软上限`,
  );
  console.log(`  累计 output:     ${fmtTokens(w5.output).padStart(7)}`);
  const ratio = w5.input / CHARS_PER_TOKEN / SOFT_CAP_TOK;
  if (ratio > 0.7) console.log(`  ⚠ 已超过软上限 70%，再跑大任务可能会撞 quota`);
  else if (ratio > 0.4) console.log(`  ⚪ 处于中段，还有余量`);
  else console.log(`  ✓ 余量充足`);
}

function reportApiBackend(backend: string, calls: CallRecord[]) {
  const now = Date.now();
  const oneDayAgo = now - 24 * 3600 * 1000;
  const recent24h = calls.filter((c) => new Date(c.ts).getTime() >= oneDayAgo);
  const w24 = sumChars(recent24h);
  console.log(`■ 最近 24 小时 (按 token 计费)`);
  console.log(`  调用次数:        ${recent24h.length}`);
  console.log(`  累计 input:      ${fmtTokens(w24.input)}`);
  console.log(`  累计 output:     ${fmtTokens(w24.output)}`);
  console.log(`  注：精确 token / 美元数请去 ${backend} 控制台核对`);
}

function main() {
  const calls = loadCalls();
  if (calls.length === 0) {
    console.log("没有调用记录。先跑一次 `npm run daily` 或任何会调 LLM 的命令。");
    return;
  }

  // Group by backend
  const byBackend = new Map<string, CallRecord[]>();
  for (const c of calls) {
    const arr = byBackend.get(c.backend!) ?? [];
    arr.push(c);
    byBackend.set(c.backend!, arr);
  }

  console.log("");
  console.log(`=== LLM usage  (本地 ${LOG_PATH}, 共 ${calls.length} 条) ===`);

  for (const [backend, list] of [...byBackend.entries()].sort()) {
    console.log("");
    console.log(`──── backend: ${backend}  (${list.length} 次) ────`);
    console.log("");
    if (backend === "claude-cli") {
      reportClaudeCli(list);
    } else {
      reportApiBackend(backend, list);
    }

    // Failures per backend
    const failures = list.filter((c) => !c.success);
    if (failures.length > 0) {
      const quota = failures.filter((c) => c.errorCategory === "quota").length;
      const timeout = failures.filter((c) => c.errorCategory === "timeout").length;
      const auth = failures.filter((c) => c.errorCategory === "auth").length;
      const other = failures.length - quota - timeout - auth;
      console.log("");
      console.log(`  失败 ${failures.length}: quota ${quota} · timeout ${timeout} · auth ${auth} · 其它 ${other}`);
      const recent = failures.slice(-3);
      for (const f of recent) {
        console.log(`    ${fmtTime(f.ts)}  ${f.errorCategory ?? "?"}  ${(f.errorSnippet ?? "").slice(0, 80)}`);
      }
    }
  }

  // ----- last 10 calls (all backends) -----
  console.log("");
  console.log(`■ 最近 10 次调用 (全部 backend)`);
  for (const c of calls.slice(-10)) {
    const status = c.success ? "✓" : `✗ ${c.errorCategory ?? "?"}`;
    console.log(
      `  ${fmtTime(c.ts)}  ${(c.backend ?? "?").padEnd(11)} ${status.padEnd(10)} ${(c.durationMs / 1000).toFixed(1).padStart(5)}s  ` +
        `${c.inputChars.toString().padStart(6)} → ${c.outputChars.toString().padStart(5)}`,
    );
  }
  console.log("");
}

main();
