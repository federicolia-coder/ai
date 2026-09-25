import Link from "next/link";
import { TarryMark } from "@/components/tarry-mark";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Tarry, pagina iniziale">
          <TarryMark size={24} />
          <span className="text-base font-semibold tracking-tight">Tarry</span>
        </Link>
        <Link href="/login" className="btn-ghost">
          Accedi
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
      <footer className="mx-auto max-w-3xl px-6 pb-12">
        <div
          className="flex flex-wrap items-center gap-6 pt-8 text-sm"
          style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-tertiary)" }}
        >
          <Link href="/legal/terms" className="hover:underline">
            Termini
          </Link>
          <Link href="/legal/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/legal/cookies" className="hover:underline">
            Cookie
          </Link>
          <span className="sm:ml-auto">Tarry è un progetto di TestardStudios</span>
        </div>
      </footer>
    </div>
  );
}
