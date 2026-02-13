import React from "react";
import { Gallery } from "../components/Gallery.js";
import { Hero } from "../components/Hero.js";
import { ReviewsList } from "../components/ReviewsList.js";
import { Section } from "../components/Section.js";
import { ServicesList } from "../components/ServicesList.js";
import { getEnabledPages } from "../lib/site-config.js";
import type { SiteData } from "../types.js";

export function HomePage({ data }: { data: SiteData }) {
  const enabledPages = getEnabledPages(data);
  const showServices = data.features?.showServices !== false;
  const showReviews = data.features?.showReviews !== false;
  const shouldShowGallery = data.features?.showGallery !== false && data.photos.length > 0;
  const hasServicesPage = enabledPages.includes("services");
  const hasReviewsPage = enabledPages.includes("reviews");

  return (
    <>
      <Hero data={data} showServicesLink={enabledPages.includes("services")} />
      {showServices ? (
        <Section title="Services">
          <ServicesList data={data} limit={3} />
          {hasServicesPage ? (
            <p className="mt-4">
              <a className="text-sm font-semibold text-emerald-700 hover:text-emerald-900" href="/services/">
                View all services
              </a>
            </p>
          ) : null}
        </Section>
      ) : null}
      {showReviews ? (
        <Section title="What Families Say">
          <ReviewsList data={data} limit={3} />
          {hasReviewsPage ? (
            <p className="mt-4">
              <a className="text-sm font-semibold text-emerald-700 hover:text-emerald-900" href="/reviews/">
                Read all reviews
              </a>
            </p>
          ) : null}
        </Section>
      ) : null}
      {shouldShowGallery ? (
        <Section title="Gallery">
          <Gallery data={data} limit={12} />
          <p className="mt-4 text-sm text-slate-600">
            Showing a selection of recent photos.
          </p>
        </Section>
      ) : null}
    </>
  );
}
