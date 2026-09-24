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
          <div className="relative" style={{ animation: "bounce-gentle 3s ease-in-out infinite" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" fill="var(--color-accent)" opacity="0.1" />
              <circle cx="24" cy="24" r="14" fill="var(--color-accent)" />
              {/* Blush cheeks */}
              <circle cx="15" cy="28" r="2" fill="var(--color-rose)" opacity="0.25" />
              <circle cx="33" cy="28" r="2" fill="var(--color-rose)" opacity="0.25" />
              {/* Eyes with shine */}
              <g style={{ transformOrigin: "19px 22px", animation: "blink 4s ease-in-out infinite" }}>
                <circle cx="19" cy="22" r="2.5" fill="white" />
                <circle cx="19.8" cy="21.5" r="0.7" fill="white" opacity="0.8" />
              </g>
              <g style={{ transformOrigin: "29px 22px", animation: "blink 4s ease-in-out infinite 0.3s" }}>
                <circle cx="29" cy="22" r="2.5" fill="var(--color-violet)" />
                <circle cx="29.8" cy="21.5" r="0.7" fill="white" opacity="0.8" />
              </g>
              {/* Big smile */}
              <path d="M18 30c3 3 9 3 12 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {/* Sparkle */}
            <svg width="8" height="8" viewBox="0 0 8 8" className="absolute -right-2 top-0" style={{ animation: "sparkle 2s ease-in-out infinite" }}>
              <path d="M4 0L5 3L8 4L5 5L4 8L3 5L0 4L3 3Z" fill="var(--color-amber)" />
            </svg>
          </div>
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
            style={{ color: "var(--color-accent-text)" }}
          >
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
