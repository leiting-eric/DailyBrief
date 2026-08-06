import assert from "node:assert/strict";
import test from "node:test";
import {
  hasProxyEnvironment,
  parseScutilProxy,
  prepareProxyEnvironment,
} from "./proxy-env.mjs";

const MAC_PROXY = `
<dictionary> {
  HTTPEnable : 1
  HTTPPort : 9567
  HTTPProxy : 127.0.0.1
  HTTPSEnable : 1
  HTTPSPort : 9567
  HTTPSProxy : 127.0.0.1
}
`;

test("parseScutilProxy extracts active proxy fields", () => {
  const parsed = parseScutilProxy(MAC_PROXY);
  assert.equal(parsed.HTTPSEnable, "1");
  assert.equal(parsed.HTTPSProxy, "127.0.0.1");
  assert.equal(parsed.HTTPSPort, "9567");
});

test("prepareProxyEnvironment imports the macOS system proxy", () => {
  const result = prepareProxyEnvironment({}, "darwin", () => MAC_PROXY);
  assert.equal(result.source, "macos-system");
  assert.equal(result.env.HTTPS_PROXY, "http://127.0.0.1:9567");
  assert.equal(result.env.HTTP_PROXY, "http://127.0.0.1:9567");
});

test("explicit proxy environment takes precedence", () => {
  const result = prepareProxyEnvironment(
    { HTTPS_PROXY: "http://proxy.example:8080" },
    "darwin",
    () => {
      throw new Error("scutil should not be called");
    },
  );
  assert.equal(result.source, "environment");
  assert.equal(result.env.HTTPS_PROXY, "http://proxy.example:8080");
  assert.equal(hasProxyEnvironment(result.env), true);
});

test("disabled macOS proxy leaves the environment unchanged", () => {
  const result = prepareProxyEnvironment(
    {},
    "darwin",
    () => "HTTPEnable : 0\nHTTPSEnable : 0\n",
  );
  assert.equal(result.source, null);
  assert.equal(hasProxyEnvironment(result.env), false);
});
