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
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
        <path d="M9.5 4.5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5.5a1 1 0 001 1h1.5" />
      </svg>
    </button>
  );
}

function Avatar({ role }: { role: string }) {
  if (role === "user") {
    return (
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-medium"
        style={{ background: "var(--color-violet-soft)", color: "var(--color-violet)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="5" r="2.5" />
          <path d="M3 12.5c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (role === "tool") {
    return (
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-medium"
        style={{ background: "var(--color-amber-soft)", color: "var(--color-amber)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8 2L6 5h3L7 12" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-medium"
      style={{ background: "var(--color-accent-soft)", color: "var(--color-accent-text)" }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="5" cy="6" r="1" fill="currentColor" />
        <circle cx="9" cy="6" r="1" fill="currentColor" />
        <path d="M5 9.5c1 1 3 1 4 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
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
          <div className="relative inline-block mx-auto mb-4" style={{ animation: "bounce-gentle 3s ease-in-out infinite" }}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="26" fill="var(--color-accent)" opacity="0.1" />
              <circle cx="32" cy="32" r="18" fill="var(--color-accent)" opacity="0.15" />
              <circle cx="32" cy="32" r="12" fill="var(--color-accent)" />
              {/* Blush cheeks */}
              <circle cx="24" cy="35" r="2.5" fill="var(--color-rose)" opacity="0.25" />
              <circle cx="40" cy="35" r="2.5" fill="var(--color-rose)" opacity="0.25" />
              {/* Eyes with shine */}
              <g style={{ transformOrigin: "27px 30px", animation: "blink 4s ease-in-out infinite" }}>
                <circle cx="27" cy="30" r="2" fill="white" />
                <circle cx="27.5" cy="29.5" r="0.6" fill="white" opacity="0.8" />
              </g>
              <g style={{ transformOrigin: "37px 30px", animation: "blink 4s ease-in-out infinite 0.3s" }}>
                <circle cx="37" cy="30" r="2" fill="var(--color-violet)" />
                <circle cx="37.5" cy="29.5" r="0.6" fill="white" opacity="0.8" />
              </g>
              {/* Big smile */}
              <path d="M27 36c2.5 3 7.5 3 10 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {/* Waving hand */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute -right-1 top-1" style={{ animation: "wave 2s ease-in-out infinite" }}>
              <text x="2" y="13" fontSize="12">👋</text>
            </svg>
            {/* Sparkles */}
            <svg width="8" height="8" viewBox="0 0 8 8" className="absolute -left-2 top-2" style={{ animation: "sparkle 2s ease-in-out infinite" }}>
              <path d="M4 0L5 3L8 4L5 5L4 8L3 5L0 4L3 3Z" fill="var(--color-amber)" />
            </svg>
            <svg width="6" height="6" viewBox="0 0 6 6" className="absolute -right-3 bottom-4" style={{ animation: "sparkle 2s ease-in-out infinite 0.7s" }}>
              <path d="M3 0L3.8 2.2L6 3L3.8 3.8L3 6L2.2 3.8L0 3L2.2 2.2Z" fill="var(--color-teal)" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-1">Ciao!</h2>
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
              <Avatar role={m.role} />
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
            <Avatar role="assistant" />
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-medium mb-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Tarry
              </p>
              <div className="flex items-center gap-1 h-5">
                <span
                  className="inline-block h-1.5 w-6 rounded-sm"
                  style={{
                    background: "var(--color-accent)",
                    animation: "pulse-soft 1.4s ease-in-out infinite",
                  }}
                />
                <span
                  className="inline-block h-1.5 w-4 rounded-sm"
                  style={{
                    background: "var(--color-violet)",
                    animation: "pulse-soft 1.4s ease-in-out infinite 0.2s",
                  }}
                />
                <span
                  className="inline-block h-1.5 w-2 rounded-sm"
                  style={{
                    background: "var(--color-teal)",
                    animation: "pulse-soft 1.4s ease-in-out infinite 0.4s",
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
