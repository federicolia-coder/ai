"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Plugin, UserPlugin } from "@/types/database";

interface PluginWithState extends Plugin {
  userEnabled: boolean;
  userPluginId?: string;
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  async function loadPlugins() {
    const supabase = createClient();
    const [pluginsRes, userPluginsRes] = await Promise.all([
      supabase.from("plugins").select("*").order("name"),
      supabase.from("user_plugins").select("*"),
    ]);

    const allPlugins = (pluginsRes.data || []) as Plugin[];
    const userPlugins = (userPluginsRes.data || []) as UserPlugin[];

    const merged = allPlugins.map((p) => {
      const up = userPlugins.find((u) => u.plugin_id === p.id);
      return {
        ...p,
        userEnabled: up ? up.enabled : p.enabled_by_default,
        userPluginId: up?.id,
      };
    });

    setPlugins(merged);
    setLoading(false);
  }

  async function togglePlugin(plugin: PluginWithState) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newState = !plugin.userEnabled;
    setBusy(plugin.id);
    setError(null);

    let userPluginId = plugin.userPluginId;
    let failed = false;
    if (userPluginId) {
      const { error: updErr } = await supabase
        .from("user_plugins")
        .update({ enabled: newState })
        .eq("id", userPluginId);
      failed = !!updErr;
    } else {
      const { data, error: insErr } = await supabase
        .from("user_plugins")
        .insert({ user_id: user.id, plugin_id: plugin.id, enabled: newState })
        .select("id")
        .single();
      failed = !!insErr;
      userPluginId = data?.id;
    }
    setBusy(null);

    if (failed) {
      setError(`Impossibile aggiornare "${plugin.name}". Riprova.`);
      return;
    }

    setPlugins((prev) =>
      prev.map((p) =>
        p.id === plugin.id ? { ...p, userEnabled: newState, userPluginId } : p
      )
    );
  }

  if (loading) return <PageSkeleton />;


  return (
    <div className="flex-1 overflow-y-auto px-6 pb-8 pt-16 md:pt-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Plugin</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          Scegli quali strumenti Tarry può usare nelle risposte.
        </p>
        {error && (
          <p role="alert" className="text-sm mb-4" style={{ color: "var(--color-rose)" }}>
            {error}
          </p>
        )}

        <div className="space-y-3">
          {plugins.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium">{p.name}</h3>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      v{p.version}
                    </span>
                  </div>
                  <p
                    className="text-sm mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {p.description}
                  </p>
                  {p.tools.length > 0 && (
                    <p className="text-xs font-mono" style={{ color: "var(--color-text-tertiary)" }}>
                      {p.tools.join(", ")}
                    </p>
                  )}
                  {p.permissions.length > 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-amber)" }}>
                      {p.permissions.join(", ")}
                    </p>
                  )}
                </div>
                <button
                  role="switch"
                  aria-checked={p.userEnabled}
                  aria-label={`${p.userEnabled ? "Disattiva" : "Attiva"} ${p.name}`}
                  onClick={() => togglePlugin(p)}
                  disabled={busy === p.id}
                  className="shrink-0 ml-4 relative w-9 h-5 rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    background: p.userEnabled
                      ? "var(--color-accent)"
                      : "var(--color-bg-tertiary)",
                  }}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-md bg-white transition-[left,background-color,opacity] duration-150"
                    style={{
                      left: p.userEnabled ? "calc(100% - 18px)" : "2px",
                    }}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
