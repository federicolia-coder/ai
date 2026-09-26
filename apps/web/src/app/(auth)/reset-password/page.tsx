"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, authErrorMessage } from "@/components/auth-shell";

type LinkState = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      if (tokenHash) {
        // Link built from {{ .TokenHash }}: works even when opened on another device.
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        setLinkState(error ? "invalid" : "ready");
        return;
      }
      // Default link: the client exchanges ?code= for a session while it initialises.
      const { data } = await supabase.auth.getSession();
      setLinkState(data.session ? "ready" : "invalid");
    })().catch(() => setLinkState("invalid"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Le due password non coincidono.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(
        /different from the old/i.test(error.message)
          ? "La nuova password deve essere diversa da quella attuale."
          : authErrorMessage(error.message)
      );
      return;
    }
    router.push("/chat");
    router.refresh();
  }

  if (linkState === "checking") {
    return (
      <AuthShell>
        <p role="status" className="text-base" style={{ color: "var(--color-text-secondary)" }}>
          Verifica del link in corso…
        </p>
      </AuthShell>
    );
  }

  if (linkState === "invalid") {
    return (
      <AuthShell>
        <h1 className="text-3xl font-semibold tracking-tight">Link scaduto</h1>
        <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
          Questo link non è più valido o è già stato usato. Chiedine uno nuovo e aprilo dallo stesso dispositivo.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-8">
          Chiedi un nuovo link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Nuova password</h1>
      <p className="mt-2 text-base" style={{ color: "var(--color-text-secondary)" }}>
        Almeno 8 caratteri. Dopo il salvataggio entri direttamente nella chat.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Nuova password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-2 block text-sm font-medium">
            Ripeti la password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="input-field"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--color-rose-soft)", color: "var(--color-rose)" }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Salvataggio…" : "Salva e accedi"}
        </button>
      </form>
    </AuthShell>
  );
}
