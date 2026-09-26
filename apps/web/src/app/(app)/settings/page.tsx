"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Subscription, Usage } from "@/types/database";

const STATUS_LABELS: Record<string, string> = {
  active: "Attivo",
  trialing: "In prova",
  past_due: "Pagamento in sospeso",
  canceled: "Annullato",
  incomplete: "Incompleto",
  unpaid: "Non pagato",
};

const CONFIRM_WORD = "ELIMINA";

const PLAN_DETAILS: Record<string, { tokens: string; price: string; color: string }> = {
  free: { tokens: "100K", price: "€0", color: "var(--color-teal)" },
  plus: { tokens: "2M", price: "€9/mese", color: "var(--color-accent-text)" },
  pro: { tokens: "10M", price: "€29/mese", color: "var(--color-violet)" },
};

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const router = useRouter();
  const [tab, setTab] = useState<"account" | "subscription" | "usage">("account");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setCheckoutMessage("Abbonamento attivato con successo!");
      setTab("subscription");
    } else if (checkout === "cancel") {
      setCheckoutMessage("Checkout annullato.");
      setTab("subscription");
    }
  }, [searchParams]);

  async function loadSettings() {
    const supabase = createClient();
    const [profileRes, subRes, usageRes] = await Promise.all([
      supabase.from("profiles").select("*").limit(1),
      supabase.from("subscriptions").select("*").limit(1),
      supabase
        .from("usage")
        .select("*")
        .order("period_start", { ascending: false })
        .limit(1),
    ]);
    if (profileRes.data?.[0]) setProfile(profileRes.data[0] as Profile);
    if (subRes.data?.[0]) setSubscription(subRes.data[0] as Subscription);
    if (usageRes.data?.[0]) setUsage(usageRes.data[0] as Usage);
  }

  async function handleUpgrade(plan: string) {
    setCheckoutLoading(true);
    setCheckoutMessage(null);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan }),
        }
      );

      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutMessage(data.error || "Errore durante il checkout");
      }
    } catch {
      setCheckoutMessage("Errore di connessione");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleBillingPortal() {
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/billing-portal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setCheckoutMessage("Errore di connessione");
    }
  }

  async function deleteAccount() {
    if (confirmText !== CONFIRM_WORD) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ confirm: CONFIRM_WORD }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        setDeleteError(
          data.error === "Subscription cancel failed"
            ? "Non siamo riusciti ad annullare l'abbonamento, quindi l'account non è stato eliminato. Riprova o scrivici."
            : "Eliminazione non riuscita. Riprova tra poco."
        );
        return;
      }
      await supabase.auth.signOut();
      router.replace("/?account=deleted");
    } catch {
      setDeleteError("Connessione assente o instabile. Riprova.");
    } finally {
      setDeleting(false);
    }
  }

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
    return n.toString();
  }

  const tabs = [
    { key: "account" as const, label: "Account" },
    { key: "subscription" as const, label: "Abbonamento" },
    { key: "usage" as const, label: "Utilizzo" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-8 pt-16 md:pt-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Impostazioni</h1>

        {checkoutMessage && (
          <div
            className="rounded-lg px-4 py-3 mb-4 text-sm"
            style={{
              background: "var(--color-accent-soft)",
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent-text)",
            }}
          >
            {checkoutMessage}
          </div>
        )}

        {/* Tabs */}
        <div
          className="flex gap-1 rounded-lg p-1 mb-6"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                background:
                  tab === t.key ? "var(--color-bg)" : "transparent",
                color:
                  tab === t.key
                    ? "var(--color-text)"
                    : "var(--color-text-secondary)",
                boxShadow:
                  tab === t.key ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Account Tab */}
        {tab === "account" && profile && (
          <div className="card">
            <div className="space-y-4">
              <div>
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Email
                </label>
                <p className="text-sm mt-0.5">{profile.email}</p>
              </div>
              <div>
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Piano
                </label>
                <p className="text-sm mt-0.5 capitalize">{profile.plan}</p>
              </div>
              <div>
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Membro dal
                </label>
                <p className="text-sm mt-0.5">
                  {new Date(profile.created_at).toLocaleDateString("it-IT")}
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "account" && profile && (
          <div className="card mt-4">
            <h2 className="text-sm font-medium">Elimina account</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Cancella per sempre conversazioni, file, connettori e dati di utilizzo. Se hai un
              abbonamento, viene annullato subito. Non si può tornare indietro.
            </p>
            <label htmlFor="confirm-delete" className="mt-4 block text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
              Scrivi {CONFIRM_WORD} per confermare
            </label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                id="confirm-delete"
                type="text"
                className="input-field flex-1"
                autoComplete="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
              <button
                onClick={deleteAccount}
                disabled={confirmText !== CONFIRM_WORD || deleting}
                className="btn-secondary text-sm"
                style={{ color: "var(--color-rose)", borderColor: "var(--color-rose)" }}
              >
                {deleting ? "Eliminazione..." : "Elimina account"}
              </button>
            </div>
            {deleteError && (
              <p className="mt-2 text-sm" role="alert" style={{ color: "var(--color-rose)" }}>
                {deleteError}
              </p>
            )}
          </div>
        )}

        {/* Subscription Tab */}
        {tab === "subscription" && subscription && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold capitalize">
                  {subscription.plan}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{
                      background:
                        subscription.status === "active"
                          ? "var(--color-teal)"
                          : "var(--color-text-tertiary)",
                    }}
                  />
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </span>
              </div>
              <p
                className="text-sm mb-3"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {PLAN_DETAILS[subscription.plan]?.tokens || "100K"} token/mese
                &middot; {PLAN_DETAILS[subscription.plan]?.price || "€0"}
              </p>
              {subscription.current_period_end && (
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Periodo corrente fino al{" "}
                  {new Date(subscription.current_period_end).toLocaleDateString(
                    "it-IT"
                  )}
                </p>
              )}
              {subscription.stripe_customer_id && (
                <button
                  onClick={handleBillingPortal}
                  className="btn-secondary text-sm mt-3"
                >
                  Gestisci abbonamento
                </button>
              )}
            </div>

            {subscription.plan === "free" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(["plus", "pro"] as const).map((plan) => (
                  <div key={plan} className="card" style={{ borderColor: PLAN_DETAILS[plan].color }}>
                    <h3 className="font-semibold capitalize mb-1">{plan}</h3>
                    <p
                      className="text-sm mb-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {PLAN_DETAILS[plan].tokens} token/mese
                    </p>
                    <p className="text-lg font-bold mb-3" style={{ color: PLAN_DETAILS[plan].color }}>
                      {PLAN_DETAILS[plan].price}
                    </p>
                    <button
                      onClick={() => handleUpgrade(plan)}
                      disabled={checkoutLoading}
                      className="btn-primary w-full text-sm"
                    >
                      {checkoutLoading ? "..." : `Upgrade a ${plan}`}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {subscription.plan === "plus" && (
              <div className="card" style={{ borderColor: "var(--color-violet)" }}>
                <h3 className="font-semibold mb-1">Pro</h3>
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {PLAN_DETAILS.pro.tokens} token/mese
                </p>
                <p className="text-lg font-bold mb-3" style={{ color: "var(--color-violet)" }}>
                  {PLAN_DETAILS.pro.price}
                </p>
                <button
                  onClick={() => handleUpgrade("pro")}
                  disabled={checkoutLoading}
                  className="btn-primary w-full text-sm"
                >
                  {checkoutLoading ? "..." : "Upgrade a Pro"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Usage Tab */}
        {tab === "usage" && (
          <div className="space-y-4">
            <div className="card">
              <h2
                className="text-xs font-medium mb-3"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Token utilizzati
              </h2>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold">
                  {usage ? formatTokens(usage.tokens_used) : "0"}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  / {usage ? formatTokens(usage.token_limit) : "100K"}
                </span>
              </div>
              {usage && (
                <>
                  <div
                    className="h-2 rounded-sm overflow-hidden mb-3"
                    style={{ background: "var(--color-bg-tertiary)" }}
                  >
                    <div
                      className="h-full rounded-sm transition-[width] duration-300"
                      style={{
                        width: `${Math.min(
                          (usage.tokens_used / usage.token_limit) * 100,
                          100
                        )}%`,
                        background:
                          usage.tokens_used / usage.token_limit > 0.9
                            ? "var(--color-rose)"
                            : "var(--color-teal)",
                      }}
                    />
                  </div>
                  <div
                    className="flex justify-between text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    <span>
                      Rimanenti:{" "}
                      {formatTokens(
                        Math.max(0, usage.token_limit - usage.tokens_used)
                      )}
                    </span>
                    <span>
                      Reset:{" "}
                      {new Date(usage.period_end).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
