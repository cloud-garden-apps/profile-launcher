import type { Context } from "@netlify/functions";
import { corsHeaders, getAppId, handleCors, json, jsonError, requireUser } from "./auth-utils";

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

    const endpoint = new URL(`${supabaseUrl}/rest/v1/google_business_connections`);
    endpoint.searchParams.set("select", "id,updated_at,google_account_email");
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
      return jsonError("Failed to load connection status", 500);
    }

    const rows = (await response.json()) as Array<{ id: string; updated_at?: string; google_account_email?: string }>;
    if (!rows.length) {
      return json({ connected: false });
    }

    return json({
      connected: true,
      updatedAt: rows[0].updated_at || null,
      email: rows[0].google_account_email || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load connection status";
    const status = message === "Unauthorized" || message === "Missing bearer token" ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};
