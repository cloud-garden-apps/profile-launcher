import type { Context } from "@netlify/functions";
import { createOAuthState } from "./_crypto";
import { corsHeaders, getCallbackUrl, handleCors, json, jsonError, requireUser } from "./_auth";

const GOOGLE_SCOPE = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/business.manage",
].join(" ");

export default async (request: Request, _context: Context) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }

  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) {
      return jsonError("Missing GOOGLE_OAUTH_CLIENT_ID", 500);
    }

    const user = await requireUser(request);
    const state = createOAuthState(user.id);
    const redirectUri = getCallbackUrl(request);

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", GOOGLE_SCOPE);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("state", state);

    return json({ authUrl: authUrl.toString(), redirectUri }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start Google OAuth";
    const status = message === "Unauthorized" || message === "Missing bearer token" ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};
