"use client";

import { useEffect, useState } from "react";
import { Cloud, GithubLogo, NotionLogo, PlugsConnected, WebhooksLogo } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Connector, ConnectorField, UserConnector } from "@/types/database";

const TOOL_LABELS: Record<string, string> = {
  github_repos: "elencare i tuoi repository",
  github_issues: "leggere le issue",
  github_file: "leggere file e cartelle del codice",
  notion_search: "cercare le pagine",
  notion_page: "leggere il contenuto delle pagine",
  webhook_send: "inviare messaggi al tuo endpoint quando glielo chiedi",
};

const ICONS: Record<string, React.ElementType> = {
  cloud: Cloud,
  book: NotionLogo,
  code: GithubLogo,
  webhook: WebhooksLogo,
};

function Icon({ name }: { name: string }) {
  const C = ICONS[name] ?? PlugsConnected;
  return <C size={20} aria-hidden="true" />;
}

type Status = "unavailable" | "disconnected" | "active" | "paused";

function statusOf(c: Connector, uc?: UserConnector): Status {
  if (!c.available) return "unavailable";
  if (!uc || !uc.configured) return "disconnected";
  return uc.enabled ? "active" : "paused";
}

const STATUS_LABEL: Record<Status, string> = {
  unavailable: "In arrivo",
  disconnected: "Non collegato",
  active: "Collegato",
  paused: "In pausa",
};

function StatusBadge({ status }: { status: Status }) {
  const active = status === "active";
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded"
      style={{
        background: active ? "var(--color-teal-soft)" : "var(--color-bg-tertiary)",
        color: active ? "var(--color-teal)" : "var(--color-text-tertiary)",
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function ConnectForm({
  connector,
  onDone,
  onCancel,
}: {
  connector: Connector;
  onDone: (account: string | null) => void;
  onCancel: () => void;
}) {
  const fields: ConnectorField[] = connector.config_schema?.fields ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/connectors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ connector_id: connector.id, config: values }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Collegamento non riuscito");
        return;
      }
      setValues({});
      onDone(body.account ?? null);
    } catch {
      setError("Connessione di rete non riuscita. Riprova.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--color-border-light)" }}>
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`${connector.id}-${f.name}`} className="block text-xs font-medium mb-1">
            {f.label}
            {!f.required && <span style={{ color: "var(--color-text-tertiary)" }}> (opzionale)</span>}
          </label>
          <input
            id={`${connector.id}-${f.name}`}
            type={f.type === "password" ? "password" : f.type === "url" ? "url" : "text"}
            className="input-field text-sm"
            value={values[f.name] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            required={f.required}
            maxLength={500}
            autoComplete="off"
            spellCheck={false}
            placeholder={f.type === "url" ? "https://" : undefined}
          />
          {f.help && (
            <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
              {f.help}
            </p>
          )}
        </div>
      ))}
      {error && (
        <p role="alert" className="text-xs" style={{ color: "var(--color-rose)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary text-xs" disabled={saving}>
          {saving ? "Verifica in corso…" : "Verifica e collega"}
        </button>
        <button type="button" className="btn btn-ghost text-xs" onClick={onCancel} disabled={saving}>
          Annulla
        </button>
      </div>
      <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
        Le credenziali vengono verificate subito e salvate in modo che nemmeno questa pagina possa rileggerle.
      </p>
    </form>
  );
}

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [mine, setMine] = useState<Record<string, UserConnector>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [notice, setNotice] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const supabase = createClient();
    const [cRes, ucRes] = await Promise.all([
      supabase
        .from("connectors")
        .select("id, slug, name, description, icon, auth_type, config_schema, tools, available, enabled, created_at")
        .order("available", { ascending: false })
        .order("name"),
      supabase.from("user_connectors").select("id, user_id, connector_id, enabled, configured, created_at, updated_at"),
    ]);
    if (cRes.error || ucRes.error) {
      setLoadError("Impossibile caricare i connettori. Ricarica la pagina.");
      setLoading(false);
      return;
    }
    setConnectors((cRes.data ?? []) as Connector[]);
    const map: Record<string, UserConnector> = {};
    for (const uc of (ucRes.data ?? []) as UserConnector[]) map[uc.connector_id] = uc;
    setMine(map);
    setLoadError(null);
    setLoading(false);
  }

  async function setEnabled(c: Connector, enabled: boolean) {
    const uc = mine[c.id];
    if (!uc) return;
    setBusy(c.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("user_connectors")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("id", uc.id);
    setBusy(null);
    if (error) {
      setNotice((n) => ({ ...n, [c.id]: "Modifica non salvata, riprova." }));
      return;
    }
    setMine((m) => ({ ...m, [c.id]: { ...uc, enabled } }));
  }

  async function disconnect(c: Connector) {
    const uc = mine[c.id];
    if (!uc) return;
    if (!window.confirm(`Scollegare ${c.name}? Le credenziali salvate verranno eliminate.`)) return;
    setBusy(c.id);
    const supabase = createClient();
    const { error } = await supabase.from("user_connectors").delete().eq("id", uc.id);
    setBusy(null);
    if (error) {
      setNotice((n) => ({ ...n, [c.id]: "Scollegamento non riuscito, riprova." }));
      return;
    }
    setMine((m) => {
      const next = { ...m };
      delete next[c.id];
      return next;
    });
    setNotice((n) => ({ ...n, [c.id]: `${c.name} scollegato.` }));
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-8 pt-16 md:pt-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Connettori</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Collega i tuoi account: Tarry potrà usarli in chat quando glielo chiedi.
        </p>

        {loadError && (
          <p role="alert" className="text-sm mb-4" style={{ color: "var(--color-rose)" }}>
            {loadError}
          </p>
        )}

        <div className="space-y-3">
          {connectors.map((c) => {
            const uc = mine[c.id];
            const status = statusOf(c, uc);
            const connected = status === "active" || status === "paused";
            const isBusy = busy === c.id;
            return (
              <div key={c.id} className="card" style={{ opacity: status === "unavailable" ? 0.6 : 1 }}>
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: status === "active" ? "var(--color-accent-soft)" : "var(--color-bg-tertiary)",
                      color: status === "active" ? "var(--color-accent-text)" : "var(--color-text-tertiary)",
                    }}
                  >
                    <Icon name={c.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm font-medium">{c.name}</h2>
                      <StatusBadge status={status} />
                    </div>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {c.description}
                    </p>
                    {c.tools.length > 0 && (
                      <p className="text-xs mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                        Tarry potrà {c.tools.map((t) => TOOL_LABELS[t] ?? t).join(", ")}.
                      </p>
                    )}
                    {status === "unavailable" && (
                      <p className="text-xs mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                        Richiede l&apos;accesso con Google, non ancora disponibile.
                      </p>
                    )}
                    {notice[c.id] && (
                      <p className="text-xs mt-2" role="status" style={{ color: "var(--color-text-secondary)" }}>
                        {notice[c.id]}
                      </p>
                    )}

                    {c.available && openForm !== c.id && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          className={connected ? "btn btn-ghost text-xs" : "btn btn-primary text-xs"}
                          onClick={() => {
                            setOpenForm(c.id);
                            setNotice((n) => ({ ...n, [c.id]: "" }));
                          }}
                          disabled={isBusy}
                        >
                          {connected ? "Aggiorna credenziali" : "Collega"}
                        </button>
                        {connected && (
                          <button
                            className="btn btn-ghost text-xs"
                            style={{ color: "var(--color-rose)" }}
                            onClick={() => disconnect(c)}
                            disabled={isBusy}
                          >
                            Scollega
                          </button>
                        )}
                      </div>
                    )}

                    {openForm === c.id && (
                      <ConnectForm
                        connector={c}
                        onCancel={() => setOpenForm(null)}
                        onDone={(account) => {
                          setOpenForm(null);
                          setNotice((n) => ({
                            ...n,
                            [c.id]: account ? `Collegato come ${account}.` : "Collegato.",
                          }));
                          load();
                        }}
                      />
                    )}
                  </div>
                  {connected && (
                    <button
                      role="switch"
                      aria-checked={status === "active"}
                      aria-label={`${status === "active" ? "Metti in pausa" : "Riattiva"} ${c.name}`}
                      onClick={() => setEnabled(c, status !== "active")}
                      disabled={isBusy}
                      className="shrink-0 ml-2 relative w-9 h-5 rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: status === "active" ? "var(--color-accent)" : "var(--color-bg-tertiary)" }}
                    >
                      <span
                        className="absolute top-0.5 h-4 w-4 rounded-md bg-white transition-[left,background-color,opacity] duration-150"
                        style={{ left: status === "active" ? "calc(100% - 18px)" : "2px" }}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {connectors.length === 0 && !loadError && (
            <p className="text-center py-8 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Nessun connettore disponibile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
