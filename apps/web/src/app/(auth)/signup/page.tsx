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
        <h1 className="text-2xl font-bold text-center mb-1">Tarry</h1>
        <p
          className="text-center text-sm mb-8"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Crea il tuo account
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
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
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
          Hai già un account?{" "}
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
