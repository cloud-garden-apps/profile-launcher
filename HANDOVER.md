# ProfileLauncher — Handover

## Latest Update (February 14, 2026)

### What was shipped in this session
- **Fun With Kids site deployed to Netlify** at `funwithkidsfdc.com.au`
  - DNS configured: ALIAS record for apex → `apex-loadbalancer.netlify.com`, CNAME for www
  - HTTPS via Let's Encrypt (auto-provisioning after DNS propagation)
  - Awaiting DNS propagation — should be live within minutes (TTL set to 60s)
- Updated `seo.baseUrl` in site-data.json to `https://funwithkidsfdc.com.au`
- Curated photos from 99 → 46 (removed unwanted Takeout photos from source)
- Updated site-data.json to only reference the 46 remaining photos
- Build script now gracefully skips missing source photos instead of crashing
- **Image strategy simplified**: photos are included in the Netlify build output (served via Netlify CDN). No Supabase Storage needed — Netlify IS the CDN.
- Domain purchased: `profilelauncher.com` (owned), `funwithkidsfdc.com.au` (owned)

### Previous session (February 13, 2026)
- Created `packages/site` — React SSG outputting static HTML with Tailwind
- Site-agnostic architecture: components, page templates, data contract, build pipeline
- Feature/page toggles in data model
- Loaded Fun With Kids GBP Takeout data: 20 reviews, business details, hours, services
- Home page as overview with preview subsets and links to full pages

### Current preview/build commands
- Build: `yarn workspace site build`
- Local preview: `python3 -m http.server 4173 --directory packages/site/dist`
- **Live**: `https://funwithkidsfdc.com.au` (once DNS propagates)

### Deployment method (Fun With Kids)
- Build locally with `yarn workspace site build`
- Drag & drop `packages/site/dist/` to Netlify dashboard
- Photos are copied from local Takeout folder into dist at build time (not in git)

### Immediate next steps
1. **Verify funwithkidsfdc.com.au is live** — check DNS propagation and HTTPS cert
2. **Purchase Cloud Garden domain** — needed as the parent brand referenced by ProfileLauncher
3. **Upgrade Supabase to Pro** — production-ready auth/database
4. **Update auth config to point to Pro Cloud Garden Supabase URL** — currently on free tier
5. **Design and ship ProfileLauncher landing page** to `profilelauncher.com` — needs to reference Cloud Garden as parent brand, not yet designed
6. **Update Fun With Kids GBP website URL** — change from careforkids.com.au to funwithkidsfdc.com.au
7. **Re-apply for GBP API access** — the live site on a real domain should unblock the application

### Later improvements (not launch blockers)
- Improve the site template — polish design, refine copy, improve mobile experience
- Consider multiple templates
- Dashboard feature toggles for customers

## The Big Picture: Cloud Garden / App Factory

ProfileLauncher is an app built using the **Cloud Garden App Template** — a SaaS template for rapidly building web apps. The wider vision is an AI-powered "app factory" (see `/Users/jonathan/Sites/app-fab-2/HANDOVER.md`) that builds SaaS apps autonomously. ProfileLauncher is the first real app built on this template.

### Cloud Garden Template Stack
- **Monorepo**: `packages/landing` (marketing), `packages/app` (React SPA), `packages/api` (Netlify Functions)
- **Auth**: Supabase Auth
- **Database**: Supabase (Postgres)
- **Payments**: Stripe
- **Hosting**: Netlify (landing + app + API)
- **Storage**: Supabase Storage (for images — see Image Strategy below)

## What is ProfileLauncher?

**Turn a Google Business Profile into a professional website.** The flow:
1. User connects their Google Business Profile via OAuth
2. ProfileLauncher pulls their business data (name, hours, reviews, photos, services, description)
3. Generates a website draft (AI-assisted)
4. User reviews/edits, pays, publishes

### Current State (as of Feb 2025)

The app has:
- Landing page at `packages/landing` (static HTML + Tailwind)
- React app at `packages/app` with Dashboard (connect GBP, generate draft, preview, checkout flow)
- API functions at `packages/api` (billing, checkout, site draft generation)
- Google OAuth connection flow (implemented)
- Stripe billing integration (implemented, test mode)
- Mock draft generation fallback (works without GBP API)

**Problem:** The Google Business Profile API application was **denied**. Google requires the applicant to have a GBP with a website that demonstrates the use case. This is a chicken-and-egg problem — we're building the tool TO make these websites, but need a website first.

## The GBP API Unblock Strategy

Jonathan's mum runs **"Fun With Kids Wellbeing Family Day Care Centre"** in Reedy Creek (Gold Coast), QLD, Australia. This is a real business with:
- A verified Google Business Profile
- 20 five-star reviews (spanning 2018-2025)
- ~104 photos
- 2 local posts
- Full business data (hours, services, description, address)
- Currently the GBP website field points to a third-party listing (careforkids.com.au)

**Plan:** Build a proper website for Fun With Kids using ProfileLauncher's site template, deploy it on a custom domain, update the GBP website URL to point to it. This demonstrates the product working end-to-end and should unblock the GBP API application.

### GBP Takeout Data Location

All exported data is at:
```
/Users/jonathan/Documents/Business/Fun with kids wellbeing FDC/Takeout/Google Business Profile/
```

Key files:
- `account-.../location-.../data.json` — business name, phone, address, hours, services, description
- `account-.../location-.../reviews.json` — 20 five-star reviews with full text
- `account-.../location-.../additionalData.json` — structured attributes, lat/lng, vanity name
- `account-.../location-.../localPost-*/data.json` — 2 local posts with descriptions
- `account-.../location-.../*.jpeg` — ~104 business photos
- `account-.../location-.../media-*.json` — metadata for each photo

### Fun With Kids Business Details
- **Name**: Fun With Kids Wellbeing Family Day Care Centre
- **Owner/Educator**: Rachel (Holmes) — 30+ years early childhood experience
- **Address**: 21 Observatory Drive, Reedy Creek QLD 4227
- **Phone**: 0422 569 930
- **Hours**: Mon-Fri 7:30am - 5:30pm
- **Category**: Family day care service
- **Service area**: Gold Coast QLD, Tweed Heads NSW
- **Services**: Education & Developmental programs, Sun Safe Aware, Sleep Safe (SIDS), Child Protection Aware, Allergy Aware, Meeting National Quality Standard
- **Registered with**: Beaucare Family Day Care scheme (operating since April 1993)
- **Philosophy**: Montessori-affiliated, holistic approach (physical, mental, emotional, spiritual-moral), play-based learning, "boutique incubator" concept
- **GBP vanity name**: FunWithKidsFamilyDayCare
- **Lat/Lng**: -28.1134827, 153.3984918

## Architecture: `packages/site`

### Decision: Single Platform (not standalone repos)

All generated websites run from one codebase. The difference between sites is **data, not code**. This means:
- One template, many sites
- No repo-per-customer nightmare
- Consistent quality and updates across all sites

### Tech Choice: Vite + React with Static Pre-rendering (SSG)

- **Vite** for build tooling
- **React** for component-based templating (consistent with the app package)
- **Static pre-rendering** at build time — NOT an SPA. Each page is a real HTML file for SEO
- **Tailwind** for styling
- Pages are determined by data — some GBPs will have 3 pages, some 7. The template adapts.

### Proposed Site Structure

```
packages/site/
  src/
    components/       # Reusable sections (Hero, Reviews, Gallery, Hours, etc.)
    pages/            # Page templates (Home, About, Services, Reviews, Contact)
    data/
      site-data.json  # The data contract — GBP data in a clean schema
    styles/
  public/
    (no images in repo — see Image Strategy)
  vite.config.ts
```

### Site Data Schema (the contract)

This JSON schema is what ProfileLauncher produces for every customer. For now, manually populated from Takeout data. Later, auto-populated from GBP API.

```typescript
type SiteData = {
  business: {
    name: string
    tagline: string           // derived from description or AI-generated
    description: string       // from GBP profile.description
    phone: string
    email?: string
    address: {
      street: string
      locality: string
      state: string
      postCode: string
      country: string
    }
    coordinates: { lat: number, lng: number }
    hours: Array<{ day: string, open: string, close: string }>
    serviceArea: string[]
    category: string
  }
  services: Array<{ name: string, description?: string }>
  reviews: Array<{
    author: string
    rating: number
    text: string
    date: string
    reply?: { text: string, date: string }
  }>
  photos: Array<{
    url: string              // CDN URL (Supabase Storage)
    alt: string
    category?: string        // e.g. 'exterior', 'interior', 'activity'
  }>
  posts: Array<{
    title?: string
    summary: string
    date: string
    photos?: string[]
  }>
  pages: string[]            // which pages to render, e.g. ['home', 'about', 'services', 'reviews', 'contact']
  theme?: {
    primaryColor?: string    // buttons, headings
    accentColor?: string     // highlights, hover states
    style?: string           // future: 'warm' | 'modern' | 'classic' | 'bold'
  }
}
```

### Suggested Pages for Fun With Kids

1. **Home** — Hero with tagline, key services, featured reviews, CTA
2. **About** — Rachel's story, philosophy, Montessori approach, qualifications
3. **Services** — All 6 services with descriptions, the "boutique incubator" concept
4. **Reviews** — All 20 five-star reviews (these are gold — incredibly warm testimonials)
5. **Contact** — Phone, address, hours, embedded Google Map, service area

## Image Strategy

### Problem
Storing images in the git repo will balloon it. Google photo URLs from Takeout may expire. Hotlinking Google Photos is unreliable (URLs are not stable, may be blocked).

### Solution: Supabase Storage

One shared Supabase project serves all Cloud Garden apps. Use **Supabase Storage** (includes CDN).

**Bucket path** — use UUIDs to avoid name collisions:
```
cloud-garden-assets/                    # single public bucket
  profile-launcher/                     # app namespace
    sites/{site-uuid}/                  # UUID per published site
      hero.jpg
      gallery-001.jpg
```

UUID over slug: no collisions, no rename issues, no encoding problems.

**Shared Supabase risk:** One project = shared Postgres, Auth, Storage across ALL Cloud Garden apps. Fine while small (<10 apps). If storage/traffic grows, split later or move images to Cloudflare R2 (S3-compatible, cheap). Don't prematurely split.

### For Fun With Kids
1. Upload curated ~15-20 best photos to Supabase Storage under `profile-launcher/sites/{uuid}/`
2. Reference via Supabase CDN URLs in site-data.json
3. Full 104 photos stay in Takeout as source archive

## Domain Strategy

### Decision: Custom domains only (no subdomains)

Considered `funwithkids.profilelauncher.com` but decided against subdomains because:
- **Fraud risk**: ProfileLauncher would own all content on its subdomains
- **Brand dilution**: Businesses want their own identity
- **Legal liability**: Hosting customer content under your domain is risky
- **SEO**: Custom domains are better for local SEO

**Approach**: All published sites must have their own domain. ProfileLauncher helps with domain setup but doesn't host under its own domain.

For preview/draft, a temporary `*.netlify.app` URL is fine. But published sites need a real domain.

### For Fun With Kids
Need a proper domain for the GBP API application. Suggestions:
- `funwithkidsfdc.com.au`
- `funwithkidsdaycare.com.au`
- `funwithkidswellbeing.com.au`

A `.com.au` domain looks legitimate for an Australian business and will help the GBP API application. Register one, point DNS to Netlify, configure custom domain on the Netlify site.

## Deployment Architecture — How Sites Get Hosted

```
┌─────────────────────────────────────────────────────────────────┐
│                    NETLIFY SITES (separate)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. profile-launcher-landing    → www.profilelauncher.com        │
│     (packages/landing)            Static HTML marketing page     │
│                                                                   │
│  2. profile-launcher-app        → app.profilelauncher.com        │
│     (packages/app + api)          React SPA + Netlify Functions  │
│                                                                   │
│  3. fun-with-kids-site          → funwithkidsfdc.com.au          │
│     (packages/site)               Static HTML (SSG from React)   │
│     built with FWK data                                          │
│                                                                   │
│  4. future-customer-site        → theircustomdomain.com          │
│     (packages/site)               Same template, different data  │
│     built with their data                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SUPABASE (shared, one project)                    │
├─────────────────────────────────────────────────────────────────┤
│  Auth     → ProfileLauncher dashboard users                      │
│  Postgres → site data, customer records, billing state           │
│  Storage  → cloud-garden-assets/profile-launcher/sites/{uuid}/  │
│             (images served via Supabase CDN)                     │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** Each customer site = a separate Netlify site, built from the SAME `packages/site` code but with different `site-data.json` injected at build time. One Netlify site per customer domain.

**For Fun With Kids (Phase 1):** Just one hardcoded build. The site-data.json is committed in the repo. Deploy manually. Templatize later.

**At scale:** ProfileLauncher dashboard triggers a Netlify build via API, passing the site UUID. Build script fetches site data from Supabase, generates static pages, deploys. Each customer = separate Netlify site with custom domain.

## Deployment Plan for Fun With Kids

### Phase 1: Ship the website (unblocks GBP API)
1. Create `packages/site` with Vite + React SSG + Tailwind
2. Transform Takeout data into `site-data.json`
3. Upload photos to Supabase Storage
4. Build the 5 pages (Home, About, Services, Reviews, Contact)
5. Register a `.com.au` domain
6. Deploy to Netlify with custom domain
7. Update the GBP website URL from careforkids.com.au to the new domain
8. Re-apply for GBP API access

### Phase 2: Template-ify (makes ProfileLauncher work)
1. Make the site template data-driven (read from Supabase at build time or from static JSON)
2. Build the "publish" flow in the dashboard — generates site-data.json, triggers Netlify build
3. Support variable page counts (some businesses won't have enough content for 5 pages)
4. Add theme customisation (colours, fonts)

## Key Files in This Repo

```
app.config.ts              # App-level config (Netlify sites, Supabase ref)
packages/
  landing/index.html       # ProfileLauncher marketing page
  app/src/
    pages/Dashboard.tsx     # Main app UI (connect GBP, generate draft, checkout)
    pages/Login.tsx         # Auth page
    lib/auth.ts             # Supabase auth helpers
    i18n/en.ts              # All UI strings
  api/functions/
    billing-status.ts       # Check Stripe subscription
    create-checkout.ts      # Create Stripe checkout session
    generate-site-draft.ts  # AI draft generation
    constants.ts            # API config
```

## Hard-Won Wisdom

1. **Reviews are the killer feature.** 20 five-star reviews over 7 years, deeply personal. Lead with social proof — most GBP websites bury reviews. This becomes a pattern for ALL ProfileLauncher sites: reviews are the #1 conversion driver for local businesses.

2. **Ship ugly-fast, polish later.** The goal is unblocking the GBP API, not the perfect template. 5 static pages on a real domain, update the GBP listing, re-apply. Refine after approval.

3. **site-data.json is the most important decision.** It's the contract between ProfileLauncher and every generated site. Get it right-ish with Fun With Kids, expect to revise when real GBP API data flows.

4. **One Netlify site per customer hits limits at 500.** Fine for a long time. Future fix: single Netlify site + Edge Functions routing by domain. Year-away problem.

5. **Register the `.com.au` domain FIRST.** Australian domains need ABN/ACN verification, can take days. Start before building so it's ready when the site is.

## Business Vision & Growth Path

### Revenue Targets
- **Phase 1 target: $5-20K MRR** (200-700 customers @ $29/mo). Life-changing side-gig income.
- **Phase 2 aspirational: $50-100K MRR** via upsells and expanded product surface.
- ProfileLauncher is ONE of many planned Cloud Garden apps. Each app is a revenue stream.

### Path to $20K MRR (Core Product)
- GBP → Website for $29/mo
- ~30M GBPs globally, most without a proper website
- AI-assisted marketing: SEO content targeting "website for my business", Google/Facebook ads to business owners
- Low churn once live (website linked to GBP = high switching cost)

### Path to $100K MRR (Upsells & Expansion)
The website is the **wedge** into the local business relationship. Then layer on:
- **Review management** — prompt customers for reviews, respond to reviews (GBP API supports this)
- **GBP posts** — AI-generated weekly posts to keep the listing active (GBP API supports this)
- **Booking integration** — GBP supports booking links; integrate with Calendly/Square or build native
- **Google Ads management** — GBP is tightly linked to Google Ads for local businesses; managed ads as a premium tier
- **SEO optimisation** — ongoing AI content generation, blog posts, local SEO signals
- **Multi-location support** — franchise/chain businesses managing many GBPs
- **Analytics dashboard** — website visits, GBP impressions, call tracking

Each upsell adds $10-30/mo per customer. 500 customers with $100 average = $50K MRR.

### Virality Mechanisms (K-factor > 1 = each customer brings 2+)

1. **"Built with ProfileLauncher" footer link** — every generated site becomes a billboard. Small tasteful link: "Built with love by ProfileLauncher. Build yours free →". This is the #1 growth channel for Carrd, Webflow, etc. Non-negotiable for free/cheap tiers, removable on premium.

2. **Referral program** — "Give a friend 1 month free, get 1 month free." Simple, proven. Track via referral codes. Target: each customer refers 2 others.

3. **Local network effect** — businesses in the same area see each other's sites. A plumber sees the electrician's nice website, clicks the footer link. Local businesses talk to each other. Gold Coast → Tweed Heads → Brisbane organic spread.

4. **"Website review" as lead gen** — free tool: "Paste your GBP link, we'll score your online presence." Shows what they're missing. Converts to paid site. Shareable results ("Your GBP score: 3/10 — no website!").

5. **Google Maps visibility** — every ProfileLauncher site improves the business's GBP ranking (website is a ranking signal). Word spreads: "I got a website and now I rank higher."

### GBP API Capabilities (future product surface)
The API supports reading AND writing:
- Read: business info, reviews, photos, posts, insights/analytics
- Write: create/update posts, reply to reviews, update business info, upload photos
- This means ProfileLauncher can become a full GBP management dashboard, not just a website builder

## Theming Strategy

**Phase 1: One template, colour swaps only.** `theme.primaryColor` drives buttons/headings, `theme.accentColor` drives highlights. Hardcode Fun With Kids colours first, don't build a picker yet.

**Phase 2: Preset palettes.** 3-4 choices ("Warm", "Professional", "Bold", "Earth") that auto-pick complementary colours. Selectable in dashboard.

**Phase 3 (maybe never): Layout variants.** Different page structures. Only build if customers demand it. One template + colour swaps + real photos already makes each site feel unique. 80% of personality for 5% of effort.

## Open Questions

1. **SSG framework**: Vite + React can do SSG with `vite-plugin-ssr` or similar. Or consider `react-snap` for simple pre-rendering. Need to decide the simplest approach that produces static HTML from React components.
2. **Multi-site builds**: When ProfileLauncher has 100 customers, how do builds work? One Netlify site per customer? Or one mega-build that outputs all sites? (Solve later — for now, one site.)
3. **Photo curation**: The Takeout has 104 photos. Need to manually review and select the best ones. Some may be duplicates or low quality.
4. **Domain registration**: Who registers and pays for `funwithkidsfdc.com.au`? Jonathan or his mum? This affects the GBP ownership story for Google.
