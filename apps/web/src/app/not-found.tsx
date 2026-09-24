import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Decorative scattered shapes */}
      <svg className="absolute top-1/4 left-1/4 opacity-10" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="35" fill="var(--color-accent)" />
      </svg>
      <svg className="absolute bottom-1/4 right-1/4 opacity-10" width="60" height="60" viewBox="0 0 60 60">
        <rect x="8" y="8" width="44" height="44" rx="12" fill="var(--color-violet)" />
      </svg>

      <div className="text-center relative">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto mb-4">
          <circle cx="40" cy="40" r="32" fill="var(--color-accent)" opacity="0.1" />
          <circle cx="40" cy="40" r="22" fill="var(--color-accent)" opacity="0.15" />
          <circle cx="30" cy="36" r="4" fill="var(--color-accent)" />
          <circle cx="50" cy="36" r="4" fill="var(--color-violet)" />
          <path d="M30 52c5-4 15-4 20 0" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
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
