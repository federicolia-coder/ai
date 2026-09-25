"use client";

import { useEffect, useRef, useState } from "react";

/** Adds .is-visible to every .reveal element once it enters the viewport. One observer for the page. */
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/** Tagline whose words brighten one by one, in reading order, as each crosses a line 40% up the viewport. */
export function TaglineReveal({ lines }: { lines: string[] }) {
  const words = lines.flatMap((line, li) =>
    line.split(" ").map((w, wi, arr) => ({ w, breakAfter: wi === arr.length - 1 && li < lines.length - 1 })),
  );
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [lit, setLit] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLit(words.length);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const trigger = window.innerHeight * 0.6;
      let count = 0;
      for (const el of refs.current) {
        if (el && el.getBoundingClientRect().top < trigger) count++;
        else break;
      }
      setLit(count);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [words.length]);

  return (
    <p className="max-w-[680px] text-4xl font-semibold tracking-tight [text-wrap:balance] sm:text-5xl" aria-label={lines.join(" ")}>
      {words.map((item, i) => (
        <span key={i} aria-hidden="true">
          <span
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="transition-colors duration-500"
            style={{
              transitionTimingFunction: "var(--ease-out-expo)",
              color: i < lit ? "var(--color-text)" : "color-mix(in srgb, var(--color-text) 25%, transparent)",
            }}
          >
            {item.w}
          </span>
          {item.breakAfter ? (
            <>
              <br className="hidden sm:inline" />
              <span className="sm:hidden"> </span>
            </>
          ) : (
            " "
          )}
        </span>
      ))}
    </p>
  );
}
