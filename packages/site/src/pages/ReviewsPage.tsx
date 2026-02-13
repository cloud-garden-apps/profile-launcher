import React from "react";
import { ReviewsList } from "../components/ReviewsList.js";
import { Section } from "../components/Section.js";
import type { SiteData } from "../types.js";

export function ReviewsPage({ data }: { data: SiteData }) {
  return (
    <Section title="Reviews">
      <ReviewsList data={data} />
    </Section>
  );
}
