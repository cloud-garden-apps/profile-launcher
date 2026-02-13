export const APP_ORIGIN_FALLBACK = "https://profile-launcher-app.netlify.app";
export const GOOGLE_CALLBACK_PATH = "/.netlify/functions/google-callback";

export const CHECKOUT_SUCCESS_PATH = "/?checkout=success";
export const CHECKOUT_CANCEL_PATH = "/?checkout=cancelled";

export const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash";

export type StripeMode = "test" | "live";

export const normalizeStripeMode = (value: string | undefined): StripeMode | null => {
  if (value === "test" || value === "live") return value;
  return null;
};

export const inferStripeModeFromSecretKey = (secretKey: string | undefined): StripeMode | null => {
  if (!secretKey) return null;
  if (secretKey.startsWith("sk_test_")) return "test";
  if (secretKey.startsWith("sk_live_")) return "live";
  return null;
};
