# Session Status - 2026-02-11

## What is done

- Google OAuth connect flow is live on production (`profile-launcher-app`).
- OAuth env vars are set on Netlify for the app runtime:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `GOOGLE_OAUTH_CLIENT_SECRET`
  - `GOOGLE_OAUTH_APP_URL`
  - `GOOGLE_OAUTH_REDIRECT_URI`
  - `GOOGLE_STATE_SECRET`
  - `GOOGLE_TOKEN_ENCRYPTION_KEY`
- Dashboard now supports real business selection flow:
  - new API endpoint: `/.netlify/functions/google-businesses`
  - business dropdown in Step 1
  - draft generation from selected business
- Fallback URL flow remains available for demo preview generation when GBP APIs are blocked.
- Added MVP execution checklist:
  - `MVP_CHECKLIST.md`
- Added billing foundation (code complete, needs config/migration):
  - `packages/api/functions/billing-status.ts`
  - `packages/api/functions/stripe-webhook.ts`
  - checkout metadata in `packages/api/functions/create-checkout.ts`
  - DB migration: `supabase/migrations/003_billing_subscriptions.sql`

## Current blocker

Google Business Profile API allowlist/quota is not active yet for GCP project number `136566290599`.

Observed errors from live diagnostics:
- `429 RESOURCE_EXHAUSTED`
- quota metric limit reported as `0` for:
  - `mybusinessaccountmanagement.googleapis.com`
  - `mybusinessbusinessinformation.googleapis.com`

Effect:
- OAuth shows connected
- business dropdown shows no locations
- preview from real GBP data is blocked until Google approves access

## What user already submitted

- GBP API contact form submitted (basic API access path) from Google support flow.

## Next steps (in order)

1. Wait for Google allowlist/quota approval email.
2. After approval, verify quotas are non-zero in project `136566290599`.
3. Re-test production flow:
   - connect Google
   - confirm locations appear in dropdown
   - select business
   - generate site draft
   - verify preview renders
   - verify publish button unlock behavior with draft + connection
4. Remove or down-rank fallback messaging once real GBP path is stable.

## Deployment + git notes

- Production deploy with new business-selection flow is already live.
- Local commit containing implementation:
  - `0b2e425 Add Google business selection flow for draft generation`
- Push from this machine currently fails due GitHub auth configuration (`Authentication failed` for `origin`).

## Relevant files changed in this session

- `packages/api/functions/google-businesses.ts`
- `packages/api/functions/generate-site-draft.ts`
- `packages/app/src/pages/Dashboard.tsx`
- `packages/app/src/config/constants.ts`
- `packages/app/src/i18n/en.ts`
