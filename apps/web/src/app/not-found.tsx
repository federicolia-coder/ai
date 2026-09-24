import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Decorative scattered shapes */}
      <svg className="absolute top-1/4 left-1/4 opacity-10" width="80" height="80" viewBox="0 0 80 80" style={{ animation: "float 5s ease-in-out infinite" }}>
        <circle cx="40" cy="40" r="35" fill="var(--color-accent)" />
      </svg>
      <svg className="absolute bottom-1/4 right-1/4 opacity-10" width="60" height="60" viewBox="0 0 60 60" style={{ animation: "float 4s ease-in-out infinite 1s" }}>
        <rect x="8" y="8" width="44" height="44" rx="12" fill="var(--color-violet)" />
      </svg>

      <div className="text-center relative">
        <div className="inline-block relative mb-4" style={{ animation: "bounce-gentle 3s ease-in-out infinite" }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="32" fill="var(--color-accent)" opacity="0.1" />
            <circle cx="40" cy="40" r="22" fill="var(--color-accent)" opacity="0.15" />
            {/* Face */}
            <circle cx="40" cy="40" r="14" fill="var(--color-accent)" />
            {/* Blush cheeks */}
            <circle cx="30" cy="44" r="2.5" fill="var(--color-rose)" opacity="0.25" />
            <circle cx="50" cy="44" r="2.5" fill="var(--color-rose)" opacity="0.25" />
            {/* Sad eyes with tears */}
            <g style={{ transformOrigin: "34px 38px", animation: "blink 5s ease-in-out infinite" }}>
              <circle cx="34" cy="38" r="2.5" fill="white" />
              <circle cx="34.5" cy="37.5" r="0.7" fill="white" opacity="0.8" />
            </g>
            <g style={{ transformOrigin: "46px 38px", animation: "blink 5s ease-in-out infinite 0.4s" }}>
              <circle cx="46" cy="38" r="2.5" fill="var(--color-violet)" />
              <circle cx="46.5" cy="37.5" r="0.7" fill="white" opacity="0.8" />
            </g>
            {/* Tear drops */}
            <ellipse cx="33" cy="43" rx="0.8" ry="1.2" fill="var(--color-teal)" opacity="0.5" />
            <ellipse cx="47" cy="42" rx="0.8" ry="1.2" fill="var(--color-teal)" opacity="0.5" />
            {/* Sad mouth */}
            <path d="M35 48c2.5 -2 7.5 -2 10 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {/* Sparkles around */}
          <svg width="8" height="8" viewBox="0 0 8 8" className="absolute -left-2 top-4" style={{ animation: "sparkle 3s ease-in-out infinite" }}>
            <path d="M4 0L5 3L8 4L5 5L4 8L3 5L0 4L3 3Z" fill="var(--color-amber)" />
          </svg>
          <svg width="6" height="6" viewBox="0 0 6 6" className="absolute -right-2 top-6" style={{ animation: "sparkle 3s ease-in-out infinite 1s" }}>
            <path d="M3 0L3.8 2.2L6 3L3.8 3.8L3 6L2.2 3.8L0 3L2.2 2.2Z" fill="var(--color-violet)" />
          </svg>
        </div>
        <p className="text-5xl font-bold mb-2" style={{ color: "var(--color-accent)" }}>
          404
        </p>
        <p className="text-base mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Questa pagina non esiste
        </p>
        <Link href="/" className="btn-primary px-6 py-2.5 text-sm">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
