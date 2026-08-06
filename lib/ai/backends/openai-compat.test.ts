import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { LlmIncompleteResponseError } from "../errors";
import { PRESETS, runOpenAICompat } from "./openai-compat";

test("DeepSeek requests JSON in non-thinking mode and rejects truncation", async () => {
  const requestBodies: Array<Record<string, unknown>> = [];
  let requestCount = 0;
  const server = http.createServer((req, res) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      requestBodies.push(JSON.parse(body) as Record<string, unknown>);
      requestCount += 1;
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: `test-${requestCount}`,
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: "deepseek-v4-flash",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content:
                  requestCount === 1 ? '{"ok":true}' : '{"ok":',
              },
              finish_reason: requestCount === 1 ? "stop" : "length",
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 10,
            total_tokens: 20,
          },
        }),
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");

  const previousApiKey = process.env.DEEPSEEK_API_KEY;
  const previousCwd = process.cwd();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "daily-brief-test-"));
  process.env.DEEPSEEK_API_KEY = "test-key-openai-compat";
  process.chdir(tempDir);

  const cfg = {
    ...PRESETS.deepseek,
    defaultBaseUrl: `http://127.0.0.1:${address.port}/v1`,
  };
  const options = {
    systemPrompt: "Return JSON.",
    userPrompt: "Return an object.",
  };

  try {
    const result = await runOpenAICompat(options, cfg);
    assert.equal(result.text, '{"ok":true}');

    await assert.rejects(
      runOpenAICompat(options, cfg),
      LlmIncompleteResponseError,
    );

    assert.equal(requestBodies.length, 2);
    for (const body of requestBodies) {
      assert.deepEqual(body.response_format, { type: "json_object" });
      assert.deepEqual(body.thinking, { type: "disabled" });
      assert.equal(body.max_tokens, 8192);
    }
  } finally {
    process.chdir(previousCwd);
    if (previousApiKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousApiKey;
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
