import assert from "node:assert/strict";
import test from "node:test";
import { validateClaudeCliAvailable } from "./claude-cli";

test("validateClaudeCliAvailable accepts an executable CLI", () => {
  const previous = process.env.CLAUDE_CLI_PATH;
  process.env.CLAUDE_CLI_PATH = process.execPath;
  try {
    assert.doesNotThrow(() => validateClaudeCliAvailable());
  } finally {
    if (previous === undefined) delete process.env.CLAUDE_CLI_PATH;
    else process.env.CLAUDE_CLI_PATH = previous;
  }
});

test("validateClaudeCliAvailable fails fast with configuration guidance", () => {
  const previous = process.env.CLAUDE_CLI_PATH;
  process.env.CLAUDE_CLI_PATH = "/definitely/missing/claude";
  try {
    assert.throws(
      () => validateClaudeCliAvailable(),
      /LLM_BACKEND=claude-cli.*\.env\.local.*LLM_BACKEND=deepseek/,
    );
  } finally {
    if (previous === undefined) delete process.env.CLAUDE_CLI_PATH;
    else process.env.CLAUDE_CLI_PATH = previous;
  }
});
