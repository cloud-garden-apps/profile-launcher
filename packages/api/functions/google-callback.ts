import type { Context } from "@netlify/functions";
import { encryptToken, verifyOAuthState } from "./_crypto";
import { getAppId, getCallbackUrl, resolveAppOrigin } from "./_auth";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
  id_token?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
};

const redirectWithStatus = (origin: string, status: string): Response =>
  Response.redirect(`${origin}/?google=${encodeURIComponent(status)}`, 302);

const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUserInfo> => {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) return {};
  return (await response.json()) as GoogleUserInfo;
};

export default async (request: Request, _context: Context) => {
  const appOrigin = resolveAppOrigin(request);
  try {
    const url = new URL(request.url);
    const error = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (error) {
      return redirectWithStatus(appOrigin, `oauth_error:${error}`);
    }
    if (!code || !state) {
      return redirectWithStatus(appOrigin, "oauth_error:missing_code_or_state");
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SECRET_KEY;

    if (!clientId || !clientSecret || !supabaseUrl || !serviceKey) {
      return redirectWithStatus(appOrigin, "oauth_error:missing_server_config");
    }

    const statePayload = verifyOAuthState(state);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: getCallbackUrl(request),
      }),
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || tokenData.error) {
      return redirectWithStatus(appOrigin, "oauth_error:token_exchange_failed");
    }

    if (!tokenData.refresh_token) {
      return redirectWithStatus(appOrigin, "oauth_error:missing_refresh_token");
    }

    const encrypted = encryptToken(tokenData.refresh_token);
    const userInfo = tokenData.access_token ? await fetchGoogleUserInfo(tokenData.access_token) : {};

    const row = {
      user_id: statePayload.u,
      app_id: getAppId(),
      google_account_sub: userInfo.sub || null,
      google_account_email: userInfo.email || null,
      refresh_token_ciphertext: encrypted.ciphertext,
      refresh_token_iv: encrypted.iv,
      refresh_token_tag: encrypted.tag,
      token_scope: tokenData.scope || null,
      token_type: tokenData.token_type || null,
      expires_at: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    };

    const upsert = await fetch(
      `${supabaseUrl}/rest/v1/google_business_connections?on_conflict=user_id,app_id`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify([row]),
      }
    );

    if (!upsert.ok) {
      return redirectWithStatus(appOrigin, "oauth_error:storage_failed");
    }

    return redirectWithStatus(appOrigin, "connected");
  } catch (_error) {
    return redirectWithStatus(resolveAppOrigin(request), "oauth_error:unexpected");
  }
};
