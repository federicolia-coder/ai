"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatStore } from "@/lib/store";

function CopyButton({ text }: { text: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 rounded px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
      style={{
        background: "var(--color-bg-secondary)",
        color: "var(--color-text-secondary)",
      }}
      title="Copia"
    >
      &#128203;
    </button>
  );
}

export function ChatMessages() {
  const { messages, isGenerating } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

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
            <div key={m.id} className="group relative flex gap-3">
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
                {m.role === "assistant" ? (
                  <div className="prose-tarry text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                    <CopyButton text={m.content} />
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>
                )}
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
              <div className="flex gap-1">
                <span
                  className="h-2 w-2 rounded-full animate-bounce"
                  style={{
                    background: "var(--color-text-tertiary)",
                    animationDelay: "0ms",
                  }}
                />
                <span
                  className="h-2 w-2 rounded-full animate-bounce"
                  style={{
                    background: "var(--color-text-tertiary)",
                    animationDelay: "150ms",
                  }}
                />
                <span
                  className="h-2 w-2 rounded-full animate-bounce"
                  style={{
                    background: "var(--color-text-tertiary)",
                    animationDelay: "300ms",
                  }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
