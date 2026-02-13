import React from "react";
import type { SiteData } from "../types.js";

export function ContactDetails({ data }: { data: SiteData }) {
  const b = data.business;
  const mapHref = b.coordinates
    ? `https://www.google.com/maps?q=${b.coordinates.lat},${b.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${b.address.street}, ${b.address.locality}, ${b.address.state} ${b.address.postCode}`
      )}`;

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Contact</h3>
        <p className="mt-2 text-sm text-slate-700">{b.phone}</p>
        {b.email ? <p className="text-sm text-slate-700">{b.email}</p> : null}
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Address</h3>
        <p className="mt-2 text-sm text-slate-700">{b.address.street}</p>
        <p className="text-sm text-slate-700">
          {b.address.locality} {b.address.state} {b.address.postCode}
        </p>
        <p className="text-sm text-slate-700">{b.address.country}</p>
        <p className="mt-2">
          <a className="text-sm font-semibold text-emerald-700 hover:text-emerald-900" href={mapHref} target="_blank" rel="noreferrer">
            Open in Google Maps
          </a>
        </p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Service Area</h3>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
          {b.serviceArea.map((area) => (
            <li key={area}>{area}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
