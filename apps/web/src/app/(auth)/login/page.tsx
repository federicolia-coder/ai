"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, authErrorMessage } from "@/components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(authErrorMessage(error.message));
      setLoading(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Bentornato</h1>
      <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
        Accedi per riprendere le tue conversazioni.
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
            autoComplete="current-password"
            required
            minLength={8}
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--color-rose-soft)", color: "var(--color-rose)" }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>

      <p className="mt-8 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        Non hai un account?{" "}
        <Link href="/signup" className="font-semibold underline underline-offset-4" style={{ color: "var(--color-text)" }}>
          Registrati gratis
        </Link>
      </p>
    </AuthShell>
  );
}
