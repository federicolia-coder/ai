export default function AppLoading() {
  return (
    <div className="flex flex-1 items-center justify-center" style={{ animation: "fade-in 0.3s ease" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ animation: "bounce-gentle 2s ease-in-out infinite" }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="14" fill="var(--color-accent)" opacity="0.15" />
            <circle cx="18" cy="18" r="8" fill="var(--color-accent)" />
            <g style={{ transformOrigin: "15px 16px", animation: "blink 3s ease-in-out infinite" }}>
              <circle cx="15" cy="16" r="1.5" fill="white" />
            </g>
            <g style={{ transformOrigin: "21px 16px", animation: "blink 3s ease-in-out infinite 0.3s" }}>
              <circle cx="21" cy="16" r="1.5" fill="var(--color-violet)" />
            </g>
            <path d="M14 21c2 1.5 6 1.5 8 0" stroke="white" strokeWidth="1" strokeLinecap="round" />
            <circle cx="12" cy="19" r="1.5" fill="var(--color-rose)" opacity="0.2" />
            <circle cx="24" cy="19" r="1.5" fill="var(--color-rose)" opacity="0.2" />
          </svg>
          <svg width="6" height="6" viewBox="0 0 6 6" className="absolute -right-1 -top-1" style={{ animation: "sparkle 1.5s ease-in-out infinite" }}>
            <path d="M3 0L3.8 2.2L6 3L3.8 3.8L3 6L2.2 3.8L0 3L2.2 2.2Z" fill="var(--color-amber)" />
          </svg>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-accent)", animation: "pulse-soft 1.2s ease-in-out infinite" }}
          />
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-violet)", animation: "pulse-soft 1.2s ease-in-out infinite 0.15s" }}
          />
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-teal)", animation: "pulse-soft 1.2s ease-in-out infinite 0.3s" }}
          />
        </div>
      </div>
    </div>
  );
}
