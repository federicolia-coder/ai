import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const CONFIRM_WORD = "ELIMINA";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Deletes the signed-in user: Stripe subscription first, then files, then the auth user (rows cascade). */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== CONFIRM_WORD) return json({ error: "Confirmation required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    // A paying user must not keep being charged after the account is gone: stop if Stripe fails.
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub?.stripe_subscription_id && sub.status !== "canceled") {
      if (!STRIPE_SECRET_KEY) {
        console.error("delete-account: STRIPE_SECRET_KEY missing, cannot cancel", user.id);
        return json({ error: "Subscription cancel failed" }, 502);
      }
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(sub.stripe_subscription_id)}`, {
        method: "DELETE",
        headers: { Authorization: `Basic ${btoa(STRIPE_SECRET_KEY + ":")}` },
      });
      // 404: already gone on Stripe's side, nothing left to charge.
      if (!res.ok && res.status !== 404) {
        console.error("delete-account: Stripe cancel failed", res.status, (await res.text()).slice(0, 300));
        return json({ error: "Subscription cancel failed" }, 502);
      }
    }

    const { data: files, error: listError } = await admin.rpc("user_storage_paths", { p_user_id: user.id });
    if (listError) {
      console.error("delete-account: listing files failed", listError.message);
      return json({ error: "Delete failed" }, 500);
    }
    const byBucket = new Map<string, string[]>();
    for (const f of (files ?? []) as { bucket_id: string; name: string }[]) {
      byBucket.set(f.bucket_id, [...(byBucket.get(f.bucket_id) ?? []), f.name]);
    }
    for (const [bucket, names] of byBucket) {
      for (let i = 0; i < names.length; i += 100) {
        const { error } = await admin.storage.from(bucket).remove(names.slice(i, i + 100));
        if (error) {
          console.error("delete-account: removing files failed", bucket, error.message);
          return json({ error: "Delete failed" }, 500);
        }
      }
    }

    // Profile, conversations, messages, usage, connectors and the rest are removed by ON DELETE CASCADE.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("delete-account: deleteUser failed", deleteError.message);
      return json({ error: "Delete failed" }, 500);
    }

    return json({ deleted: true });
  } catch (err) {
    console.error("delete-account error:", err instanceof Error ? err.message : "unknown");
    return json({ error: "Internal server error" }, 500);
  }
});
