# ProfileLauncher MVP Checklist

Status date: 2026-02-12

## Product target
A buyable v1 where a small business owner can connect GBP, generate a convincing site preview, pay, and understand what happens next.

## Decisions (current)
- Domain strategy for v1: launch on platform-managed subdomain only (no custom domain purchase flow yet).
- Custom domains: roadmap item after paid publish flow is stable.
- Google API uncertainty: continue feature work with mock mode while GBP allowlist is pending.

## Core flow
- [x] Landing page has clear value prop + primary CTA (`packages/landing/index.html`)
- [x] Auth + dashboard scaffold (`packages/app/src/pages/Login.tsx`, `packages/app/src/pages/Dashboard.tsx`)
- [x] Google OAuth connect/callback/status flow (`packages/api/functions/google-connect.ts`, `packages/api/functions/google-callback.ts`, `packages/api/functions/google-connection-status.ts`)
- [x] Business location picker endpoint + UI (`packages/api/functions/google-businesses.ts`, `packages/app/src/pages/Dashboard.tsx`)
- [x] Mock business mode for blocked GBP API access (`GOOGLE_BUSINESS_MOCK_MODE`)
- [x] Draft generation + visual preview (`packages/api/functions/generate-site-draft.ts`, `packages/app/src/pages/Dashboard.tsx`)
- [x] Stripe checkout initiation (`packages/api/functions/create-checkout.ts`)
- [x] Billing status endpoint + UI gating (`packages/api/functions/billing-status.ts`, `packages/app/src/pages/Dashboard.tsx`)
- [x] Stripe webhook endpoint for paid state updates (`packages/api/functions/stripe-webhook.ts`)

## Still required before “buyable”
- [ ] Run DB migration for subscriptions table in Supabase (`supabase/migrations/003_billing_subscriptions.sql`)
- [ ] Configure Stripe webhook endpoint in dashboard:
  - URL: `https://profile-launcher-app.netlify.app/.netlify/functions/stripe-webhook`
  - events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Set `STRIPE_WEBHOOK_SECRET` in Netlify env
- [ ] Confirm checkout success actually flips billing status to `pro/active`
- [ ] Implement post-purchase “publish result” behavior (currently unlocks state but no deploy artifact step)
- [ ] Legal baseline pages linked from landing/app:
  - Privacy Policy
  - Terms of Service
  - Support contact
- [ ] Error UX hardening for known external blockers (GBP allowlist/quota 0)

## Optional but recommended for near-term conversion
- [ ] Add one real testimonial or customer quote with attribution
- [ ] Add pricing explainer section to landing
- [ ] Replace placeholder/logo text once brand assets are ready

## Env checklist (MVP relevant)
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_APP_URL`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_STATE_SECRET`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_BUSINESS_MOCK_MODE` (optional, for development while blocked)
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

## Current external blocker
Google Business Profile API allowlist/quota for project `136566290599` still appears blocked (RPM = 0 in previous checks), preventing real location fetch in production.
