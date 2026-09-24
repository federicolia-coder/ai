"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tarry-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tarry-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="btn-ghost w-full justify-start text-xs gap-2"
      title={dark ? "Modalita chiara" : "Modalita scura"}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-violet)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 10a7 7 0 01-8-8 7 7 0 108 8z" />
        </svg>
      )}
      {dark ? "Chiaro" : "Scuro"}
    </button>
  );
}
