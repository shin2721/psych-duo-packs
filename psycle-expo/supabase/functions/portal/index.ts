import Stripe from "npm:stripe@16";

const allowOrigin = "*";
const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowOrigin,
    },
  });
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
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return jsonResponse({ error: "missing_email" }, 400);
    }

    const frontendSuccessUrl = Deno.env.get("FRONTEND_SUCCESS_URL");
    const frontendCancelUrl = Deno.env.get("FRONTEND_CANCEL_URL");
    const returnUrl = frontendSuccessUrl ?? frontendCancelUrl;
    if (!returnUrl) {
      return jsonResponse({ error: "missing_frontend_urls" }, 500);
    }

    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });
    const customer = customers.data[0];

    if (!customer) {
      return jsonResponse({ error: "customer_not_found" }, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error("[portal] Error:", error);
    return jsonResponse({ error: "server_error" }, 500);
  }
});
