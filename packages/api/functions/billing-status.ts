import type { Context } from "@netlify/functions";
import { corsHeaders, getAppId, handleCors, json, jsonError, requireUser } from "./auth-utils";

type SubscriptionRow = {
  tier?: string;
  status?: string;
  updated_at?: string;
};

export default async (request: Request, _context: Context) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "GET") {
    return jsonError("Method not allowed", 405);
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !serviceKey) {
      return jsonError("Missing SUPABASE_URL or SUPABASE_SECRET_KEY", 500);
    }

    const user = await requireUser(request);
    const appId = getAppId();

    const endpoint = new URL(`${supabaseUrl}/rest/v1/app_subscriptions`);
    endpoint.searchParams.set("select", "tier,status,updated_at");
    endpoint.searchParams.set("user_id", `eq.${user.id}`);
    endpoint.searchParams.set("app_id", `eq.${appId}`);
    endpoint.searchParams.set("limit", "1");

    const response = await fetch(endpoint.toString(), {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes("app_subscriptions") && errorText.includes("does not exist")) {
        return json({ tier: "free", status: "inactive", canPublish: false, migrationRequired: true });
      }
      return jsonError("Failed to load billing status", 500);
    }

    const rows = (await response.json()) as SubscriptionRow[];
    const row = rows[0];

    if (!row) {
      return json({ tier: "free", status: "inactive", canPublish: false });
    }

    const tier = row.tier || "free";
    const status = row.status || "inactive";
    const canPublish = tier === "pro" && (status === "active" || status === "trialing");

    return json({
      tier,
      status,
      canPublish,
      updatedAt: row.updated_at || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load billing status";
    const status = message === "Unauthorized" || message === "Missing bearer token" ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};
