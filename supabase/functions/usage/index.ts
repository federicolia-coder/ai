import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

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

    const { data: usage } = await supabase
      .from("usage")
      .select("*")
      .order("period_start", { ascending: false })
      .limit(1);

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status, token_limit, current_period_start, current_period_end")
      .limit(1);

    const current = usage?.[0];
    const sub = subscription?.[0];

    return new Response(
      JSON.stringify({
        tokens_used: current?.tokens_used || 0,
        token_limit: current?.token_limit || 100000,
        tokens_remaining: Math.max(
          0,
          (current?.token_limit || 100000) - (current?.tokens_used || 0)
        ),
        period_start: current?.period_start,
        period_end: current?.period_end,
        plan: sub?.plan || "free",
        status: sub?.status || "active",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Usage error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
