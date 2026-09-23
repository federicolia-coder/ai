"use client";

import { useChatStore } from "@/lib/store";

export function ChatMessages() {
  const { messages, isGenerating } = useChatStore();

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Tarry</h2>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Come posso aiutarti?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {messages
          .filter((m) => m.role !== "system")
          .map((m) => (
            <div key={m.id} className="flex gap-3">
              <div
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                style={{
                  background:
                    m.role === "user"
                      ? "var(--color-accent)"
                      : "var(--color-bg-tertiary)",
                  color:
                    m.role === "user" ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {m.role === "user" ? "U" : m.role === "tool" ? "T" : "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {m.role === "user"
                    ? "Tu"
                    : m.role === "tool"
                    ? "Tool"
                    : "Tarry"}
                </p>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            </div>
          ))}

        {isGenerating && (
          <div className="flex gap-3">
            <div
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium"
              style={{
                background: "var(--color-bg-tertiary)",
                color: "var(--color-text-secondary)",
              }}
            >
              A
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-medium mb-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Tarry
              </p>
              <div
                className="text-sm animate-pulse"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
