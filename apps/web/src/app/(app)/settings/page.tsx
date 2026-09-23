"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Subscription, ApiKey, Usage } from "@/types/database";

const PLAN_DETAILS: Record<string, { tokens: string; price: string }> = {
  free: { tokens: "100K", price: "€0" },
  plus: { tokens: "2M", price: "€9/mese" },
  pro: { tokens: "10M", price: "€29/mese" },
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
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "account" | "subscription" | "usage" | "api_keys" | "plugins"
  >("account");
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
    const [profileRes, subRes, keysRes, usageRes] = await Promise.all([
      supabase.from("profiles").select("*").limit(1),
      supabase.from("subscriptions").select("*").limit(1),
      supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("usage")
        .select("*")
        .order("period_start", { ascending: false })
        .limit(1),
    ]);
    if (profileRes.data?.[0]) setProfile(profileRes.data[0] as Profile);
    if (subRes.data?.[0]) setSubscription(subRes.data[0] as Subscription);
    if (keysRes.data) setApiKeys(keysRes.data as ApiKey[]);
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

  async function createApiKey() {
    if (!newKeyName.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const rawKey = `tarry_${crypto.randomUUID().replace(/-/g, "")}`;
    const prefix = rawKey.slice(0, 12);

    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: inserted } = await supabase
      .from("api_keys")
      .insert({
        user_id: user.id,
        name: newKeyName.trim(),
        key_hash: keyHash,
        key_prefix: prefix,
      })
      .select()
      .single();

    if (inserted) {
      setApiKeys([inserted as ApiKey, ...apiKeys]);
      setCreatedKey(rawKey);
      setNewKeyName("");
    }
  }

  async function deleteApiKey(id: string) {
    const supabase = createClient();
    await supabase.from("api_keys").delete().eq("id", id);
    setApiKeys(apiKeys.filter((k) => k.id !== id));
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
    { key: "api_keys" as const, label: "API Keys" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold mb-6">Impostazioni</h1>

        {checkoutMessage && (
          <div
            className="rounded-lg px-4 py-3 mb-4 text-sm"
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
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

        {/* Subscription Tab */}
        {tab === "subscription" && subscription && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-lg font-semibold capitalize">
                  {subscription.plan}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {subscription.status}
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
                  <div key={plan} className="card">
                    <h3 className="font-semibold capitalize mb-1">{plan}</h3>
                    <p
                      className="text-sm mb-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {PLAN_DETAILS[plan].tokens} token/mese
                    </p>
                    <p className="text-lg font-bold mb-3">
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
              <div className="card">
                <h3 className="font-semibold mb-1">Pro</h3>
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {PLAN_DETAILS.pro.tokens} token/mese
                </p>
                <p className="text-lg font-bold mb-3">
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
                className="text-xs font-medium uppercase tracking-wider mb-3"
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
                    className="h-2 rounded-full overflow-hidden mb-3"
                    style={{ background: "var(--color-bg-tertiary)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (usage.tokens_used / usage.token_limit) * 100,
                          100
                        )}%`,
                        background:
                          usage.tokens_used / usage.token_limit > 0.9
                            ? "var(--color-danger)"
                            : "var(--color-accent)",
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

        {/* API Keys Tab */}
        {tab === "api_keys" && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-medium mb-3">Crea API Key</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="Nome della chiave"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <button
                  onClick={createApiKey}
                  className="btn-primary text-sm"
                  disabled={!newKeyName.trim()}
                >
                  Crea
                </button>
              </div>
              {createdKey && (
                <div
                  className="mt-3 rounded-lg p-3 text-xs font-mono break-all"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    border: "1px solid var(--color-warning)",
                  }}
                >
                  <p
                    className="text-xs font-sans font-medium mb-1"
                    style={{ color: "var(--color-warning)" }}
                  >
                    Copia questa chiave — non verrà più mostrata
                  </p>
                  {createdKey}
                </div>
              )}
            </div>

            {apiKeys.length > 0 && (
              <div className="card">
                <h3 className="text-sm font-medium mb-3">Le tue chiavi</h3>
                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                      style={{ borderColor: "var(--color-border-light)" }}
                    >
                      <div>
                        <p className="text-sm font-medium">{k.name}</p>
                        <p
                          className="text-xs font-mono"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {k.key_prefix}...
                        </p>
                      </div>
                      <button
                        onClick={() => deleteApiKey(k.id)}
                        className="btn-ghost text-xs"
                        style={{ color: "var(--color-danger)" }}
                      >
                        Revoca
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
