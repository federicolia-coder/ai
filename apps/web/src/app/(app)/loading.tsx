export default function AppLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-8" aria-busy="true" aria-label="Caricamento">
      <div className="mx-auto w-full max-w-2xl space-y-4">
        {[72, 48, 64].map((w, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded-lg motion-safe:animate-pulse" style={{ background: "var(--color-bg-tertiary)" }} />
            <div
              className="h-16 rounded-2xl motion-safe:animate-pulse"
              style={{ background: "var(--color-bg-secondary)", width: `${w}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
