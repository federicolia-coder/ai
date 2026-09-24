export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center" style={{ animation: "fade-in 0.3s ease" }}>
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: "var(--color-accent)", animation: "pulse-soft 1.2s ease-in-out infinite" }}
        />
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: "var(--color-violet)", animation: "pulse-soft 1.2s ease-in-out infinite 0.15s" }}
        />
        <span
          className="inline-block h-2 w-2 rounded-sm"
          style={{ background: "var(--color-teal)", animation: "pulse-soft 1.2s ease-in-out infinite 0.3s" }}
        />
      </div>
    </div>
  );
}
