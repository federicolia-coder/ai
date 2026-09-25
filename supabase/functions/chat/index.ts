import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const RUNTIME_URL = Deno.env.get("TARRY_RUNTIME_URL") || "";
const RUNTIME_SECRET = Deno.env.get("TARRY_RUNTIME_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Check token usage
    const { data: usage } = await adminClient
      .from("usage")
      .select("*")
      .eq("user_id", user.id)
      .lte("period_start", new Date().toISOString())
      .gt("period_end", new Date().toISOString())
      .single();

    if (!usage) {
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

    // Load conversation history
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(10);

    // Load user's enabled plugins
    const { data: userPlugins } = await supabase
      .from("user_plugins")
      .select("plugin_id, plugins(name, tools, permissions)")
      .eq("user_id", user.id)
      .eq("enabled", true);

    const enabledTools: string[] = [];
    if (userPlugins) {
      for (const up of userPlugins) {
        const plugin = (up as any).plugins;
        if (plugin?.tools) {
          enabledTools.push(...plugin.tools);
        }
      }
    }

    // Also add default-enabled plugins if user hasn't configured them
    const { data: defaultPlugins } = await adminClient
      .from("plugins")
      .select("tools")
      .eq("enabled_by_default", true);

    if (defaultPlugins) {
      for (const dp of defaultPlugins) {
        for (const tool of dp.tools) {
          if (!enabledTools.includes(tool)) {
            enabledTools.push(tool);
          }
        }
      }
    }

    // Call Tarry Runtime
    const runtimeResponse = await fetch(`${RUNTIME_URL}/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RUNTIME_SECRET}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: [
              "Sei Tarry, assistente AI di TestardStudios. Il tuo nome è Tarry.",
              "",
              "Rispondi SEMPRE nella lingua dell'utente. In italiano usa accenti corretti (è, é, à, ò, ù).",
              "",
              "Rispondi in modo completo e utile. Non dare risposte di una sola frase quando la domanda merita una spiegazione. Aggiungi contesto, esempi o dettagli quando appropriato.",
              "",
              "Per domande personali su di te: Mi chiamo Tarry, sono un assistente AI creato da TestardStudios. Sono qui per aiutarti con domande, calcoli, codice e ricerche.",
              "",
              "Per matematica: mostra i passaggi. Per codice: usa blocchi markdown con il linguaggio (```python, ```js). Se non sai qualcosa, dillo.",
              "",
              "IMPORTANTE: Quando l'utente chiede notizie, eventi recenti, aggiornamenti, meteo, risultati sportivi o qualsiasi informazione che cambia nel tempo, USA SEMPRE lo strumento 'search' per cercare sul web informazioni aggiornate. Non inventare notizie e non dire che non puoi accedere a internet. Cerca e riporta i risultati.",
            ].join("\n"),
          },
          ...(history || []).map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
          { role: "user", content: message },
        ],
        tools: enabledTools,
        max_tokens: 2048,
        user_id: user.id,
      }),
    });

    if (!runtimeResponse.ok) {
      const errorText = await runtimeResponse.text();
      console.error("Runtime error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI runtime unavailable" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await runtimeResponse.json();

    // Save assistant message
    await supabase.from("messages").insert({
      conversation_id,
      user_id: user.id,
      role: "assistant",
      content: result.content,
      token_count: result.total_tokens || 0,
      metadata: {
        tools_used: result.tools_used || [],
        steps: result.steps || [],
        input_tokens: result.input_tokens || 0,
        output_tokens: result.output_tokens || 0,
      },
    });

    // Update token usage atomically
    const totalTokens = (result.input_tokens || 0) + (result.output_tokens || 0);
    await adminClient.rpc("increment_token_usage", {
      p_user_id: user.id,
      p_tokens: totalTokens,
    });

    // Update conversation title if it's still default
    const { data: conv } = await supabase
      .from("conversations")
      .select("title")
      .eq("id", conversation_id)
      .single();

    if (conv && conv.title === "New conversation") {
      await supabase
        .from("conversations")
        .update({ title: message.slice(0, 60) })
        .eq("id", conversation_id);
    }

    return new Response(
      JSON.stringify({
        content: result.content,
        token_count: totalTokens,
        metadata: {
          tools_used: result.tools_used || [],
          steps: result.steps || [],
          input_tokens: result.input_tokens || 0,
          output_tokens: result.output_tokens || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Chat function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
