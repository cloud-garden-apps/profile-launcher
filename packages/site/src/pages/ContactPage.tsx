import React from "react";
import { ContactDetails } from "../components/ContactDetails.js";
import { HoursTable } from "../components/HoursTable.js";
import { Section } from "../components/Section.js";
import type { SiteData } from "../types.js";

export function ContactPage({ data }: { data: SiteData }) {
  return (
    <>
      <Section title="Contact">
        <ContactDetails data={data} />
      </Section>
      <Section title="Hours">
        <HoursTable data={data} />
      </Section>
    </>
  );
}
