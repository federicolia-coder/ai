"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, authErrorMessage } from "@/components/auth-shell";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(authErrorMessage(error.message));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <AuthShell>
        <CheckCircle size={40} weight="fill" aria-hidden="true" style={{ color: "var(--color-teal)" }} />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Controlla la tua email</h1>
        <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
          Ti abbiamo mandato un link di conferma a <strong style={{ color: "var(--color-text)" }}>{email}</strong>. Aprilo
          e potrai fare la prima domanda a Tarry.
        </p>
        <Link href="/login" className="btn-secondary mt-8">
          Vai all&apos;accesso
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Crea il tuo account</h1>
      <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
        Piano gratuito con 100.000 token al mese. Nessuna carta richiesta.
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

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-hint"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p id="password-hint" className="mt-2 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Almeno 8 caratteri.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--color-rose-soft)", color: "var(--color-rose)" }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creazione in corso…" : "Crea account"}
        </button>
      </form>

      <p className="mt-6 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
        Registrandoti accetti i{" "}
        <Link href="/legal/terms" className="underline underline-offset-2">
          Termini
        </Link>{" "}
        e l&apos;
        <Link href="/legal/privacy" className="underline underline-offset-2">
          Informativa privacy
        </Link>
        .
      </p>

      <p className="mt-8 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Hai già un account?{" "}
        <Link href="/login" className="font-semibold underline underline-offset-4" style={{ color: "var(--color-text)" }}>
          Accedi
        </Link>
      </p>
    </AuthShell>
  );
}
