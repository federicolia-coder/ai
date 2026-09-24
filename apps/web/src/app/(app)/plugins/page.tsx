"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Plugin, UserPlugin } from "@/types/database";

interface PluginWithState extends Plugin {
  userEnabled: boolean;
  userPluginId?: string;
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginWithState[]>([]);
  const [loading, setLoading] = useState(true);

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

    if (plugin.userPluginId) {
      await supabase
        .from("user_plugins")
        .update({ enabled: newState })
        .eq("id", plugin.userPluginId);
    } else {
      await supabase.from("user_plugins").insert({
        user_id: user.id,
        plugin_id: plugin.id,
        enabled: newState,
      });
    }

    setPlugins(
      plugins.map((p) =>
        p.id === plugin.id ? { ...p, userEnabled: newState } : p
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
        <h1 className="text-xl font-semibold mb-6">Plugin</h1>

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
                  onClick={() => togglePlugin(p)}
                  className="shrink-0 ml-4 relative w-9 h-5 rounded-lg transition-colors"
                  style={{
                    background: p.userEnabled
                      ? "var(--color-accent)"
                      : "var(--color-bg-tertiary)",
                  }}
                >
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-md bg-white transition-all"
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
