import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { type SchemaField, testCredentials, validateConfig } from "./logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: rateOk } = await admin.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_action: "connector_connect",
      p_window_seconds: 60,
      p_max_requests: 10,
    });
    if (rateOk === false) return json({ error: "Troppi tentativi. Attendi un minuto." }, 429);

    const body = await req.json().catch(() => null);
    const connectorId = body?.connector_id;
    if (typeof connectorId !== "string") return json({ error: "connector_id mancante" }, 400);

    const { data: connector } = await admin
      .from("connectors")
      .select("id, slug, name, config_schema, available, enabled")
      .eq("id", connectorId)
      .maybeSingle();
    if (!connector || !connector.enabled) return json({ error: "Connettore non trovato" }, 404);
    if (!connector.available) return json({ error: `${connector.name} non è ancora disponibile` }, 400);

    const fields = (connector.config_schema?.fields ?? []) as SchemaField[];
    const validated = validateConfig(fields, body?.config);
    if (!validated.ok) return json({ error: validated.error }, 400);

    const tested = await testCredentials(connector.slug, validated.config);
    if (!tested.ok) return json({ error: tested.error }, 400);

    const { error: saveError } = await admin
      .from("user_connectors")
      .upsert(
        {
          user_id: user.id,
          connector_id: connector.id,
          config: validated.config,
          enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,connector_id" },
      );
    if (saveError) {
      console.error("Connector save failed:", saveError.message);
      return json({ error: "Salvataggio non riuscito" }, 500);
    }

    return json({ ok: true, account: tested.account ?? null });
  } catch (err) {
    console.error("Connectors function error:", err instanceof Error ? err.message : "unknown");
    return json({ error: "Errore interno" }, 500);
  }
});
