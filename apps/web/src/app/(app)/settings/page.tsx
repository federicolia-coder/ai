"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Subscription, ApiKey } from "@/types/database";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<"account" | "subscription" | "api_keys">(
    "account"
  );

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const supabase = createClient();
    const [profileRes, subRes, keysRes] = await Promise.all([
      supabase.from("profiles").select("*").limit(1),
      supabase.from("subscriptions").select("*").limit(1),
      supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    if (profileRes.data?.[0]) setProfile(profileRes.data[0] as Profile);
    if (subRes.data?.[0]) setSubscription(subRes.data[0] as Subscription);
    if (keysRes.data) setApiKeys(keysRes.data as ApiKey[]);
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
    const keyHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

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

  const tabs = [
    { key: "account" as const, label: "Account" },
    { key: "subscription" as const, label: "Abbonamento" },
    { key: "api_keys" as const, label: "API Keys" },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold mb-6">Impostazioni</h1>

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
            <div className="space-y-3">
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
          <div className="card">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
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
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {subscription.token_limit >= 1_000_000
                  ? (subscription.token_limit / 1_000_000).toFixed(0) + "M"
                  : (subscription.token_limit / 1_000).toFixed(0) + "K"}{" "}
                token/mese
              </p>
              {subscription.plan === "free" && (
                <button className="btn-primary text-sm mt-2">
                  Upgrade
                </button>
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
