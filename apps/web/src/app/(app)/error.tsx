"use client";

import { TarryMark } from "@/components/tarry-mark";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-md">
        <TarryMark size={40} mood="sad" />
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">Questa pagina non si è caricata.</h2>
        <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
          Può succedere se la connessione cade o il server è occupato. Le tue conversazioni sono al sicuro.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-6">
          Riprova
        </button>
      </div>
    </div>
  );
}
