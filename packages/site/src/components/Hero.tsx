import React from "react";
import type { SiteData } from "../types.js";

export function Hero({ data, showServicesLink }: { data: SiteData; showServicesLink: boolean }) {
  const primary = data.theme?.primaryColor ?? "#254336";
  const accent = data.theme?.accentColor ?? "#6b8f71";

  return (
    <section
      className="border-b border-slate-200 bg-gradient-to-br from-emerald-50 to-white py-16"
      style={{ backgroundImage: `linear-gradient(135deg, ${accent}22, #ffffff)` }}
    >
      <div className="mx-auto w-[min(1100px,92%)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: accent }}>
          {data.business.category}
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl" style={{ color: primary }}>
          {data.business.name}
        </h1>
        <p className="mt-4 text-xl font-semibold text-slate-800">{data.business.tagline}</p>
        <p className="mt-4 max-w-3xl text-slate-700">{data.business.description}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            className="inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold text-white"
            href="/contact/"
            style={{ backgroundColor: primary }}
          >
            Contact
          </a>
          {showServicesLink ? (
            <a
              className="inline-flex items-center rounded-full border px-5 py-2 text-sm font-semibold"
              href="/services/"
              style={{ borderColor: primary, color: primary }}
            >
              View services
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
