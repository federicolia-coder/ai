import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const PLAN_TOKEN_LIMITS: Record<string, number> = {
  free: 100_000,
  plus: 2_000_000,
  pro: 10_000_000,
};

function getPlanFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [Deno.env.get("STRIPE_PRICE_FREE") || ""]: "free",
    [Deno.env.get("STRIPE_PRICE_PLUS") || ""]: "plus",
    [Deno.env.get("STRIPE_PRICE_PRO") || ""]: "pro",
  };
  return priceMap[priceId] || "free";
}

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !sigPart) return false;

  const timestamp = timestampPart.slice(2);
  const expectedSig = sigPart.slice(3);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`)
  );

  const hex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hex !== expectedSig) return false;

  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (age > 300) return false;

  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items?.data?.[0]?.price?.id || "";
        const plan = getPlanFromPriceId(priceId);
        const tokenLimit = PLAN_TOKEN_LIMITS[plan] || PLAN_TOKEN_LIMITS.free;

        await adminClient
          .from("subscriptions")
          .update({
            stripe_subscription_id: subscription.id,
            plan,
            status: subscription.status,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            token_limit: tokenLimit,
          })
          .eq("stripe_customer_id", customerId);

        // Update profile plan
        const { data: sub } = await adminClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          await adminClient
            .from("profiles")
            .update({ plan })
            .eq("id", sub.user_id);

          // Update current usage period limit
          await adminClient
            .from("usage")
            .update({ token_limit: tokenLimit })
            .eq("user_id", sub.user_id)
            .lte("period_start", new Date().toISOString())
            .gt("period_end", new Date().toISOString());
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await adminClient
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            token_limit: PLAN_TOKEN_LIMITS.free,
          })
          .eq("stripe_customer_id", customerId);

        const { data: sub } = await adminClient
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          await adminClient
            .from("profiles")
            .update({ plan: "free" })
            .eq("id", sub.user_id);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: sub } = await adminClient
          .from("subscriptions")
          .select("user_id, token_limit")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          // Reset usage for new billing period
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await adminClient.from("usage").upsert(
            {
              user_id: sub.user_id,
              period_start: now.toISOString(),
              period_end: periodEnd.toISOString(),
              tokens_used: 0,
              token_limit: sub.token_limit,
            },
            { onConflict: "user_id,period_start" }
          );
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
