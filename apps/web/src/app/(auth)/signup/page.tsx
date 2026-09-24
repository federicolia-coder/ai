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
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4">
            <circle cx="24" cy="24" r="20" fill="var(--color-teal)" opacity="0.15" />
            <path d="M16 24l5 5 11-12" stroke="var(--color-teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
      className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Decorative shapes */}
      <svg className="absolute top-16 right-12 opacity-10" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="var(--color-violet)" />
      </svg>
      <svg className="absolute bottom-20 left-16 opacity-10" width="70" height="70" viewBox="0 0 70 70">
        <rect x="8" y="8" width="54" height="54" rx="14" fill="var(--color-teal)" />
      </svg>
      <svg className="absolute top-1/4 left-1/4 opacity-8" width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="12" fill="var(--color-amber)" opacity="0.15" />
      </svg>

      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" fill="var(--color-violet)" />
            <circle cx="14" cy="17" r="3" fill="white" />
            <circle cx="26" cy="17" r="3" fill="var(--color-teal)" />
            <path d="M13 26c3.5 3.5 10.5 3.5 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Crea il tuo account</h1>
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
            style={{ color: "var(--color-accent)" }}
          >
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
