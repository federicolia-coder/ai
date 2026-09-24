import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none" className="mx-auto mb-6">
          <circle cx="16" cy="16" r="14" fill="var(--color-accent)" />
          <circle cx="11" cy="14" r="2.5" fill="white" />
          <circle cx="11.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
          <circle cx="21" cy="14" r="2.5" fill="var(--color-violet)" />
          <circle cx="21.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
          <path d="M11 21c2.5 -2 7.5 -2 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="text-5xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
          404
        </p>
        <p className="text-base mb-8" style={{ color: "var(--color-text-secondary)" }}>
          Questa pagina non esiste
        </p>
        <Link href="/" className="btn-primary px-6 py-3 text-base">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
