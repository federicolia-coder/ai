"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

// Without this, every color transition on the page fires at once and the theme swap smears.
function withoutTransitions(change: () => void) {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none !important}";
  document.head.appendChild(style);
  change();
  void document.body.offsetHeight;
  requestAnimationFrame(() => style.remove());
}

export function applyTheme(dark: boolean) {
  withoutTransitions(() => document.documentElement.classList.toggle("dark", dark));
  try {
    localStorage.setItem("tarry-theme", dark ? "dark" : "light");
  } catch {}
}

export function useThemeState() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  }
  return { dark, toggle };
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { dark, toggle } = useThemeState();
  const label = dark ? "Passa al tema chiaro" : "Passa al tema scuro";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="btn-ghost h-9 w-9 p-0"
        aria-label={label}
        title={label}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-ghost w-full justify-start rounded-lg text-sm"
      aria-label={label}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      {dark ? "Tema chiaro" : "Tema scuro"}
    </button>
  );
}
