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
          <div className="relative" style={{ animation: "bounce-gentle 3s ease-in-out infinite" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="var(--color-violet)" opacity="0.1" />
              <circle cx="24" cy="24" r="14" fill="var(--color-violet)" />
              {/* Blush cheeks */}
              <circle cx="15" cy="28" r="2" fill="var(--color-rose)" opacity="0.25" />
              <circle cx="33" cy="28" r="2" fill="var(--color-rose)" opacity="0.25" />
              {/* Eyes with shine */}
              <g style={{ transformOrigin: "19px 22px", animation: "blink 4s ease-in-out infinite" }}>
                <circle cx="19" cy="22" r="2.5" fill="white" />
                <circle cx="19.8" cy="21.5" r="0.7" fill="white" opacity="0.8" />
              </g>
              <g style={{ transformOrigin: "29px 22px", animation: "blink 4s ease-in-out infinite 0.3s" }}>
                <circle cx="29" cy="22" r="2.5" fill="var(--color-teal)" />
                <circle cx="29.8" cy="21.5" r="0.7" fill="white" opacity="0.8" />
              </g>
              {/* Big smile */}
              <path d="M18 30c3 3 9 3 12 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {/* Waving hand */}
            <svg width="14" height="14" viewBox="0 0 14 14" className="absolute -right-1 top-0" style={{ animation: "wave 2s ease-in-out infinite" }}>
              <text x="1" y="12" fontSize="11">✨</text>
            </svg>
            <svg width="6" height="6" viewBox="0 0 6 6" className="absolute -left-2 top-3" style={{ animation: "sparkle 2s ease-in-out infinite 0.5s" }}>
              <path d="M3 0L3.8 2.2L6 3L3.8 3.8L3 6L2.2 3.8L0 3L2.2 2.2Z" fill="var(--color-teal)" />
            </svg>
          </div>
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
            style={{ color: "var(--color-accent-text)" }}
          >
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
