# Cloud Garden App Template

A SaaS template for rapidly building and deploying web applications.

## Structure

```
packages/
  landing/   # Static marketing site (www.domain.com)
  app/       # React application (app.domain.com)
  api/       # Netlify Functions (app.domain.com/api/*)
```

## Quick Start

```bash
yarn install
yarn deploy landing   # Deploy landing page
yarn deploy app       # Deploy app + API
yarn deploy all       # Deploy everything
```

## Configuration

Edit `app.config.ts` to customize app name, Netlify sites, Supabase project, etc.
