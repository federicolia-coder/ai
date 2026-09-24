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
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4">
          <circle cx="24" cy="24" r="20" fill="var(--color-rose)" opacity="0.1" />
          <circle cx="24" cy="24" r="12" fill="var(--color-rose)" opacity="0.15" />
          <path d="M18 18l12 12M30 18l-12 12" stroke="var(--color-rose)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
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
