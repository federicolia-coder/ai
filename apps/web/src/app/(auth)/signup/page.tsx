"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="w-full max-w-sm text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--color-teal-soft)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Controlla la tua email</h1>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Ti abbiamo inviato un link di conferma a{" "}
            <strong>{email}</strong>.
          </p>
          <Link
            href="/login"
            className="btn-secondary mt-6 inline-block"
          >
            Torna al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="var(--color-accent)" />
            <circle cx="11" cy="14" r="2.5" fill="white" />
            <circle cx="11.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
            <circle cx="21" cy="14" r="2.5" fill="var(--color-violet)" />
            <circle cx="21.5" cy="13.5" r="0.8" fill="white" opacity="0.9" />
            <path d="M11 21c2.5 3 7.5 3 10 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1" style={{ textWrap: "balance" }}>Crea il tuo account</h1>
        <p
          className="text-center text-sm mb-8"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Inizia a usare Tarry gratis
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Minimo 8 caratteri
            </p>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--color-rose)" }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Registrazione..." : "Registrati"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Hai gia un account?{" "}
          <Link
            href="/login"
            className="font-medium"
            style={{ color: "var(--color-accent-text)" }}
          >
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
