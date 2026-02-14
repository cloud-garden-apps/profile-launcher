import React from "react";
import type { SiteData } from "../types.js";

export function Hero({ data, showServicesLink }: { data: SiteData; showServicesLink: boolean }) {
  const business = data.business;
  const photos = data.photos || [];
  const primaryImg = photos[0]?.url;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white px-8">
      <div className="mx-auto max-w-[1700px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-20">
        <div className="lg:col-span-8">
          <h1 className="font-serif text-[clamp(4rem,15vw,12rem)] leading-[0.8] tracking-[-0.03em] text-black">
            {business.name.split(' ').slice(0, 2).join(' ')} <br />
            <span className="italic opacity-20 hover:opacity-100 transition-opacity cursor-default pr-4">
              {business.name.split(' ').slice(2, 4).join(' ')}
            </span>
          </h1>

          <div className="mt-20 flex items-start gap-20">
             <div className="max-w-md">
                <p className="text-xl font-light leading-relaxed text-black/60">
                   {business.tagline || business.description.slice(0, 150)}
                </p>
             </div>
             <a
               href="#contact"
               className="group relative h-32 w-32 flex items-center justify-center shrink-0"
             >
                <div className="absolute inset-0 border border-black rounded-full group-hover:bg-black transition-all duration-500 scale-100 group-hover:scale-110" />
                <span className="relative text-[10px] uppercase font-bold tracking-[0.2em] group-hover:text-white transition-colors">
                  Inquire
                </span>
             </a>
          </div>
        </div>

        <div className="lg:col-span-4 h-[60vh] lg:h-[80vh] relative">
           <img
             src={primaryImg}
             alt={business.name}
             className="absolute inset-0 h-full w-full object-cover grayscale"
           />
           <div className="absolute bottom-10 left-10 text-[10px] uppercase font-bold tracking-[0.4em] text-white mix-blend-difference">
              Established 1993
           </div>
        </div>
      </div>
    </section>
  );
}
