"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="inline-block relative mb-4" style={{ animation: "wiggle 2s ease-in-out infinite" }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="22" fill="var(--color-rose)" opacity="0.1" />
            <circle cx="28" cy="28" r="15" fill="var(--color-rose)" opacity="0.12" />
            {/* Face */}
            <circle cx="28" cy="28" r="10" fill="var(--color-rose)" opacity="0.2" />
            {/* Dizzy eyes */}
            <g style={{ transformOrigin: "24px 26px", animation: "blink 3s ease-in-out infinite" }}>
              <path d="M22 24l4 4M26 24l-4 4" stroke="var(--color-rose)" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            <g style={{ transformOrigin: "32px 26px", animation: "blink 3s ease-in-out infinite 0.5s" }}>
              <path d="M30 24l4 4M34 24l-4 4" stroke="var(--color-rose)" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            {/* Worried mouth */}
            <path d="M24 34c2 -1.5 6 -1.5 8 0" stroke="var(--color-rose)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {/* Sparkles */}
          <svg width="6" height="6" viewBox="0 0 6 6" className="absolute -right-1 top-1" style={{ animation: "sparkle 2s ease-in-out infinite" }}>
            <path d="M3 0L3.8 2.2L6 3L3.8 3.8L3 6L2.2 3.8L0 3L2.2 2.2Z" fill="var(--color-amber)" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Qualcosa e andato storto</h2>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {error.message || "Errore imprevisto. Riprova."}
        </p>
        <button onClick={reset} className="btn-primary text-sm">
          Riprova
        </button>
      </div>
    </div>
  );
}
