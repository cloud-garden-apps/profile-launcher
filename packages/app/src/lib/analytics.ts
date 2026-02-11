const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.posthog.com";

export const track = (event: string, properties?: Record<string, unknown>) => {
  if (!POSTHOG_KEY) return;

  fetch(`${POSTHOG_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event,
      properties: { ...properties, $current_url: window.location.href },
      timestamp: new Date().toISOString(),
    }),
  }).catch(console.error);
};

export const identify = (userId: string, traits?: Record<string, unknown>) => {
  if (!POSTHOG_KEY) return;

  fetch(`${POSTHOG_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event: "$identify",
      distinct_id: userId,
      $set: traits,
    }),
  }).catch(console.error);
};
