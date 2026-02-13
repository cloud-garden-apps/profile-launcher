import React from "react";
import type { SiteData } from "../types.js";

export function ServicesList({ data, limit }: { data: SiteData; limit?: number }) {
  const services = typeof limit === "number" ? data.services.slice(0, limit) : data.services;

  if (services.length === 0) {
    return <p>No services listed yet.</p>;
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={service.name}>
          <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
          {service.description ? <p className="mt-2 text-sm text-slate-700">{service.description}</p> : null}
        </article>
      ))}
    </div>
  );
}
