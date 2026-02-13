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
    "<script src=\"https://cdn.tailwindcss.com\"></script>",
    "</head>",
    `<body class="antialiased">${body}</body>`,
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
