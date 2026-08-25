/**
 * LLM backend dispatcher.
 *
 * All call sites (pipeline / enrich / trading-commentary) import `runLlm`
 * from this module instead of binding to a specific backend. The actual
 * backend is selected at runtime by the LLM_BACKEND environment variable:
 *
 *   LLM_BACKEND=claude-cli   (default; uses local Claude Code CLI, Max billing)
 *   LLM_BACKEND=anthropic    (Anthropic Messages API)
 *   LLM_BACKEND=openai       (OpenAI Chat Completions)
 *   LLM_BACKEND=deepseek     (DeepSeek, OpenAI-compatible)
 *   LLM_BACKEND=minimax      (MiniMax, OpenAI-compatible)
 *   LLM_BACKEND=zhipu        (Zhipu AI / 智谱, Anthropic-compatible)
 *
 * Per-backend config (API keys, models, base URLs) lives in .env.local.
 * See .env.example for the full list.
 */

import {
  CLAUDE_MODEL,
  runClaudeCli,
  validateClaudeCliAvailable,
} from "./backends/claude-cli";
import {
  PRESETS as ANTHROPIC_PRESETS,
  anthropicCompatModel,
  runAnthropicCompat,
} from "./backends/anthropic-compat";
import {
  PRESETS as OPENAI_PRESETS,
  openaiCompatModel,
  runOpenAICompat,
} from "./backends/openai-compat";

export interface LlmRunOptions {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
}

export interface LlmRunResult {
  text: string;
  durationMs: number;
}

export type LlmBackendId =
  | "claude-cli"
  | "anthropic"
  | "openai"
  | "deepseek"
  | "minimax"
  | "zhipu";

const VALID_BACKENDS: ReadonlySet<LlmBackendId> = new Set([
  "claude-cli",
  "anthropic",
  "openai",
  "deepseek",
  "minimax",
  "zhipu",
]);

export function getBackend(): LlmBackendId {
  const raw = (process.env.LLM_BACKEND?.trim() || "claude-cli").toLowerCase();
  if (!VALID_BACKENDS.has(raw as LlmBackendId)) {
    throw new Error(
      `Unknown LLM_BACKEND='${raw}'. Valid values: ${[...VALID_BACKENDS].join(", ")}`,
    );
  }
  return raw as LlmBackendId;
}

/**
 * Returns the active model name for the configured backend, useful for
 * stamping a MODEL_TAG into report metadata.
 */
function getActiveModel(backend: LlmBackendId): string {
  switch (backend) {
    case "claude-cli":
      return CLAUDE_MODEL;
    case "anthropic":
    case "zhipu":
      return anthropicCompatModel(ANTHROPIC_PRESETS[backend]);
    case "openai":
    case "deepseek":
    case "minimax":
      return openaiCompatModel(OPENAI_PRESETS[backend]);
  }
}

export function getModelTag(): string {
  const backend = getBackend();
  return `${backend}-${getActiveModel(backend)}`;
}

export async function runLlm(opts: LlmRunOptions): Promise<LlmRunResult> {
  const backend = getBackend();
  switch (backend) {
    case "claude-cli":
      return runClaudeCli(opts);
    case "anthropic":
    case "zhipu":
      return runAnthropicCompat(opts, ANTHROPIC_PRESETS[backend]);
    case "openai":
    case "deepseek":
    case "minimax":
      return runOpenAICompat(opts, OPENAI_PRESETS[backend]);
  }
}
/**
 * Cheap startup sanity-check so a misconfigured backend errors in <1s
 * instead of after 30s of source-fetching + half a dozen confusing
 * "ANTHROPIC_API_KEY required" lines deep into the pipeline.
 *
 * The default LLM_BACKEND in the GH Actions workflow is `deepseek`,
 * so the most common forker mistake is: add ANTHROPIC_API_KEY as a
 * secret, forget to add the matching `LLM_BACKEND=anthropic` variable,
 * then watch the run blow up looking for a key they never intended
 * to use. We detect that exact case and tell them how to fix it.
 */
export function validateBackendCredentials(): void {
  const backend = getBackend();
  if (backend === "claude-cli") {
    validateClaudeCliAvailable();
    return;
  }

  const required: Record<Exclude<LlmBackendId, "claude-cli">, string> = {
    anthropic: "ANTHROPIC_API_KEY",
    openai: "OPENAI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    minimax: "MINIMAX_API_KEY",
    zhipu: "ZHIPU_API_KEY",
  };
  const requiredVar = required[backend];

  if (process.env[requiredVar] || process.env.LLM_API_KEY) return;

  const otherKeysSet = Object.entries(required)
    .filter(([b, v]) => b !== backend && !!process.env[v])
    .map(([b, v]) => ({ backend: b, var: v }));

  const lines: string[] = [
    `LLM_BACKEND=${backend} but ${requiredVar} (and generic LLM_API_KEY) are both unset.`,
  ];
  if (otherKeysSet.length > 0) {
    lines.push(
      "",
      "Other API keys ARE present in the environment — likely you meant to use one of those:",
    );
    for (const k of otherKeysSet) {
      lines.push(`  • ${k.var} is set → switch to LLM_BACKEND=${k.backend}`);
    }
    lines.push(
      "",
      "Fix one of:",
      `  (a) set LLM_BACKEND to match the key you actually have, or`,
      `  (b) add ${requiredVar} for the backend you currently selected.`,
    );
  } else {
    lines.push(
      "",
      `Fix: set ${requiredVar} (or the generic LLM_API_KEY).`,
    );
  }
  lines.push(
    "",
    "Where to set it:",
    "  • Local:          .env.local at the repo root",
    "  • GitHub Actions: Settings → Secrets and variables → Actions",
    "                    (Secrets tab for the API key, Variables tab for LLM_BACKEND)",
  );
  throw new Error(lines.join("\n"));
}
