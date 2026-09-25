"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TarryMark } from "@/components/tarry-mark";

const LINKS = [
  { href: "#come-funziona", label: "Come funziona" },
  { href: "#cosa-legge", label: "Cosa legge" },
  { href: "#prezzi", label: "Prezzi" },
  { href: "#domande", label: "Domande" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav
          aria-label="Principale"
          className="flex w-full max-w-fit items-center gap-2 rounded-full py-2 pl-4 pr-2 backdrop-blur-xl"
          style={{
            background: "color-mix(in srgb, var(--color-surface) 80%, transparent)",
            border: "1px solid var(--color-border-light)",
            boxShadow: "var(--shadow-raised)",
          }}
        >
          <Link href="/" className="mr-2 flex items-center gap-2 rounded-full" aria-label="Tarry, pagina iniziale">
            <TarryMark size={24} />
            <span className="text-base font-semibold tracking-tight">Tarry</span>
          </Link>

          <ul className="hidden items-center md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="btn-ghost">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-1 md:ml-4">
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">
              Accedi
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Prova gratis
            </Link>
            <button
              type="button"
              className="btn-ghost relative h-9 w-9 p-0 md:hidden"
              aria-label={open ? "Chiudi il menu" : "Apri il menu"}
              aria-expanded={open}
              aria-controls="menu-mobile"
              onClick={() => setOpen((o) => !o)}
            >
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-current transition-[translate,rotate] duration-300 motion-reduce:transition-none"
                style={{
                  transitionTimingFunction: "var(--ease-out-expo)",
                  translate: open ? "-50% -50%" : "-50% calc(-50% - 3px)",
                  rotate: open ? "45deg" : "0deg",
                }}
              />
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-current transition-[translate,rotate] duration-300 motion-reduce:transition-none"
                style={{
                  transitionTimingFunction: "var(--ease-out-expo)",
                  translate: open ? "-50% -50%" : "-50% calc(-50% + 3px)",
                  rotate: open ? "-45deg" : "0deg",
                }}
              />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="menu-mobile"
        className="fixed inset-0 z-40 flex flex-col justify-center px-6 backdrop-blur-3xl transition-opacity duration-500 motion-reduce:transition-none md:hidden"
        style={{
          background: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
          transitionTimingFunction: "var(--ease-out-expo)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        aria-hidden={!open}
        inert={!open}
      >
        <ul className="space-y-2">
          {[...LINKS, { href: "/login", label: "Accedi" }].map((l, i) => (
            <li key={l.href} className="overflow-hidden">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-3xl font-semibold tracking-tight transition-[translate,opacity] duration-700 motion-reduce:transition-none"
                style={{
                  transitionTimingFunction: "var(--ease-out-expo)",
                  transitionDelay: open ? `${100 + i * 50}ms` : "0ms",
                  translate: open ? "0 0" : "0 48px",
                  opacity: open ? 1 : 0,
                }}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
