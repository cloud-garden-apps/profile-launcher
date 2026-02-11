import type { Context } from "@netlify/functions";
import { corsHeaders, getAppId, handleCors, json, jsonError, requireUser } from "./auth-utils";
import { decryptToken } from "./crypto-utils";

type ConnectionRow = {
  refresh_token_ciphertext: string;
  refresh_token_iv: string;
  refresh_token_tag: string;
};

type OAuthRefreshResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type BusinessOption = {
  id: string;
  name: string;
  accountName: string;
  websiteUri: string | null;
  phone: string | null;
  address: string | null;
};

const readConnection = async (supabaseUrl: string, serviceKey: string, userId: string, appId: string): Promise<ConnectionRow | null> => {
  const endpoint = new URL(`${supabaseUrl}/rest/v1/google_business_connections`);
  endpoint.searchParams.set("select", "refresh_token_ciphertext,refresh_token_iv,refresh_token_tag");
  endpoint.searchParams.set("user_id", `eq.${userId}`);
  endpoint.searchParams.set("app_id", `eq.${appId}`);
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint.toString(), {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load Google connection");
  }

  const rows = (await response.json()) as ConnectionRow[];
  return rows[0] || null;
};

const getAccessTokenFromRefreshToken = async (refreshToken: string): Promise<string> => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = (await response.json()) as OAuthRefreshResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(`Google token refresh failed: ${data.error || "unknown_error"}`);
  }

  return data.access_token;
};

const formatAddress = (address: Record<string, unknown> | null | undefined): string | null => {
  if (!address) return null;
  const lines = Array.isArray(address.addressLines) ? (address.addressLines as string[]) : [];
  const locality = typeof address.locality === "string" ? address.locality : "";
  const region = typeof address.administrativeArea === "string" ? address.administrativeArea : "";
  const postal = typeof address.postalCode === "string" ? address.postalCode : "";
  const country = typeof address.regionCode === "string" ? address.regionCode : "";
  const parts = [...lines, [locality, region, postal].filter(Boolean).join(" "), country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

const extractBusinessOptions = (payload: Record<string, unknown>): BusinessOption[] => {
  const locations = Array.isArray(payload.locations) ? payload.locations : [];
  return locations
    .map((raw): BusinessOption | null => {
      const location = raw as Record<string, unknown>;
      const id = typeof location.name === "string" ? location.name : null;
      const name = typeof location.title === "string" ? location.title : null;
      if (!id || !name) return null;

      const storefrontAddress =
        typeof location.storefrontAddress === "object" && location.storefrontAddress
          ? (location.storefrontAddress as Record<string, unknown>)
          : null;
      const phoneNumbers =
        typeof location.phoneNumbers === "object" && location.phoneNumbers
          ? (location.phoneNumbers as Record<string, unknown>)
          : null;

      const primaryPhone =
        phoneNumbers && typeof phoneNumbers.primaryPhone === "string"
          ? (phoneNumbers.primaryPhone as string)
          : null;

      return {
        id,
        name,
        accountName: id.split("/locations/")[0] || "account",
        websiteUri: typeof location.websiteUri === "string" ? location.websiteUri : null,
        phone: primaryPhone,
        address: formatAddress(storefrontAddress),
      };
    })
    .filter((item): item is BusinessOption => Boolean(item));
};

const fetchAccountLocations = async (accessToken: string): Promise<BusinessOption[]> => {
  const accountsResponse = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!accountsResponse.ok) {
    const detail = await accountsResponse.text();
    throw new Error(`Failed to load Google Business accounts: ${detail}`);
  }

  const accountsPayload = (await accountsResponse.json()) as { accounts?: Array<{ name?: string }> };
  const accounts = accountsPayload.accounts || [];
  const businesses: BusinessOption[] = [];

  for (const account of accounts) {
    if (!account.name) continue;
    const locationsUrl = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`);
    locationsUrl.searchParams.set("readMask", "name,title,websiteUri,phoneNumbers,storefrontAddress");
    locationsUrl.searchParams.set("pageSize", "100");

    const locationsResponse = await fetch(locationsUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!locationsResponse.ok) {
      continue;
    }

    const payload = (await locationsResponse.json()) as Record<string, unknown>;
    businesses.push(...extractBusinessOptions(payload));
  }

  return businesses;
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
    const connection = await readConnection(supabaseUrl, serviceKey, user.id, appId);

    if (!connection) {
      return json({ connected: false, businesses: [] });
    }

    const refreshToken = decryptToken({
      ciphertext: connection.refresh_token_ciphertext,
      iv: connection.refresh_token_iv,
      tag: connection.refresh_token_tag,
    });

    const accessToken = await getAccessTokenFromRefreshToken(refreshToken);
    const businesses = await fetchAccountLocations(accessToken);

    return json({ connected: true, businesses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load businesses";
    const status = message === "Unauthorized" || message === "Missing bearer token" ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};
