export const appConfig = {
  name: "ProfileLauncher",
  description: "Turn a Google Business Profile into a professional website.",

  netlify: {
    landingSiteName: "profile-launcher-landing",
    appSiteName: "profile-launcher-app",
  },

  supabase: {
    projectRef: "", // Fill after creating Supabase project
  },

  stripe: {
    // Fill after creating Stripe account for this app
  },
};
