#!/usr/bin/env node

import { spawn } from "node:child_process";
import { config } from "dotenv";
import { prepareProxyEnvironment } from "./proxy-env.mjs";

const [entry, ...entryArgs] = process.argv.slice(2);
if (!entry) {
  console.error("Usage: node scripts/run-tsx.mjs <script.ts> [...args]");
  process.exit(2);
}

// The proxy must exist in the child environment before Node starts. Loading
// .env.local only inside scripts/_env.ts is too late for --use-env-proxy.
config({ path: ".env.local", quiet: true });
const proxy = prepareProxyEnvironment(process.env);

if (proxy.source === "macos-system") {
  console.log(`[proxy] using macOS system proxy ${proxy.address}`);
} else if (proxy.source === "environment") {
  console.log("[proxy] using proxy from environment/.env.local");
}

const nodeArgs = [];
if (proxy.source) {
  if (process.allowedNodeEnvironmentFlags.has("--use-env-proxy")) {
    nodeArgs.push("--use-env-proxy");
  } else {
    console.warn(
      "[proxy] this Node version cannot proxy built-in fetch; use Node 24+ or a TUN/VPN network mode",
    );
  }
}
nodeArgs.push("--import", "tsx", entry, ...entryArgs);

const child = spawn(process.execPath, nodeArgs, {
  env: proxy.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`[runner] failed to start ${entry}: ${error.message}`);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[runner] ${entry} stopped by ${signal}`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
