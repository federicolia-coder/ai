"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamic from "next/dynamic";
import {
  Calculator,
  CaretDown,
  Check,
  Copy,
  FileText,
  GithubLogo,
  Globe,
  MagnifyingGlass,
  NotionLogo,
  WarningCircle,
  WebhooksLogo,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { useChatStore } from "@/lib/store";
import { TarryMark } from "@/components/tarry-mark";
import { hasMath, normalizeMath } from "@/lib/math-markdown";

const MathMarkdown = dynamic(() => import("@/components/math-markdown"), {
  loading: () => null,
});

function MessageMarkdown({ content }: { content: string }) {
  const text = normalizeMath(content);
  if (hasMath(text)) return <MathMarkdown>{text}</MathMarkdown>;
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>;
}

interface ToolStep {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  status: "ok" | "error";
}

// Keys are the runtime's tool names.
const TOOLS: Record<string, { label: string; icon: React.ElementType }> = {
  search: { label: "Ricerca web", icon: MagnifyingGlass },
  calculate: { label: "Calcolo", icon: Calculator },
  read_file: { label: "Lettura file", icon: FileText },
  search_files: { label: "Ricerca nei file", icon: FileText },
  request: { label: "Richiesta HTTP", icon: Globe },
  github_repos: { label: "GitHub", icon: GithubLogo },
  github_issues: { label: "GitHub", icon: GithubLogo },
  github_file: { label: "GitHub", icon: GithubLogo },
  notion_search: { label: "Notion", icon: NotionLogo },
  notion_page: { label: "Notion", icon: NotionLogo },
  webhook_send: { label: "Webhook", icon: WebhooksLogo },
};

function StepCard({ step }: { step: ToolStep }) {
  const [open, setOpen] = useState(false);
  const tool = TOOLS[step.tool] ?? { label: step.tool.replace(/_/g, " "), icon: Globe };
  const Icon = tool.icon;
  const first = Object.values(step.args ?? {})[0];
  const summary = first === undefined ? "" : String(first);
  const failed = step.status === "error";

  return (
    <div className="rounded-lg text-xs" style={{ border: "1px solid var(--color-border-light)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2 text-left"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <Icon size={16} aria-hidden="true" style={{ color: "var(--color-text)" }} />
        <span className="font-semibold" style={{ color: "var(--color-text)" }}>
          {tool.label}
        </span>
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        {failed ? (
          <WarningCircle size={16} weight="fill" aria-label="non riuscito" style={{ color: "var(--color-rose)" }} />
        ) : (
          <Check size={16} weight="bold" aria-label="completato" style={{ color: "var(--color-teal)" }} />
        )}
        <CaretDown
          size={14}
          aria-hidden="true"
          className="shrink-0 transition-[rotate] duration-150"
          style={{ rotate: open ? "180deg" : "0deg" }}
        />
      </button>
      {open && (
        <pre
          className="max-h-52 overflow-y-auto whitespace-pre-wrap break-all px-3 py-2 font-mono text-xs"
          style={{ borderTop: "1px solid var(--color-border-light)", color: "var(--color-text-secondary)" }}
        >
          {step.result}
        </pre>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn-ghost mt-2 h-8 gap-1 rounded-lg px-2 text-xs opacity-100 transition-opacity duration-150 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
      aria-label={copied ? "Risposta copiata" : "Copia la risposta"}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {copied ? "Copiato" : "Copia"}
    </button>
  );
}

function getSteps(metadata: unknown): ToolStep[] {
  if (!metadata || typeof metadata !== "object") return [];
  const m = metadata as Record<string, unknown>;
  if (Array.isArray(m.steps) && m.steps.length > 0) return m.steps as ToolStep[];
  return [];
}

interface AttachmentRef {
  path: string;
  name: string;
}

function getAttachments(metadata: unknown): AttachmentRef[] {
  if (!metadata || typeof metadata !== "object") return [];
  const m = metadata as Record<string, unknown>;
  if (!Array.isArray(m.attachments)) return [];
  const names = Array.isArray(m.attachment_names) ? (m.attachment_names as string[]) : [];
  return (m.attachments as string[]).map((path, i) => ({
    path,
    name: names[i] || path.split("/").pop() || path,
  }));
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp"];

function isImagePath(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTS.includes(ext);
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

function AttachmentDisplay({ items }: { items: AttachmentRef[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const key = items.map((i) => i.path).join("|");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from("attachments")
      .createSignedUrls(items.map((i) => i.path), SIGNED_URL_TTL_SECONDS)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setFailed(true);
          return;
        }
        const map: Record<string, string> = {};
        for (const entry of data) {
          if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
        }
        setUrls(map);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (items.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap justify-end gap-2">
      {items.map((item) => {
        const url = urls[item.path];

        if (isImagePath(item.path) && url) {
          return (
            <a
              key={item.path}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--color-border-light)" }}
            >
              <img
                src={url}
                alt={item.name}
                className="max-w-[240px] max-h-[180px] object-cover"
                loading="lazy"
              />
            </a>
          );
        }
        const label = (
          <>
            <FileText size={14} aria-hidden="true" />
            <span className="max-w-[160px] truncate">{item.name}</span>
            {failed && <span style={{ color: "var(--color-text-tertiary)" }}>(non disponibile)</span>}
          </>
        );
        const style = {
          background: "var(--color-bubble)",
          color: "var(--color-text-secondary)",
        };
        return url ? (
          <a
            key={item.path}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
            style={style}
          >
            {label}
          </a>
        ) : (
          <span key={item.path} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={style}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

const SUGGESTIONS = [
  { icon: MagnifyingGlass, text: "Cosa è successo oggi nel mondo della tecnologia?" },
  { icon: Calculator, text: "Quanto fa il 17,5% di 2.340 €?" },
  { icon: FileText, text: "Riassumi in 5 punti il PDF che ti allego" },
  { icon: GithubLogo, text: "Quali issue sono aperte nel mio repository?" },
];

function EmptyState() {
  const setPendingPrompt = useChatStore((s) => s.setPendingPrompt);
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8">
      <div className="w-full max-w-2xl">
        <TarryMark size={40} />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">Cosa vuoi sapere?</h2>
        <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
          Posso cercare sul web, fare calcoli e leggere i file che alleghi. Prova con una di queste.
        </p>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <button
                type="button"
                onClick={() => setPendingPrompt(text)}
                className="flex h-full w-full items-start gap-3 rounded-2xl p-4 text-left text-sm transition-colors duration-150 hover:bg-[var(--color-bg-secondary)]"
                style={{ border: "1px solid var(--color-border-light)" }}
              >
                <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                {text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex h-7 items-center gap-1.5" role="status" aria-label="Tarry sta scrivendo">
      {[0, 0.2, 0.4].map((d) => (
        <span
          key={d}
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: "var(--color-text-tertiary)",
            animation: `pulse-soft 1.4s ease-in-out infinite ${d}s`,
          }}
        />
      ))}
    </div>
  );
}

const STICK_THRESHOLD_PX = 120;

export function ChatMessages() {
  const { messages, isGenerating, queuePosition } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
  }

  const lastRole = messages[messages.length - 1]?.role;
  useEffect(() => {
    const el = scrollRef.current;
    // Sending a message always jumps to it; while an answer streams, follow it only if the
    // reader is already at the bottom, so scrolling up to read is never interrupted.
    if (lastRole === "user") stickToBottom.current = true;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, isGenerating, lastRole]);

  const last = messages[messages.length - 1];
  const waitingForFirstEvent = isGenerating && last?.role !== "assistant";

  if (messages.length === 0) return <EmptyState />;

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-8">
      <ol className="mx-auto max-w-2xl space-y-8" aria-label="Messaggi" aria-busy={isGenerating}>
        {messages
          .filter((m) => m.role !== "system")
          .map((m) => {
            if (m.role === "user") {
              const attachments = getAttachments(m.metadata);
              return (
                <li key={m.id} className="flex flex-col items-end">
                  <span className="sr-only">Tu:</span>
                  {attachments.length > 0 && <AttachmentDisplay items={attachments} />}
                  <p
                    className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm"
                    style={{ background: "var(--color-bubble)" }}
                  >
                    {m.content}
                  </p>
                </li>
              );
            }
            const steps = getSteps(m.metadata);
            return (
              <li key={m.id} className="group flex gap-3">
                <TarryMark size={28} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="sr-only">Tarry:</span>
                  {steps.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {steps.map((step, i) => (
                        <StepCard key={i} step={step} />
                      ))}
                    </div>
                  )}
                  {m.content ? (
                    <div className="prose-tarry text-sm leading-relaxed">
                      <MessageMarkdown content={m.content} />
                    </div>
                  ) : null}
                  {isGenerating && m.id === last?.id ? (
                    !m.content && <TypingDots />
                  ) : (
                    <CopyButton text={m.content} />
                  )}
                </div>
              </li>
            );
          })}

        {waitingForFirstEvent && (
          <li className="flex gap-3">
            <TarryMark size={28} className="shrink-0" />
            {queuePosition ? (
              <p className="flex h-7 items-center text-sm" role="status" style={{ color: "var(--color-text-secondary)" }}>
                Tarry sta rispondendo ad altre persone. Sei {queuePosition === 1 ? "il prossimo" : `in coda, posizione ${queuePosition}`}.
              </p>
            ) : (
              <TypingDots />
            )}
          </li>
        )}
      </ol>
    </div>
  );
}
