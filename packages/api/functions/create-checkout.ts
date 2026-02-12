import type { Context } from "@netlify/functions";
import { getAppId, handleCors, json, jsonError, requireUser } from "./auth-utils";
import { APP_ORIGIN_FALLBACK, CHECKOUT_CANCEL_PATH, CHECKOUT_SUCCESS_PATH } from "./constants";

export default async (request: Request, _context: Context) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return jsonError("Missing STRIPE_SECRET_KEY", 500);
  }

  try {
    const user = await requireUser(request);
    const appId = getAppId();
    const { priceId, successUrl, cancelUrl } = await request.json();
    const resolvedPriceId = priceId || process.env.STRIPE_PRICE_ID;

    if (!resolvedPriceId) {
      return jsonError("Missing Stripe price id", 400);
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "subscription",
        "line_items[0][price]": resolvedPriceId,
        "line_items[0][quantity]": "1",
        success_url: successUrl || `${APP_ORIGIN_FALLBACK}${CHECKOUT_SUCCESS_PATH}`,
        cancel_url: cancelUrl || `${APP_ORIGIN_FALLBACK}${CHECKOUT_CANCEL_PATH}`,
        "metadata[user_id]": user.id,
        "metadata[app_id]": appId,
        "subscription_data[metadata][user_id]": user.id,
        "subscription_data[metadata][app_id]": appId,
        client_reference_id: user.id,
      }),
    });

    const session = await response.json();

    if (!response.ok) {
      return jsonError(session.error?.message || "Stripe checkout creation failed", 400);
    }

    return json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout";
    const status = message === "Unauthorized" || message === "Missing bearer token" ? 401 : 500;
    return jsonError(message, status);
  }
};
