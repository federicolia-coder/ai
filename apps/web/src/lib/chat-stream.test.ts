import { describe, expect, it } from "vitest";
import { applyEvent, createSseParser, emptyDraft, errorMessage, type StreamEvent } from "./chat-stream";

describe("createSseParser", () => {
  it("parses events split across chunks and skips heartbeats", () => {
    const p = createSseParser();
    const events = [
      ...p.feed(': ping\n\ndata: {"type":"tok'),
      ...p.feed('en","text":"Ciao"}\n'),
      ...p.feed('\ndata: {"type":"discard"}\n\n'),
      ...p.end(),
    ];
    expect(events).toEqual([{ type: "token", text: "Ciao" }, { type: "discard" }]);
  });

  it("flushes a final event without a trailing blank line", () => {
    const p = createSseParser();
    expect(p.feed('data: {"type":"done","result":{"content":"ok"}}')).toEqual([]);
    expect(p.end()).toEqual([{ type: "done", result: { content: "ok" } }]);
  });

  it("ignores malformed lines", () => {
    const p = createSseParser();
    expect(p.feed("data: not json\n\ndata: {}\n\n")).toEqual([]);
  });
});

describe("applyEvent", () => {
  const run = (events: StreamEvent[]) => events.reduce(applyEvent, emptyDraft());

  it("accumulates tokens and steps", () => {
    const s = run([
      { type: "step", step: { tool: "calculate", args: {}, result: "{}", status: "ok" } },
      { type: "token", text: "Fa " },
      { type: "token", text: "409,50 €." },
    ]);
    expect(s.content).toBe("Fa 409,50 €.");
    expect(s.steps).toHaveLength(1);
  });

  it("discard clears the draft but keeps steps", () => {
    const s = run([
      { type: "token", text: "Voglio calcolare" },
      { type: "discard" },
      { type: "step", step: { tool: "calculate", args: {}, result: "{}", status: "ok" } },
    ]);
    expect(s.content).toBe("");
    expect(s.steps).toHaveLength(1);
  });

  it("done overrides streamed text", () => {
    const s = run([{ type: "token", text: "bozza" }, { type: "done", result: { content: "Finale", steps: [] } }]);
    expect(s.content).toBe("Finale");
    expect(s.done).not.toBeNull();
  });
});

describe("errorMessage", () => {
  it("maps known server errors to Italian", () => {
    expect(errorMessage("Token limit reached")).toMatch(/token/);
    expect(errorMessage("timeout")).toMatch(/troppo tempo/);
  });

  it("falls back to a generic message", () => {
    expect(errorMessage("weird")).toBe("Qualcosa è andato storto. Riprova tra poco.");
    expect(errorMessage(undefined)).toBe("Qualcosa è andato storto. Riprova tra poco.");
  });
});
