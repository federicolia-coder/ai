"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChatStore } from "@/lib/store";

interface ToolStep {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  status: "ok" | "error";
}

const TOOL_LABELS: Record<string, string> = {
  web_search: "Ricerca web",
  calculator: "Calcolo",
  file_read: "Lettura file",
  url_fetch: "Lettura URL",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] || name.replace(/_/g, " ");
}

function ToolIcon({ tool }: { tool: string }) {
  const common = { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (tool === "web_search") {
    return (
      <svg {...common}>
        <circle cx="6" cy="6" r="4" />
        <path d="M9 9l3 3" />
      </svg>
    );
  }
  if (tool === "calculator") {
    return (
      <svg {...common}>
        <rect x="2" y="1" width="10" height="12" rx="1.5" />
        <path d="M5 5h4M7 3v4" />
        <circle cx="5" cy="9.5" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="7" cy="9.5" r="0.5" fill="currentColor" stroke="none" />
        <circle cx="9" cy="9.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (tool === "file_read") {
    return (
      <svg {...common}>
        <path d="M4 1h4l4 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
        <path d="M8 1v4h4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M8 2L6 5h3L7 12" />
    </svg>
  );
}

function StepCard({ step }: { step: ToolStep }) {
  const [open, setOpen] = useState(false);

  let argSummary = "";
  const vals = Object.values(step.args);
  if (vals.length > 0) {
    const first = String(vals[0]);
    argSummary = first.length > 60 ? first.slice(0, 57) + "..." : first;
  }

  return (
    <div
      className="rounded-lg text-xs"
      style={{
        background: "var(--color-bg-secondary)",
        border: "1px solid var(--color-border-light)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
          style={{
            background: step.status === "ok" ? "var(--color-teal-soft)" : "var(--color-rose-soft)",
            color: step.status === "ok" ? "var(--color-teal)" : "var(--color-rose)",
          }}
        >
          <ToolIcon tool={step.tool} />
        </span>
        <span className="font-medium" style={{ color: "var(--color-text)" }}>
          {toolLabel(step.tool)}
        </span>
        {argSummary && (
          <span className="truncate" style={{ color: "var(--color-text-tertiary)" }}>
            {argSummary}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="ml-auto shrink-0 transition-transform"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--color-text-tertiary)",
          }}
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div
          className="border-t px-3 py-2 font-mono whitespace-pre-wrap break-all"
          style={{
            borderColor: "var(--color-border-light)",
            color: "var(--color-text-tertiary)",
            fontSize: "11px",
            lineHeight: "1.5",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {step.result}
        </div>
      )}
    </div>
  );
}

function ToolSteps({ steps }: { steps: ToolStep[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-2">
      {steps.map((step, i) => (
        <StepCard key={i} step={step} />
      ))}
    </div>
  );
}

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
        style={{ background: "var(--color-bg-tertiary)", color: "var(--color-text-secondary)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="5" r="2.5" />
          <path d="M3 12.5c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
      style={{ background: "var(--color-accent-soft)" }}
    >
      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="14" fill="var(--color-accent)" />
        <circle cx="11" cy="14" r="2.5" fill="white" />
        <circle cx="21" cy="14" r="2.5" fill="var(--color-violet)" />
        <path d="M11 21c2.5 3 7.5 3 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function getSteps(metadata: unknown): ToolStep[] {
  if (!metadata || typeof metadata !== "object") return [];
  const m = metadata as Record<string, unknown>;
  if (Array.isArray(m.steps) && m.steps.length > 0) return m.steps as ToolStep[];
  return [];
}

function getAttachments(metadata: unknown): string[] {
  if (!metadata || typeof metadata !== "object") return [];
  const m = metadata as Record<string, unknown>;
  if (Array.isArray(m.attachments)) return m.attachments as string[];
  return [];
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

function isImagePath(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTS.includes(ext);
}

function getPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${base}/storage/v1/object/public/attachments/${path}`;
}

function AttachmentDisplay({ paths }: { paths: string[] }) {
  if (paths.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {paths.map((path, i) => {
        const fileName = path.split("/").pop() || path;
        const url = getPublicUrl(path);

        if (isImagePath(path)) {
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--color-border-light)" }}
            >
              <img
                src={url}
                alt={fileName}
                className="max-w-[240px] max-h-[180px] object-cover"
                loading="lazy"
              />
            </a>
          );
        }
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-light)",
              color: "var(--color-text-secondary)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 1h4l4 4v7a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
              <path d="M8 1v4h4" />
            </svg>
            <span className="max-w-[160px] truncate">{fileName}</span>
          </a>
        );
      })}
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
          <div className="mx-auto mb-4">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" className="mx-auto">
              <circle cx="16" cy="16" r="14" fill="var(--color-accent)" />
              <circle cx="11" cy="14" r="2.5" fill="white" />
              <circle cx="11.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
              <circle cx="21" cy="14" r="2.5" fill="var(--color-violet)" />
              <circle cx="21.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
              <path d="M11 21c2.5 3 7.5 3 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
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
          .map((m) => {
            const steps = m.role === "assistant" ? getSteps(m.metadata) : [];
            const attachments = m.role === "user" ? getAttachments(m.metadata) : [];
            return (
              <div key={m.id} className="group relative flex gap-3">
                <Avatar role={m.role} />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {m.role === "user" ? "Tu" : "Tarry"}
                  </p>
                  {m.role === "user" && attachments.length > 0 && (
                    <AttachmentDisplay paths={attachments} />
                  )}
                  {m.role === "assistant" && steps.length > 0 && (
                    <ToolSteps steps={steps} />
                  )}
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
            );
          })}

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
              <div className="flex items-center gap-1.5 h-5">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "var(--color-text-tertiary)",
                    animation: "pulse-soft 1.4s ease-in-out infinite",
                  }}
                />
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "var(--color-text-tertiary)",
                    animation: "pulse-soft 1.4s ease-in-out infinite 0.2s",
                  }}
                />
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "var(--color-text-tertiary)",
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
