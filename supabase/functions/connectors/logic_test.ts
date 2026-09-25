import { assert, assertEquals } from "jsr:@std/assert@1";
import { checkPublicHttpsUrl, hmacSha256Hex, isPrivateHostname, testCredentials, validateConfig } from "./logic.ts";

const GITHUB = [{ name: "token", type: "password" as const, label: "Token", required: true }];
const WEBHOOK = [
  { name: "url", type: "url" as const, label: "URL", required: true },
  { name: "secret", type: "password" as const, label: "Secret", required: false },
];

Deno.test("validateConfig trims and keeps required fields", () => {
  assertEquals(validateConfig(GITHUB, { token: "  ghp_x  " }), { ok: true, config: { token: "ghp_x" } });
});

Deno.test("validateConfig rejects missing, wrong type, unknown and oversized values", () => {
  assertEquals(validateConfig(GITHUB, {}).ok, false);
  assertEquals(validateConfig(GITHUB, { token: "   " }).ok, false);
  assertEquals(validateConfig(GITHUB, { token: 42 }).ok, false);
  assertEquals(validateConfig(GITHUB, { token: "a", extra: "b" }).ok, false);
  assertEquals(validateConfig(GITHUB, { token: "x".repeat(501) }).ok, false);
  assertEquals(validateConfig(GITHUB, null).ok, false);
  assertEquals(validateConfig(GITHUB, ["a"]).ok, false);
});

Deno.test("validateConfig drops empty optional fields", () => {
  assertEquals(validateConfig(WEBHOOK, { url: "https://hooks.example.com/a", secret: "" }), {
    ok: true,
    config: { url: "https://hooks.example.com/a" },
  });
});

Deno.test("validateConfig checks url fields", () => {
  assertEquals(validateConfig(WEBHOOK, { url: "http://hooks.example.com" }).ok, false);
  assertEquals(validateConfig(WEBHOOK, { url: "https://127.0.0.1/x" }).ok, false);
});

Deno.test("checkPublicHttpsUrl", () => {
  assertEquals(checkPublicHttpsUrl("https://hooks.slack.com/services/x"), null);
  assert(checkPublicHttpsUrl("not a url"));
  assert(checkPublicHttpsUrl("https://user:pw@example.com"));
  assert(checkPublicHttpsUrl("ftp://example.com"));
});

Deno.test("isPrivateHostname", () => {
  for (const h of ["localhost", "a.localhost", "printer.local", "db.internal", "10.0.0.1", "172.16.5.4", "192.168.1.1", "127.0.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "[::1]", "fd00::1", "fe80::1"]) {
    assert(isPrivateHostname(h), h);
  }
  for (const h of ["example.com", "8.8.8.8", "172.32.0.1", "[2606:4700::1111]"]) {
    assert(!isPrivateHostname(h), h);
  }
});

Deno.test("hmacSha256Hex matches known vector", async () => {
  // RFC 4231 test case 2
  assertEquals(
    await hmacSha256Hex("Jefe", "what do ya want for nothing?"),
    "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
  );
});

function fakeFetch(status: number, body: unknown = {}, capture?: { req?: Request }) {
  return ((input: string | URL | Request, init?: RequestInit) => {
    if (capture) capture.req = new Request(input, init);
    const nullBody = status === 204 || status === 304;
    return Promise.resolve(new Response(nullBody ? null : JSON.stringify(body), { status }));
  }) as typeof fetch;
}

Deno.test("testCredentials github ok returns login", async () => {
  const cap: { req?: Request } = {};
  const r = await testCredentials("github", { token: "ghp_x" }, fakeFetch(200, { login: "fede" }, cap));
  assertEquals(r, { ok: true, account: "fede" });
  assertEquals(cap.req?.headers.get("Authorization"), "Bearer ghp_x");
});

Deno.test("testCredentials github 401 is a clear error", async () => {
  const r = await testCredentials("github", { token: "bad" }, fakeFetch(401));
  assertEquals(r.ok, false);
  if (!r.ok) assert(r.error.includes("token"));
});

Deno.test("testCredentials notion uses version header", async () => {
  const cap: { req?: Request } = {};
  const r = await testCredentials("notion", { api_key: "secret_x" }, fakeFetch(200, { bot: { workspace_name: "Testard" } }, cap));
  assertEquals(r, { ok: true, account: "Testard" });
  assertEquals(cap.req?.headers.get("Notion-Version"), "2022-06-28");
});

Deno.test("testCredentials webhook signs the ping and requires 2xx", async () => {
  const cap: { req?: Request } = {};
  const ok = await testCredentials("webhook", { url: "https://hooks.example.com/a", secret: "s" }, fakeFetch(204, null, cap));
  assertEquals(ok, { ok: true, account: "hooks.example.com" });
  const body = await cap.req!.text();
  assertEquals(cap.req!.headers.get("X-Tarry-Signature"), "sha256=" + (await hmacSha256Hex("s", body)));
  assertEquals((await testCredentials("webhook", { url: "https://hooks.example.com/a" }, fakeFetch(500))).ok, false);
  assertEquals((await testCredentials("webhook", { url: "https://hooks.example.com/a" }, fakeFetch(302))).ok, false);
});

Deno.test("testCredentials network failure", async () => {
  const failing = (() => Promise.reject(new TypeError("dns"))) as typeof fetch;
  const r = await testCredentials("github", { token: "x" }, failing);
  assertEquals(r.ok, false);
});

Deno.test("testCredentials unknown slug", async () => {
  assertEquals((await testCredentials("google_drive", {}, fakeFetch(200))).ok, false);
});
