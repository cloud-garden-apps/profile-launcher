import type { Context } from "@netlify/functions";

type AuthenticatedUser = {
  id: string;
  email?: string;
};

const getBearerToken = (request: Request): string | null => {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

export const requireUser = async (request: Request): Promise<AuthenticatedUser> => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  const token = getBearerToken(request);

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  }
  if (!token) {
    throw new Error("Missing bearer token");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  const user = await response.json();
  return { id: user.id, email: user.email };
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const handleCors = (request: Request): Response | null => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
};

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const jsonError = (message: string, status = 400): Response =>
  json({ error: message }, status);

export const getAppId = (): string => process.env.APP_ID || process.env.VITE_APP_ID || "profile-launcher";

export const resolveAppOrigin = (request: Request): string => {
  const explicit = process.env.GOOGLE_OAUTH_APP_URL;
  if (explicit) return explicit;

  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "https";
  if (!host) return "https://profile-launcher-app.netlify.app";
  return `${proto}://${host}`;
};

export const getCallbackUrl = (request: Request): string => {
  const explicit = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (explicit) return explicit;
  return `${resolveAppOrigin(request)}/.netlify/functions/google-callback`;
};
