import React from "react";
import { ServicesList } from "../components/ServicesList.js";
import { Section } from "../components/Section.js";
import type { SiteData } from "../types.js";

export function ServicesPage({ data }: { data: SiteData }) {
  return (
    <Section title="Services">
      <ServicesList data={data} />
    </Section>
  );
}
