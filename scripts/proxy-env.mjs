import { spawnSync } from "node:child_process";

const PROXY_ENV_KEYS = [
  "HTTPS_PROXY",
  "https_proxy",
  "HTTP_PROXY",
  "http_proxy",
  "ALL_PROXY",
  "all_proxy",
];

export function hasProxyEnvironment(env) {
  return PROXY_ENV_KEYS.some((key) => Boolean(env[key]?.trim()));
}

export function parseScutilProxy(raw) {
  const values = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z]+)\s*:\s*(.*?)\s*$/.exec(line);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function proxyUrl(host, port) {
  const formattedHost = host.includes(":") && !host.startsWith("[")
    ? `[${host}]`
    : host;
  return `http://${formattedHost}:${port}`;
}

/**
 * Return a child-process environment with explicit proxy variables.
 * Existing environment variables always win. On macOS, CLI programs do not
 * automatically inherit the proxy configured in System Settings, so read the
 * active HTTP(S) proxy from scutil when no explicit environment is present.
 */
export function prepareProxyEnvironment(
  baseEnv = process.env,
  platform = process.platform,
  readMacProxy = () =>
    spawnSync("scutil", ["--proxy"], { encoding: "utf8" }).stdout ?? "",
) {
  const env = { ...baseEnv };
  if (hasProxyEnvironment(env)) {
    return { env, source: "environment", address: null };
  }
  if (platform !== "darwin") {
    return { env, source: null, address: null };
  }

  const proxy = parseScutilProxy(readMacProxy());
  const httpsEnabled = proxy.HTTPSEnable === "1";
  const httpEnabled = proxy.HTTPEnable === "1";
  const host = httpsEnabled
    ? proxy.HTTPSProxy
    : httpEnabled
      ? proxy.HTTPProxy
      : undefined;
  const port = httpsEnabled
    ? proxy.HTTPSPort
    : httpEnabled
      ? proxy.HTTPPort
      : undefined;
  if (!host || !port) {
    return { env, source: null, address: null };
  }

  const address = proxyUrl(host, port);
  env.HTTPS_PROXY = address;
  env.HTTP_PROXY = address;
  return { env, source: "macos-system", address };
}
