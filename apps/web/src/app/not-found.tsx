import Link from "next/link";
import { TarryMark } from "@/components/tarry-mark";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center px-6">
      <div className="mx-auto w-full max-w-xl">
        <TarryMark size={56} mood="sad" />
        <p className="mt-8 text-sm font-semibold" style={{ color: "var(--color-accent-text)" }}>
          Errore 404
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Questa pagina non esiste.</h1>
        <p className="mt-4 text-lg" style={{ color: "var(--color-text-secondary)" }}>
          Il link potrebbe essere vecchio o scritto male. Ho cercato bene, promesso.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/" className="btn-primary">
            Torna alla home
          </Link>
          <Link href="/chat" className="btn-ghost text-base">
            Apri la chat
          </Link>
        </div>
      </div>
    </main>
  );
}
