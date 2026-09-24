"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Decorative shapes */}
      <svg className="absolute top-12 left-12 opacity-10" width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="55" fill="var(--color-accent)" />
      </svg>
      <svg className="absolute bottom-16 right-16 opacity-10" width="80" height="80" viewBox="0 0 80 80">
        <rect x="10" y="10" width="60" height="60" rx="16" fill="var(--color-violet)" />
      </svg>
      <svg className="absolute top-1/3 right-1/4 opacity-8" width="40" height="40" viewBox="0 0 40 40">
        <polygon points="20,4 36,34 4,34" fill="var(--color-teal)" opacity="0.15" />
      </svg>

      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="16" fill="var(--color-accent)" />
            <circle cx="14" cy="17" r="3" fill="white" />
            <circle cx="26" cy="17" r="3" fill="var(--color-violet)" />
            <path d="M13 26c3.5 3.5 10.5 3.5 14 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-center mb-1">Bentornato</h1>
        <p
          className="text-center text-sm mb-8"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Accedi al tuo account Tarry
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
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--color-rose)" }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Non hai un account?{" "}
          <Link
            href="/signup"
            className="font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
