import { assertEquals } from "jsr:@std/assert@1";
import { buildHistory, MAX_TOTAL_BYTES, resolveConnectors, resolvePluginTools, selectAttachments } from "./logic.ts";

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
