import Stripe from "npm:stripe@16";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecret) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2024-06-20",
});

const allowOrigin = "*";

type PlanId = "pro" | "max";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowOrigin,
    },
  });
}

function resolvePriceId(inputPriceId?: string, inputPlanId?: string): string | null {
  const planId = inputPlanId === "pro" || inputPlanId === "max" ? (inputPlanId as PlanId) : null;
  const envPro = Deno.env.get("STRIPE_PRICE_PRO");
  const envMax = Deno.env.get("STRIPE_PRICE_MAX");

  if (planId === "pro") return envPro ?? inputPriceId ?? null;
  if (planId === "max") return envMax ?? inputPriceId ?? null;
  return inputPriceId ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  try {
    const { priceId, planId, userId, email } = await req.json();
    const resolvedPriceId = resolvePriceId(priceId, planId);

    if (!resolvedPriceId || !email) {
      return jsonResponse({ error: "missing_params" }, 400);
    }

    const successUrl = Deno.env.get("FRONTEND_SUCCESS_URL");
    const cancelUrl = Deno.env.get("FRONTEND_CANCEL_URL");
    if (!successUrl || !cancelUrl) {
      return jsonResponse({ error: "missing_frontend_urls" }, 500);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      customer_email: email,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId ?? "",
        planId: planId ?? "",
        priceId: resolvedPriceId,
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error("create-checkout-session error", error);
    return jsonResponse({ error: "server_error" }, 500);
  }
});
