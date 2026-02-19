import Stripe from "npm:stripe@16";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PlanId = "pro" | "max";

const allowOrigin = "*";
const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const stripePricePro = Deno.env.get("STRIPE_PRICE_PRO");
const stripePriceMax = Deno.env.get("STRIPE_PRICE_MAX");

if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");
if (!webhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
const supabase = createClient(supabaseUrl, serviceRoleKey);

function responseJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowOrigin,
    },
  });
}

function resolvePlanIdFromPriceId(priceId?: string | null): PlanId | null {
  if (!priceId) return null;
  if (stripePricePro && priceId === stripePricePro) return "pro";
  if (stripePriceMax && priceId === stripePriceMax) return "max";
  return null;
}

function resolvePlanIdFromMetadata(metadata?: Stripe.Metadata): PlanId | null {
  const candidate = metadata?.planId ?? metadata?.plan;
  if (candidate === "pro" || candidate === "max") return candidate;
  return null;
}

async function updateProfilePlan(userId: string, planId: "free" | PlanId, activeUntil: string | null) {
  const { error } = await supabase
    .from("profiles")
    .update({
      plan_id: planId,
      active_until: activeUntil,
    })
    .eq("id", userId);
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Headers": "content-type,stripe-signature",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return responseJson({ error: "method_not_allowed" }, 405);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return responseJson({ error: "missing_signature" }, 400);
  }

  try {
    const payload = await req.text();
    const event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.metadata?.uid || session.client_reference_id || null;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;

      if (!userId || !subscriptionId) {
        return responseJson({ received: true, skipped: "missing_user_or_subscription" });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price?.id ?? session.metadata?.priceId ?? null;
      const metadataPlanId = resolvePlanIdFromMetadata(session.metadata);
      const planId = metadataPlanId ?? resolvePlanIdFromPriceId(priceId);

      if (!planId) {
        console.error("[stripe-webhook] Unknown plan mapping", { eventType: event.type, priceId, userId });
        return responseJson({ received: true, skipped: "unknown_price_id" });
      }

      const activeUntil = new Date(subscription.current_period_end * 1000).toISOString();
      await updateProfilePlan(userId, planId, activeUntil);
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (!subscriptionId) {
        return responseJson({ received: true, skipped: "missing_subscription" });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId || null;
      const fallbackUserId = subscription.metadata?.uid || null;
      const resolvedUserId = userId ?? fallbackUserId;
      if (!resolvedUserId) {
        return responseJson({ received: true, skipped: "missing_user_id" });
      }

      const metadataPlanId = resolvePlanIdFromMetadata(subscription.metadata);
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const planId = metadataPlanId ?? resolvePlanIdFromPriceId(priceId);
      if (!planId) {
        console.error("[stripe-webhook] Unknown plan mapping", { eventType: event.type, priceId, userId });
        return responseJson({ received: true, skipped: "unknown_price_id" });
      }

      const activeUntil = new Date(subscription.current_period_end * 1000).toISOString();
      await updateProfilePlan(resolvedUserId, planId, activeUntil);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId || subscription.metadata?.uid || null;
      if (!userId) {
        return responseJson({ received: true, skipped: "missing_user_id" });
      }

      await updateProfilePlan(userId, "free", null);
    }

    return responseJson({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] Error:", error);
    return responseJson({ error: "invalid_webhook" }, 400);
  }
});
