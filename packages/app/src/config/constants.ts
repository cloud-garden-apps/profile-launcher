export const APP_NAME = "ProfileLauncher";
export const APP_ORIGIN_FALLBACK = "https://profile-launcher-app.netlify.app";

export const API_ROUTES = {
  googleConnectionStatus: "/.netlify/functions/google-connection-status",
  googleConnect: "/.netlify/functions/google-connect",
  googleBusinesses: "/.netlify/functions/google-businesses",
  billingStatus: "/.netlify/functions/billing-status",
  generateSiteDraft: "/.netlify/functions/generate-site-draft",
  createCheckout: "/.netlify/functions/create-checkout",
} as const;
