# `packages/site`

Data-driven static site renderer for ProfileLauncher customer websites.

## Goals

- Site-agnostic components and pages
- Per-customer content provided by top-level JSON data
- Server-side React render to static HTML files
- Feature toggles (for optional sections like reviews)

## Commands

`yarn workspace site build`

Build output is written to:

- `packages/site/dist`

## Data input

Default input file:

- `packages/site/src/data/site-data.json`

Use this file as the contract for customer-generated data.
