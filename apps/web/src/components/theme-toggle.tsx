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
      className="btn-ghost w-full justify-start text-xs"
      title={dark ? "Modalità chiara" : "Modalità scura"}
    >
      {dark ? "☀ Chiaro" : "☾ Scuro"}
    </button>
  );
}
