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
        <h2 className="text-lg font-semibold mb-2">Qualcosa è andato storto</h2>
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
