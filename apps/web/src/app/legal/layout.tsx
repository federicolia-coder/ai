import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--color-border-light)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="var(--color-accent)" />
            <circle cx="8" cy="10" r="2" fill="white" />
            <circle cx="16" cy="10" r="2" fill="var(--color-violet)" />
            <path
              d="M8 16c2 2 6 2 8 0"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-lg font-semibold tracking-tight">Tarry</span>
        </Link>
        <Link href="/login" className="btn-ghost text-sm">
          Log in
        </Link>
      </nav>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
      <footer
        className="border-t py-8 px-6"
        style={{ borderColor: "var(--color-border-light)" }}
      >
        <div className="mx-auto max-w-3xl flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          <Link href="/legal/terms" className="hover:underline">Condizioni d&apos;uso</Link>
          <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
          <Link href="/legal/cookies" className="hover:underline">Cookie</Link>
          <span>Tarry AI &mdash; TestardStudios</span>
        </div>
      </footer>
    </div>
  );
}
