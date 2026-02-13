import type { PageKey, SiteData } from "../types.js";

const DEFAULT_PAGES: PageKey[] = ["home", "about", "services", "reviews", "contact"];

export function getEnabledPages(data: SiteData): PageKey[] {
  const configured = data.pages?.length ? data.pages : DEFAULT_PAGES;
  return configured.filter((page) => pageAllowedByFeatures(page, data));
}

export function pageAllowedByFeatures(page: PageKey, data: SiteData): boolean {
  const features = data.features ?? {};

  if (page === "reviews") {
    if (features.showReviews === false) return false;
    return data.reviews.length > 0;
  }

  if (page === "services") {
    if (features.showServices === false) return false;
    return data.services.length > 0;
  }

  return true;
}

export function getPhotoList(data: SiteData) {
  const allPhotos = data.photos ?? [];
  const max = data.features?.maxPhotos;
  if (typeof max === "number" && max > 0) {
    return allPhotos.slice(0, max);
  }
  return allPhotos;
}

export function pagePath(page: PageKey): string {
  return page === "home" ? "/" : `/${page}/`;
}

export function pageTitle(page: PageKey): string {
  if (page === "home") return "Home";
  if (page === "about") return "About";
  if (page === "services") return "Services";
  if (page === "reviews") return "Reviews";
  return "Contact";
}
