import type { Context } from "@netlify/functions";

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
      success_url: successUrl || "https://profile-launcher-app.netlify.app/?success=true",
      cancel_url: cancelUrl || "https://profile-launcher-app.netlify.app/?canceled=true",
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
