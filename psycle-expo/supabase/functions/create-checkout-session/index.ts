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
type CheckoutPayload = {
  planId?: string;
  priceId?: string;
  userId?: string;
  email?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowOrigin,
    },
  });
}

function resolvePriceId(planId: PlanId, inputPriceId?: string): string | null {
  const envPro = Deno.env.get("STRIPE_PRICE_PRO");
  const envMax = Deno.env.get("STRIPE_PRICE_MAX");

  if (planId === "pro") return envPro ?? inputPriceId ?? null;
  if (planId === "max") return envMax ?? inputPriceId ?? null;
  return null;
}

function normalizePlanId(value?: string): PlanId | null {
  if (value === "pro" || value === "max") return value;
  return null;
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
    const payload = (await req.json()) as CheckoutPayload;
    const planId = normalizePlanId(payload.planId);
    if (!planId || !payload.userId || !payload.email) {
      return jsonResponse({ error: "missing_params" }, 400);
    }

    const resolvedPriceId = resolvePriceId(planId, payload.priceId);

    if (!resolvedPriceId) {
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
      customer_email: payload.email,
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: payload.userId,
      metadata: {
        userId: payload.userId,
        planId,
        priceId: resolvedPriceId,
      },
      subscription_data: {
        metadata: {
          userId: payload.userId,
          planId,
          priceId: resolvedPriceId,
        },
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error("create-checkout-session error", error);
    return jsonResponse({ error: "server_error" }, 500);
  }
});
