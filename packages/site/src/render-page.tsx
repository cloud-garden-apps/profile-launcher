import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Layout } from "./components/Layout.js";
import { getEnabledPages, pagePath, pageTitle } from "./lib/site-config.js";
import { AboutPage } from "./pages/AboutPage.js";
import { ContactPage } from "./pages/ContactPage.js";
import { HomePage } from "./pages/HomePage.js";
import { ReviewsPage } from "./pages/ReviewsPage.js";
import { ServicesPage } from "./pages/ServicesPage.js";
import type { PageKey, SiteData } from "./types.js";

function selectPage(page: PageKey, data: SiteData) {
  if (page === "about") return <AboutPage data={data} />;
  if (page === "services") return <ServicesPage data={data} />;
  if (page === "reviews") return <ReviewsPage data={data} />;
  if (page === "contact") return <ContactPage data={data} />;
  return <HomePage data={data} />;
}

function getMetaDescription(data: SiteData): string {
  return data.seo?.defaultDescription ?? data.business.description;
}

function getDocumentTitle(data: SiteData, page: PageKey): string {
  const suffix = data.seo?.titleSuffix ?? data.business.name;
  const pagePart = pageTitle(page);
  return page === "home" ? suffix : `${pagePart} | ${suffix}`;
}

export function renderPage(page: PageKey, data: SiteData): string {
  const enabledPages = getEnabledPages(data);
  const body = renderToStaticMarkup(
    <Layout data={data} currentPage={page} enabledPages={enabledPages}>
      {selectPage(page, data)}
    </Layout>
  );

  const baseUrl = data.seo?.baseUrl;
  const canonical = baseUrl ? `${baseUrl.replace(/\/$/, "")}${pagePath(page)}` : undefined;

  return [
    "<!doctype html>",
    "<html lang=\"en\">",
    "<head>",
    "<meta charset=\"utf-8\" />",
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
    `<title>${escapeHtml(getDocumentTitle(data, page))}</title>`,
    `<meta name="description" content="${escapeHtml(getMetaDescription(data))}" />`,
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : "",
    "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">",
    "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>",
    "<link href=\"https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Instrument+Serif:ital@0;1&display=swap\" rel=\"stylesheet\">",
    "<script src=\"https://cdn.tailwindcss.com\"></script>",
    "<style>",
    "  :root { --neutral-white: #ffffff; --neutral-black: #0a0a0a; --neutral-grey: #f5f5f5; }",
    "  body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; background-color: var(--neutral-white); color: var(--neutral-black); }",
    "  .font-serif { font-family: 'Instrument Serif', serif; }",
    "  .font-sans { font-family: 'Inter', sans-serif; }",
    "  html { scroll-behavior: smooth; }",
    "  ::selection { background: var(--neutral-black); color: var(--neutral-white); }",
    "  .section-border { border-top: 1px solid rgba(0,0,0,0.06); }",
    "</style>",
    "</head>",
    `<body class="antialiased selection:bg-black selection:text-white">${body}</body>`,
    "</html>"
  ]
    .filter(Boolean)
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
