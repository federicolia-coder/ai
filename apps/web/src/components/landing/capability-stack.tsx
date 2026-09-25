"use client";

import { useEffect, useRef, useState } from "react";
import { ChatDemo, type DemoScript } from "./chat-demo";

export interface Capability {
  id: string;
  title: string;
  body: string;
  script: DemoScript;
}

export function CapabilityStack({ items }: { items: Capability[] }) {
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState<Set<number>>(() => new Set());
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          setActive(i);
          setSeen((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
        }
      },
      // A step becomes active when it crosses the middle band of the viewport.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      <ol className="space-y-16 lg:space-y-0">
        {items.map((item, i) => (
          <li
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-index={i}
            className="flex flex-col justify-center lg:min-h-[70svh]"
          >
            <div
              className="transition-opacity duration-500 motion-reduce:transition-none lg:data-[dim=true]:opacity-40"
              style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
              data-dim={active !== i}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--color-accent-text)" }}>
                {String(i + 1)} di {items.length}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{item.title}</h3>
              <p className="mt-4 max-w-md text-base" style={{ color: "var(--color-text-secondary)" }}>
                {item.body}
              </p>
            </div>
            <ChatDemo script={item.script} label={item.title} className="mt-8 lg:hidden" />
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-0 grid h-svh content-center">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="[grid-area:1/1] transition-[opacity,translate] duration-500 motion-reduce:transition-none"
              style={{
                transitionTimingFunction: "var(--ease-out-expo)",
                opacity: active === i ? 1 : 0,
                translate: active === i ? "0 0" : "0 16px",
                pointerEvents: active === i ? "auto" : "none",
              }}
              aria-hidden={active !== i}
            >
              <ChatDemo script={item.script} label={item.title} play={seen.has(i)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
