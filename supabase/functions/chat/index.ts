import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";
import { buildHistory, MAX_FILES, relaySse, resolveConnectors, resolvePluginTools, selectAttachments } from "./logic.ts";

const RUNTIME_URL = Deno.env.get("TARRY_RUNTIME_URL") || "";
const RUNTIME_SECRET = Deno.env.get("TARRY_RUNTIME_SECRET") || "";

const HISTORY_LIMIT = 10;
const HISTORY_MAX_CHARS = 6000;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = [
  "Sei Tarry, assistente AI di TestardStudios. Il tuo nome è Tarry.",
  "",
  "Rispondi SEMPRE nella lingua dell'utente. In italiano usa accenti corretti (è, é, à, ò, ù).",
  "",
  "Rispondi in modo utile e completo, ma vai dritto al punto: niente introduzioni, niente ripetizioni della domanda, niente riassunti finali. Aggiungi esempi o dettagli solo quando servono davvero.",
  "",
  "Per domande personali su di te: Mi chiamo Tarry, sono un assistente AI creato da TestardStudios. Sono qui per aiutarti con domande, calcoli, codice e ricerche.",
  "",
  "Per qualsiasi calcolo usa subito lo strumento calculate, senza annunciarlo e senza scrivere formule. Poi dai il risultato in testo semplice con i numeri all'italiana (per esempio 409,50 €). Non usare mai LaTeX.",
  "",
  "Per codice: usa blocchi markdown con il linguaggio (```python, ```js). Se non sai qualcosa, dillo.",
  "",
  "IMPORTANTE: Quando l'utente chiede notizie, eventi recenti, aggiornamenti, meteo, risultati sportivi o qualsiasi informazione che cambia nel tempo, USA SEMPRE lo strumento 'search' per cercare sul web informazioni aggiornate. Non inventare notizie e non dire che non puoi accedere a internet. Cerca e riporta i risultati.",
].join("\n");

const SSE_HEADERS = { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" };

function sseEvent(event: unknown): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, message } = await req.json();

    if (!conversation_id || !message) {
      return new Response(
        JSON.stringify({ error: "conversation_id and message are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (typeof message !== "string" || message.length > 16000) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 16000 characters)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Rate limiting
    const { data: rateOk } = await adminClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_action: "chat",
      p_window_seconds: 60,
      p_max_requests: 20,
    });

    if (rateOk === false) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversation_id)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check token usage (opens a new monthly period when the previous one has expired)
    const { data: usage, error: usageError } = await adminClient.rpc("ensure_current_usage", {
      p_user_id: user.id,
    });

    if (usageError || !usage?.id) {
      console.error("Usage lookup failed:", usageError?.message);
      return new Response(
        JSON.stringify({ error: "Usage record not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (usage.tokens_used >= usage.token_limit) {
      return new Response(
        JSON.stringify({
          error: "Token limit reached",
          tokens_used: usage.tokens_used,
          token_limit: usage.token_limit,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [historyRes, pluginsRes, userPluginsRes, connectorsRes, attachmentsRes] = await Promise.all([
      supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT + 1),
      adminClient.from("plugins").select("id, tools, enabled_by_default"),
      adminClient.from("user_plugins").select("plugin_id, enabled").eq("user_id", user.id),
      adminClient
        .from("user_connectors")
        .select("config, connectors!inner(slug, tools, available, enabled)")
        .eq("user_id", user.id)
        .eq("enabled", true)
        .eq("connectors.available", true)
        .eq("connectors.enabled", true),
      adminClient
        .from("attachments")
        .select("file_name, file_type, file_size, storage_path")
        .eq("conversation_id", conversation_id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const history = buildHistory(historyRes.data ?? [], message, HISTORY_LIMIT, HISTORY_MAX_CHARS);
    const pluginTools = resolvePluginTools(pluginsRes.data ?? [], userPluginsRes.data ?? []);
    const connectors = resolveConnectors(
      (connectorsRes.data ?? []).map((row: any) => ({
        slug: row.connectors.slug,
        tools: row.connectors.tools,
        config: row.config,
      })),
    );
    const enabledTools = [...new Set([...pluginTools, ...connectors.tools])];

    const selected = selectAttachments(attachmentsRes.data ?? [], user.id);
    const files: { name: string; mime: string; data: string }[] = [];
    for (const row of selected.download) {
      const { data: blob, error } = await adminClient.storage.from("attachments").download(row.storage_path);
      if (error || !blob) {
        console.error("Attachment download failed:", row.storage_path, error?.message);
        files.push({ name: row.file_name, mime: row.file_type, data: "" });
        continue;
      }
      files.push({ name: row.file_name, mime: row.file_type, data: toBase64(new Uint8Array(await blob.arrayBuffer())) });
    }
    for (const row of [...selected.metadataOnly, ...selected.skipped]) {
      if (files.length >= MAX_FILES) break;
      files.push({ name: row.file_name, mime: row.file_type, data: "" });
    }

    const runtimeHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RUNTIME_SECRET}`,
    };
    const runtimeBody = JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message },
      ],
      tools: enabledTools,
      max_tokens: 1024,
      user_id: user.id,
      credentials: connectors.credentials,
      files,
    });

    const userId = user.id;
    async function saveResult(result: any) {
      const totalTokens = (result.input_tokens || 0) + (result.output_tokens || 0);
      await supabase.from("messages").insert({
        conversation_id,
        user_id: userId,
        role: "assistant",
        content: result.content,
        token_count: totalTokens,
        metadata: {
          tools_used: result.tools_used || [],
          steps: result.steps || [],
          input_tokens: result.input_tokens || 0,
          output_tokens: result.output_tokens || 0,
        },
      });
      const { error: usageErr } = await adminClient.rpc("increment_token_usage", {
        p_user_id: userId,
        p_tokens: totalTokens,
      });
      if (usageErr) console.error("Token usage update failed:", usageErr.message);
      const { data: conv } = await supabase.from("conversations").select("title").eq("id", conversation_id).single();
      if (conv && conv.title === "New conversation") {
        await supabase.from("conversations").update({ title: message.slice(0, 60) }).eq("id", conversation_id);
      }
    }

    const runtimeUnavailable = () =>
      new Response(JSON.stringify({ error: "AI runtime unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    // The runtime answers 503 "busy" when too many people are already waiting for an answer.
    const runtimeFailure = async (res: Response) => {
      const text = await res.text();
      if (res.status === 503 && text.includes('"busy"')) {
        return new Response(JSON.stringify({ error: "busy" }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("Runtime error:", res.status, text.slice(0, 500));
      return runtimeUnavailable();
    };

    const runtimeResponse = await fetch(`${RUNTIME_URL}/v1/chat/stream`, {
      method: "POST",
      headers: runtimeHeaders,
      body: runtimeBody,
    });

    if (runtimeResponse.status === 404) {
      // Runtime not updated yet: use the non-streaming endpoint and send the answer as a single event.
      await runtimeResponse.body?.cancel();
      const legacy = await fetch(`${RUNTIME_URL}/v1/chat`, { method: "POST", headers: runtimeHeaders, body: runtimeBody });
      if (!legacy.ok) return await runtimeFailure(legacy);
      const result = await legacy.json();
      await saveResult(result);
      return new Response(sseEvent({ type: "done", result }), { headers: SSE_HEADERS });
    }

    if (!runtimeResponse.ok || !runtimeResponse.body) return await runtimeFailure(runtimeResponse);

    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    let clientGone = false;
    const send = async (chunk: Uint8Array) => {
      if (clientGone) return;
      try {
        await writer.write(chunk);
      } catch {
        // The browser left; keep reading so the answer is still saved.
        clientGone = true;
      }
    };

    const runtimeStream = runtimeResponse.body;
    const relay = (async () => {
      try {
        const outcome = await relaySse(runtimeStream, send);
        if (outcome.result) {
          await saveResult(outcome.result);
        } else if (!outcome.failed) {
          await send(encoder.encode(sseEvent({ type: "error", error: "incomplete" })));
        }
      } catch (err) {
        console.error("Stream relay error:", err instanceof Error ? err.message : "unknown");
        await send(encoder.encode(sseEvent({ type: "error", error: "relay" })));
      } finally {
        try {
          await writer.close();
        } catch {
          // Already closed by the client.
        }
      }
    })();
    // Keeps the function alive until the answer is saved, even after the response is handed back.
    (globalThis as any).EdgeRuntime?.waitUntil?.(relay);

    return new Response(readable, { headers: SSE_HEADERS });
  } catch (err) {
    console.error("Chat function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
