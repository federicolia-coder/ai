"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Connector, UserConnector } from "@/types/database";

interface ConnectorWithState extends Connector {
  userEnabled: boolean;
  userConnectorId?: string;
  userConfig: Record<string, unknown>;
}

const CONNECTOR_ICONS: Record<string, React.ReactNode> = {
  google_drive: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3l6 0 4 7H11L7 3z" />
      <path d="M3 17l3-7h11l-3 7H3z" />
      <path d="M7 3L3 10l3 7" />
    </svg>
  ),
  notion: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <path d="M7 6h6M7 10h6M7 14h3" />
    </svg>
  ),
  github: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M7 16v-2a2 2 0 012-2h2a2 2 0 012 2v2" />
      <circle cx="10" cy="8" r="2" />
    </svg>
  ),
  webhook: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L6 5h3L7 12" />
      <circle cx="14" cy="14" r="4" />
      <path d="M14 12v4h4" />
    </svg>
  ),
};

function defaultIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 7v3l2 2" />
    </svg>
  );
}

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<string | null>(null);

  useEffect(() => {
    loadConnectors();
  }, []);

  async function loadConnectors() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [connectorsRes, userConnectorsRes] = await Promise.all([
      supabase.from("connectors").select("*").order("name"),
      supabase.from("user_connectors").select("*").eq("user_id", user.id),
    ]);

    const allConnectors = (connectorsRes.data || []) as Connector[];
    const userConnectors = (userConnectorsRes.data || []) as UserConnector[];

    const merged = allConnectors.map((c) => {
      const uc = userConnectors.find((u) => u.connector_id === c.id);
      return {
        ...c,
        userEnabled: uc ? uc.enabled : false,
        userConnectorId: uc?.id,
        userConfig: uc?.config || {},
      };
    });

    setConnectors(merged);
    setLoading(false);
  }

  async function toggleConnector(connector: ConnectorWithState) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newState = !connector.userEnabled;

    if (connector.userConnectorId) {
      await supabase
        .from("user_connectors")
        .update({ enabled: newState })
        .eq("id", connector.userConnectorId);
    } else {
      await supabase.from("user_connectors").insert({
        user_id: user.id,
        connector_id: connector.id,
        enabled: newState,
        config: {},
      });
    }

    setConnectors(
      connectors.map((c) =>
        c.id === connector.id ? { ...c, userEnabled: newState } : c
      )
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-text-tertiary)", animation: "pulse-soft 1.2s ease-in-out infinite" }} />
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-text-tertiary)", animation: "pulse-soft 1.2s ease-in-out infinite 0.15s" }} />
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-text-tertiary)", animation: "pulse-soft 1.2s ease-in-out infinite 0.3s" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold mb-1">Connettori</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Collega servizi esterni per estendere le capacita di Tarry.
        </p>

        <div className="space-y-3">
          {connectors.map((c) => (
            <div key={c.id} className="card">
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: c.userEnabled ? "var(--color-accent-soft)" : "var(--color-bg-tertiary)",
                    color: c.userEnabled ? "var(--color-accent-text)" : "var(--color-text-tertiary)",
                  }}
                >
                  {CONNECTOR_ICONS[c.icon] || defaultIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium">{c.name}</h3>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: c.userEnabled ? "var(--color-teal-soft)" : "var(--color-bg-tertiary)",
                        color: c.userEnabled ? "var(--color-teal)" : "var(--color-text-tertiary)",
                      }}
                    >
                      {c.userEnabled ? "Attivo" : "Disattivo"}
                    </span>
                  </div>
                  <p className="text-sm mb-2" style={{ color: "var(--color-text-secondary)" }}>
                    {c.description}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                    Autenticazione: {c.auth_type}
                  </p>
                </div>
                <button
                  onClick={() => toggleConnector(c)}
                  className="shrink-0 ml-2 relative w-9 h-5 rounded-lg transition-colors"
                  style={{
                    background: c.userEnabled
                      ? "var(--color-accent)"
                      : "var(--color-bg-tertiary)",
                  }}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-md bg-white transition-all"
                    style={{
                      left: c.userEnabled ? "calc(100% - 18px)" : "2px",
                    }}
                  />
                </button>
              </div>
            </div>
          ))}

          {connectors.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                Nessun connettore disponibile.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
