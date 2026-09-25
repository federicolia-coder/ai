export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-8 pt-16 md:pt-8" aria-busy="true" aria-label="Caricamento">
      <div className="mx-auto max-w-2xl">
        <div className="h-8 w-40 rounded-lg motion-safe:animate-pulse" style={{ background: "var(--color-bg-tertiary)" }} />
        <div className="mt-8 space-y-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="h-24 rounded-2xl motion-safe:animate-pulse" style={{ background: "var(--color-bg-secondary)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
