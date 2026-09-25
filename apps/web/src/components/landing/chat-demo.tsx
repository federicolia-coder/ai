"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calculator,
  CheckCircle,
  CircleNotch,
  FileText,
  GithubLogo,
  MagnifyingGlass,
  Paperclip,
} from "@phosphor-icons/react";
import { TarryMark } from "@/components/tarry-mark";

export type DemoTool = "search" | "calculate" | "file" | "github";

export interface DemoStep {
  tool: DemoTool;
  label: string;
  detail: string;
  result: string;
}

export interface DemoScript {
  question: string;
  attachment?: string;
  steps: DemoStep[];
  answer: React.ReactNode;
}

const TOOL_ICON: Record<DemoTool, React.ElementType> = {
  search: MagnifyingGlass,
  calculate: Calculator,
  file: FileText,
  github: GithubLogo,
};

// Stage 0: question only. 1..n: step k running then done. n+1: answer shown.
const STEP_MS = 900;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function Transcript({ script, stage, total }: { script: DemoScript; stage: number; total: number }) {
  const showAnswer = stage >= total;
  return (
    <>
      <div className="flex justify-end">
        <div className="max-w-[85%] space-y-2">
          {script.attachment && (
            <div
              className="ml-auto flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{ background: "var(--color-bubble)", color: "var(--color-text-secondary)" }}
            >
              <Paperclip size={14} />
              {script.attachment}
            </div>
          )}
          <p
            className="rounded-2xl px-4 py-3 text-sm"
            style={{ background: "var(--color-bubble)", color: "var(--color-text)" }}
          >
            {script.question}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <TarryMark size={28} className="shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          {script.steps.map((step, i) => {
            const startAt = i * 2 + 1;
            if (stage < startAt) return null;
            const done = stage > startAt;
            const Icon = TOOL_ICON[step.tool];
            return (
              <div
                key={i}
                className="animate-fade-in flex items-center gap-3 rounded-lg px-3 py-2 text-xs"
                style={{ border: "1px solid var(--color-border-light)", color: "var(--color-text-secondary)" }}
              >
                <Icon size={16} style={{ color: "var(--color-text)" }} />
                <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                  {step.label}
                </span>
                <span className="min-w-0 flex-1 truncate">{done ? step.result : step.detail}</span>
                {done ? (
                  <CheckCircle size={16} weight="fill" style={{ color: "var(--color-teal)" }} />
                ) : (
                  <CircleNotch size={16} className="motion-safe:animate-spin" />
                )}
              </div>
            );
          })}
          {showAnswer && (
            <div className="animate-fade-in pt-2 text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
              {script.answer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function ChatDemo({
  script,
  play = false,
  label,
  className = "",
}: {
  script: DemoScript;
  play?: boolean;
  label: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const total = script.steps.length * 2 + 1;
  // A demo that will play starts collapsed so it never flashes its final state first.
  const [stage, setStage] = useState(play ? 0 : total);
  // A ref, not state: flipping state here would re-run the effect and its cleanup would kill the timer.
  const started = useRef(false);

  useEffect(() => {
    if (reduced) {
      setStage(total);
      return;
    }
    if (!play || started.current) return;
    started.current = true;
    setStage(0);
    let s = 0;
    const id = window.setInterval(() => {
      s += 1;
      setStage(s);
      if (s >= total) window.clearInterval(id);
    }, STEP_MS);
    return () => {
      window.clearInterval(id);
      // If the timer is torn down before finishing (unmount, StrictMode), show the final state.
      if (s < total) {
        started.current = false;
      }
    };
  }, [play, reduced, total]);

  return (
    <figure
      className={`rounded-2xl p-4 sm:p-6 ${className}`}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-light)",
        boxShadow: "var(--shadow-float)",
      }}
    >
      <figcaption className="sr-only">
        {label}. Domanda: {script.question}
        {script.steps.map((s) => ` ${s.label}: ${s.result}.`).join("")} Risposta: {script.answer}
      </figcaption>
      {/* The invisible copy reserves the final height so the page never jumps while steps appear. */}
      <div className="grid" aria-hidden="true">
        <div className="invisible [grid-area:1/1]">
          <Transcript script={script} stage={total} total={total} />
        </div>
        <div className="[grid-area:1/1]">
          <Transcript script={script} stage={stage} total={total} />
        </div>
      </div>
    </figure>
  );
}
