import type { Context } from "@netlify/functions";
import { APP_ORIGIN_FALLBACK, CHECKOUT_CANCEL_PATH, CHECKOUT_SUCCESS_PATH } from "./constants";

export default async (request: Request, context: Context) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { priceId, successUrl, cancelUrl } = await request.json();
  const resolvedPriceId = priceId || process.env.STRIPE_PRICE_ID;

  if (!resolvedPriceId) {
    return new Response(JSON.stringify({ error: "Missing Stripe price id" }), { status: 400 });
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": resolvedPriceId,
      "line_items[0][quantity]": "1",
      success_url: successUrl || `${APP_ORIGIN_FALLBACK}${CHECKOUT_SUCCESS_PATH}`,
      cancel_url: cancelUrl || `${APP_ORIGIN_FALLBACK}${CHECKOUT_CANCEL_PATH}`,
    }),
  });

  const session = await response.json();

  if (!response.ok) {
    return new Response(JSON.stringify({ error: session.error?.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" },
  });
};
