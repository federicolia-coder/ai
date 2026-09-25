"use client";

import { useId, useState } from "react";
import { Plus } from "@phosphor-icons/react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <dl className="divide-y" style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const btnId = `${base}-q${i}`;
        const panelId = `${base}-a${i}`;
        return (
          <div key={item.q}>
            <dt>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-semibold"
              >
                {item.q}
                <Plus
                  size={20}
                  aria-hidden="true"
                  className="shrink-0 transition-[rotate] duration-300 motion-reduce:transition-none"
                  style={{ rotate: isOpen ? "45deg" : "0deg", transitionTimingFunction: "var(--ease-ui)" }}
                />
              </button>
            </dt>
            <dd
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className="grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", transitionTimingFunction: "var(--ease-ui)" }}
            >
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-6 text-base" style={{ color: "var(--color-text-secondary)" }}>
                  {item.a}
                </p>
              </div>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
