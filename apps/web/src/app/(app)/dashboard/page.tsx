"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Usage, Subscription, Conversation } from "@/types/database";

export default function DashboardPage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [recentConversations, setRecentConversations] = useState<
    Conversation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const supabase = createClient();

    const [usageRes, subRes, convRes] = await Promise.all([
      supabase
        .from("usage")
        .select("*")
        .order("period_start", { ascending: false })
        .limit(1),
      supabase.from("subscriptions").select("*").limit(1),
      supabase
        .from("conversations")
        .select("*")
        .eq("archived", false)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    if (usageRes.data?.[0]) setUsage(usageRes.data[0] as Usage);
    if (subRes.data?.[0]) setSubscription(subRes.data[0] as Subscription);
    if (convRes.data) setRecentConversations(convRes.data as Conversation[]);
    setLoading(false);
  }

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
    return n.toString();
  }

  if (loading) return <PageSkeleton />;

  const usedPercent = usage
    ? Math.min((usage.tokens_used / usage.token_limit) * 100, 100)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-8 pt-16 md:pt-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Utilizzo</h1>

        {/* Usage card */}
        <div className="card mb-4">
          <h2
            className="text-xs font-medium mb-3"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Utilizzo token
          </h2>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-2xl font-bold">
              {usage ? formatTokens(usage.tokens_used) : "…"}
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              / {usage ? formatTokens(usage.token_limit) : "…"} token
            </span>
          </div>
          <div
            className="h-2 rounded-sm overflow-hidden"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <div
              className="h-full rounded-sm transition-[width] duration-300"
              style={{
                width: `${usedPercent}%`,
                background:
                  usedPercent > 90
                    ? "var(--color-rose)"
                    : "var(--color-cta)",
              }}
            />
          </div>
        </div>

        {/* Plan card */}
        <div className="card mb-4">
          <h2
            className="text-xs font-medium mb-2"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Piano attivo
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold capitalize">
              {subscription?.plan || "Free"}
            </p>
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{
                background:
                  subscription?.status === "active"
                    ? "var(--color-teal)"
                    : "var(--color-text-tertiary)",
              }}
            />
          </div>
        </div>

        {/* Recent conversations */}
        <div className="card">
          <h2
            className="text-xs font-medium mb-3"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Conversazioni recenti
          </h2>
          {recentConversations.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Nessuna conversazione
            </p>
          ) : (
            <ul className="space-y-2">
              {recentConversations.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate min-w-0">{c.title}</span>
                    <span
                      className="shrink-0 text-xs ml-2"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {new Date(c.updated_at).toLocaleDateString("it-IT")}
                    </span>
                  </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
