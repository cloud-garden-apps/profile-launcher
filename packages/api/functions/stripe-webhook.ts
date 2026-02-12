import type { Context } from "@netlify/functions";
import { createHmac, timingSafeEqual } from "crypto";
import { getAppId } from "./auth-utils";

type StripeEvent = {
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
};

const toString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const parseStripeSignature = (header: string): { timestamp: string; signature: string } | null => {
  const parts = header.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signature = parts.find((part) => part.startsWith("v1="))?.slice(3);
  if (!timestamp || !signature) return null;
  return { timestamp, signature };
};

const verifyStripeSignature = (payload: string, header: string, secret: string): boolean => {
  const parsed = parseStripeSignature(header);
  if (!parsed) return false;

  const signedPayload = `${parsed.timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(parsed.signature, "hex");

  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
};

const upsertSubscription = async (payload: {
  userId: string;
  appId: string;
  tier: string;
  status: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCheckoutSessionId?: string | null;
}) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/app_subscriptions?on_conflict=user_id,app_id`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      {
        user_id: payload.userId,
        app_id: payload.appId,
        tier: payload.tier,
        status: payload.status,
        stripe_customer_id: payload.stripeCustomerId || null,
        stripe_subscription_id: payload.stripeSubscriptionId || null,
        stripe_checkout_session_id: payload.stripeCheckoutSessionId || null,
        updated_at: new Date().toISOString(),
      },
    ]),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to upsert subscription: ${detail}`);
  }
};

export default async (request: Request, _context: Context) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing STRIPE_WEBHOOK_SECRET" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const signatureHeader = request.headers.get("stripe-signature");
  if (!signatureHeader) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await request.text();
  if (!verifyStripeSignature(payload, signatureHeader, webhookSecret)) {
    return new Response(JSON.stringify({ error: "Invalid Stripe signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const event = JSON.parse(payload) as StripeEvent;
    const appIdFallback = getAppId();

    if (event.type === "checkout.session.completed") {
      const object = (event.data?.object || {}) as Record<string, unknown>;
      const metadata = (object.metadata || {}) as Record<string, unknown>;
      const userId = toString(metadata.user_id);
      const appId = toString(metadata.app_id) || appIdFallback;
      if (!userId) {
        return new Response(JSON.stringify({ ok: true, skipped: "missing_user_id" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      await upsertSubscription({
        userId,
        appId,
        tier: "pro",
        status: "active",
        stripeCustomerId: toString(object.customer),
        stripeSubscriptionId: toString(object.subscription),
        stripeCheckoutSessionId: toString(object.id),
      });
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const object = (event.data?.object || {}) as Record<string, unknown>;
      const metadata = (object.metadata || {}) as Record<string, unknown>;
      const userId = toString(metadata.user_id);
      const appId = toString(metadata.app_id) || appIdFallback;
      if (!userId) {
        return new Response(JSON.stringify({ ok: true, skipped: "missing_user_id" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const status = toString(object.status) || "inactive";
      const paid = status === "active" || status === "trialing";

      await upsertSubscription({
        userId,
        appId,
        tier: paid ? "pro" : "free",
        status,
        stripeCustomerId: toString(object.customer),
        stripeSubscriptionId: toString(object.id),
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
