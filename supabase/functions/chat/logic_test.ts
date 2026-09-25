import { assertEquals } from "jsr:@std/assert@1";
import { buildHistory, MAX_TOTAL_BYTES, relaySse, resolveConnectors, resolvePluginTools, selectAttachments } from "./logic.ts";

const plugins = [
  { id: "calc", tools: ["calculate"], enabled_by_default: true },
  { id: "web", tools: ["search"], enabled_by_default: true },
  { id: "files", tools: ["read_file", "search_files"], enabled_by_default: true },
  { id: "http", tools: ["request"], enabled_by_default: false },
];

Deno.test("defaults apply when the user made no choice", () => {
  assertEquals(resolvePluginTools(plugins, []).sort(), ["calculate", "read_file", "search", "search_files"]);
});

Deno.test("explicitly disabling a default plugin removes its tools", () => {
  const tools = resolvePluginTools(plugins, [{ plugin_id: "web", enabled: false }]);
  assertEquals(tools.includes("search"), false);
  assertEquals(tools.includes("calculate"), true);
});

Deno.test("explicitly enabling a non-default plugin adds its tools", () => {
  assertEquals(resolvePluginTools(plugins, [{ plugin_id: "http", enabled: true }]).includes("request"), true);
});

Deno.test("everything disabled yields no tools", () => {
  const off = plugins.map((p) => ({ plugin_id: p.id, enabled: false }));
  assertEquals(resolvePluginTools(plugins, off), []);
});

Deno.test("connectors without usable config are ignored", () => {
  const r = resolveConnectors([
    { slug: "github", tools: ["github_repos"], config: { token: "ghp" } },
    { slug: "notion", tools: ["notion_search"], config: {} },
    { slug: "webhook", tools: ["webhook_send"], config: { url: "", secret: 5 as unknown as string } },
  ]);
  assertEquals(r.tools, ["github_repos"]);
  assertEquals(r.credentials, { github: { token: "ghp" } });
});

Deno.test("history is chronological, recent, and excludes the current message", () => {
  const newestFirst = [
    { role: "user", content: "domanda nuova" },
    { role: "assistant", content: "r2" },
    { role: "user", content: "d2" },
    { role: "assistant", content: "r1" },
    { role: "user", content: "d1" },
  ];
  assertEquals(buildHistory(newestFirst, "domanda nuova", 3), [
    { role: "assistant", content: "r1" },
    { role: "user", content: "d2" },
    { role: "assistant", content: "r2" },
  ]);
});

Deno.test("history keeps an older identical question and drops non-chat roles", () => {
  const newestFirst = [
    { role: "assistant", content: "r" },
    { role: "tool", content: "x" },
    { role: "user", content: "ciao" },
  ];
  assertEquals(buildHistory(newestFirst, "ciao", 10), [
    { role: "user", content: "ciao" },
    { role: "assistant", content: "r" },
  ]);
});

Deno.test("attachments: images metadata only, size budget, max count, foreign paths ignored", () => {
  const u = "user-1";
  const rows = [
    { file_name: "a.png", file_type: "image/png", file_size: 9_000_000, storage_path: `${u}/c/a.png` },
    { file_name: "big.pdf", file_type: "application/pdf", file_size: MAX_TOTAL_BYTES - 10, storage_path: `${u}/c/big.pdf` },
    { file_name: "b.pdf", file_type: "application/pdf", file_size: 100, storage_path: `${u}/c/b.pdf` },
    { file_name: "evil.txt", file_type: "text/plain", file_size: 1, storage_path: `other/c/evil.txt` },
    { file_name: "c.txt", file_type: "text/plain", file_size: 1, storage_path: `${u}/c/c.txt` },
    { file_name: "d.txt", file_type: "text/plain", file_size: 1, storage_path: `${u}/c/d.txt` },
    { file_name: "e.txt", file_type: "text/plain", file_size: 1, storage_path: `${u}/c/e.txt` },
  ];
  const r = selectAttachments(rows, u);
  assertEquals(r.metadataOnly.map((x) => x.file_name), ["a.png"]);
  assertEquals(r.download.map((x) => x.file_name), ["big.pdf", "c.txt", "d.txt", "e.txt"]);
  assertEquals(r.skipped.map((x) => x.file_name), ["b.pdf"]);
});

Deno.test("history stops at the character budget, keeping the newest messages", () => {
  const newestFirst = [
    { role: "assistant", content: "b".repeat(40) },
    { role: "user", content: "a".repeat(40) },
    { role: "assistant", content: "old".repeat(100) },
  ];
  assertEquals(buildHistory(newestFirst, "nuova", 10, 100), [
    { role: "user", content: "a".repeat(40) },
    { role: "assistant", content: "b".repeat(40) },
  ]);
});

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
}

Deno.test("relaySse forwards bytes untouched and finds the done event across chunk boundaries", async () => {
  const done = { type: "done", result: { content: "Fa 409,50 €.", input_tokens: 5 } };
  const full = `: ping\n\ndata: {"type":"token","text":"Fa"}\n\ndata: ${JSON.stringify(done)}\n\n`;
  // Split in awkward places: inside the JSON and inside a multi-byte character.
  const bytes = new TextEncoder().encode(full);
  const cut1 = 20, cut2 = bytes.length - 12;
  const parts = [bytes.slice(0, cut1), bytes.slice(cut1, cut2), bytes.slice(cut2)];
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      parts.forEach((p) => c.enqueue(p));
      c.close();
    },
  });
  const forwarded: Uint8Array[] = [];
  const outcome = await relaySse(stream, async (chunk) => {
    forwarded.push(chunk);
  });
  assertEquals(outcome, { result: done.result, failed: false });
  const joined = new Uint8Array(forwarded.reduce((n, c) => n + c.length, 0));
  let off = 0;
  for (const c of forwarded) {
    joined.set(c, off);
    off += c.length;
  }
  assertEquals(new TextDecoder().decode(joined), full);
});

Deno.test("relaySse reports runtime errors and missing done", async () => {
  const noop = async () => {};
  assertEquals(await relaySse(streamOf(['data: {"type":"error","error":"timeout"}\n\n']), noop), { result: null, failed: true });
  assertEquals(await relaySse(streamOf(['data: {"type":"token","text":"x"}\n\n']), noop), { result: null, failed: false });
});

Deno.test("relaySse accepts a final event without trailing blank line", async () => {
  const outcome = await relaySse(streamOf(['data: {"type":"done","result":{"content":"ok"}}']), async () => {});
  assertEquals(outcome.result, { content: "ok" });
});
