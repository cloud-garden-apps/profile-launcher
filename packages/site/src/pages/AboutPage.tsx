import React from "react";
import { Section } from "../components/Section.js";
import type { SiteData } from "../types.js";

export function AboutPage({ data }: { data: SiteData }) {
  return (
    <Section title={data.about?.heading ?? "About"}>
      {data.about?.story ? <p>{data.about.story}</p> : <p>{data.business.description}</p>}
      {data.about?.philosophy ? <p>{data.about.philosophy}</p> : null}
      {data.about?.qualifications?.length ? (
        <>
          <h3>Qualifications</h3>
          <ul>
            {data.about.qualifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
    </Section>
  );
}
