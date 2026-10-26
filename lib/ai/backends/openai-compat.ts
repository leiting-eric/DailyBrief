import OpenAI from "openai";
import { LlmIncompleteResponseError } from "../errors";
import { classifyError, logLlmCall } from "../log";
import type { LlmRunOptions, LlmRunResult } from "../llm";

/**
 * OpenAI-compatible backend. Reused for any provider that exposes the
 * standard `/chat/completions` endpoint: OpenAI itself, DeepSeek, MiniMax,
 * Groq, Together, OpenRouter, local LM Studio / Ollama, etc.
 */
export interface OpenAICompatConfig {
  /** Stable backend id, used in logs and error messages */
  backend: "openai" | "deepseek" | "minimax";
  defaultBaseUrl: string;
  defaultModel: string;
  apiKeyEnv: string;
  baseUrlEnv: string;
}

export const PRESETS: Record<OpenAICompatConfig["backend"], OpenAICompatConfig> = {
  openai: {
    backend: "openai",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
  },
  deepseek: {
    backend: "deepseek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    // deepseek-chat alias retires 2026-07-24 — point new users at the
    // current production model instead.
    defaultModel: "deepseek-v4-flash",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
  },
  minimax: {
    backend: "minimax",
    defaultBaseUrl: "https://api.minimax.io/v1",
    defaultModel: "MiniMax-M2.7",
    apiKeyEnv: "MINIMAX_API_KEY",
    baseUrlEnv: "MINIMAX_BASE_URL",
  },
};

const clientCache = new Map<string, OpenAI>();

function getClient(cfg: OpenAICompatConfig): { client: OpenAI; model: string } {
  // Provider-specific env wins; LLM_API_KEY / LLM_BASE_URL are generic
  // aliases so users pointing at a non-preset OpenAI-compatible service
  // (Moonshot, SiliconFlow, OpenRouter, self-hosted vLLM, ...) don't have
  // to misuse the OPENAI_* variable names just to reach a custom endpoint.
  const apiKey = process.env[cfg.apiKeyEnv] || process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error(
      `${cfg.apiKeyEnv} (or generic LLM_API_KEY) is required for LLM_BACKEND=${cfg.backend}. Set it in .env.local.`,
    );
  }
  const baseURL = process.env[cfg.baseUrlEnv]?.trim()
    || process.env.LLM_BASE_URL?.trim()
    || cfg.defaultBaseUrl;
  const model = process.env.LLM_MODEL?.trim() || cfg.defaultModel;

  const cacheKey = `${baseURL}::${apiKey.slice(-6)}`;
  let client = clientCache.get(cacheKey);
  if (!client) {
    client = new OpenAI({ apiKey, baseURL });
    clientCache.set(cacheKey, client);
  }
  return { client, model };
}

export function openaiCompatModel(cfg: OpenAICompatConfig): string {
  return process.env.LLM_MODEL?.trim() || cfg.defaultModel;
}

export async function runOpenAICompat(
  opts: LlmRunOptions,
  cfg: OpenAICompatConfig,
): Promise<LlmRunResult> {
  const { client, model } = getClient(cfg);
  const started = Date.now();
  const inputChars = opts.systemPrompt.length + opts.userPrompt.length;
  const timeoutMs = opts.timeoutMs ?? 180_000;

  try {
    // DeepSeek V4 defaults to thinking mode. Digest/enrichment requests are
    // structured extraction tasks, so thinking spends output budget without
    // improving the JSON. DeepSeek's native JSON mode also prevents the
    // malformed/truncated objects that previously escaped this backend as a
    // successful response and later crashed JSON.parse in pipeline.ts.
    const structuredOutputOptions =
      cfg.backend === "deepseek"
        ? {
            response_format: { type: "json_object" as const },
            thinking: { type: "disabled" as const },
          }
        : {};
    const resp = await client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: opts.systemPrompt },
          { role: "user", content: opts.userPrompt },
        ],
        // Explicit max_tokens — most providers default low (DeepSeek 4096,
        // some MiniMax variants 2048). A 16-item batch enrichment routinely
        // exceeds 4K output tokens once you count Chinese chars + JSON
        // structure, and silent truncation made it through with just 1/16
        // entries parseable. 8192 covers all observed daily batches with
        // generous headroom. Match the explicit value Anthropic SDK uses.
        max_tokens: 8192,
        // JSON/thinking controls are enabled only for the DeepSeek preset;
        // generic OpenAI-compatible providers keep their existing behavior.
        ...structuredOutputOptions,
      },
      { timeout: timeoutMs },
    );
    const choice = resp.choices[0];
    const text = (choice?.message?.content ?? "").trim();
    const durationMs = Date.now() - started;
    const finishReason = choice?.finish_reason ?? null;
    const incompleteReason = !choice
      ? "response contained no choices"
      : !text
        ? "response content was empty"
        : finishReason && finishReason !== "stop"
          ? `finish_reason=${finishReason}`
          : null;

    if (incompleteReason) {
      const error = new LlmIncompleteResponseError(
        `${cfg.backend} returned an incomplete response: ${incompleteReason}`,
      );
      logLlmCall({
        ts: new Date(started).toISOString(),
        backend: cfg.backend,
        model,
        durationMs,
        success: false,
        inputChars,
        outputChars: text.length,
        errorCategory: "other",
        errorSnippet: error.message,
      });
      throw error;
    }

    logLlmCall({
      ts: new Date(started).toISOString(),
      backend: cfg.backend,
      model,
      durationMs,
      success: true,
      inputChars,
      outputChars: text.length,
      errorCategory: null,
      errorSnippet: null,
    });
    return { text, durationMs };
  } catch (err) {
    // Incomplete responses were already logged above with their real partial
    // output length. Avoid writing a second, misleading zero-length record.
    if (err instanceof LlmIncompleteResponseError) throw err;
    const durationMs = Date.now() - started;
    const msg = err instanceof Error ? err.message : String(err);
    logLlmCall({
      ts: new Date(started).toISOString(),
      backend: cfg.backend,
      model,
      durationMs,
      success: false,
      inputChars,
      outputChars: 0,
      errorCategory: classifyError(msg),
      errorSnippet: msg.slice(0, 200),
    });
    throw err;
  }
}
