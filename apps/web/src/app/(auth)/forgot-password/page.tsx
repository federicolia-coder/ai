"use client";

import { useState } from "react";
import Link from "next/link";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, authErrorMessage } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(authErrorMessage(error.message));
      return;
    }
    // Same message whether or not the address has an account, so it can't be used to probe emails.
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell>
        <EnvelopeSimple size={40} weight="fill" aria-hidden="true" style={{ color: "var(--color-teal)" }} />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Controlla la tua email</h1>
        <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
          Se esiste un account per <strong style={{ color: "var(--color-text)" }}>{email}</strong>, ti abbiamo
          mandato un link per scegliere una nuova password. Aprilo da questo dispositivo.
        </p>
        <Link href="/login" className="btn-secondary mt-8">
          Torna all&apos;accesso
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Password dimenticata</h1>
      <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
        Scrivi l&apos;email del tuo account: ti mandiamo un link per sceglierne una nuova.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--color-rose-soft)", color: "var(--color-rose)" }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Invio in corso…" : "Mandami il link"}
        </button>
      </form>

      <p className="mt-8 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Te la sei ricordata?{" "}
        <Link href="/login" className="font-semibold underline underline-offset-4" style={{ color: "var(--color-text)" }}>
          Accedi
        </Link>
      </p>
    </AuthShell>
  );
}
