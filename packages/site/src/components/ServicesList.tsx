import React from "react";
import type { SiteData } from "../types.js";

export function ServicesList({ data, limit }: { data: SiteData; limit?: number }) {
  const services = typeof limit === "number" ? data.services.slice(0, limit) : data.services;

  if (services.length === 0) {
    return <p className="font-light text-black/20 italic">Details upon inquiry.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-32 gap-x-20">
      {services.map((service, idx) => (
        <article key={service.name} className="group">
          <div className="mb-10 overflow-hidden bg-black aspect-video grayscale hover:grayscale-0 transition-all duration-700">
             {/* Placeholder for service image if data had it, otherwise minimal block */}
             <div className="w-full h-full flex items-center justify-center text-white/5 font-serif text-6xl">
                0{(idx + 1)}
             </div>
          </div>
          <h3 className="font-serif text-4xl mb-6">{service.name}</h3>
          <p className="font-light text-lg text-black/50 leading-relaxed">
            {service.description || `A foundational program specializing in ${service.name.toLowerCase()}.`}
          </p>
        </article>
      ))}
    </div>
  );
}
