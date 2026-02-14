import React from "react";
import { Gallery } from "../components/Gallery.js";
import { Hero } from "../components/Hero.js";
import { ReviewsList } from "../components/ReviewsList.js";
import { Section } from "../components/Section.js";
import { ServicesList } from "../components/ServicesList.js";
import { getEnabledPages } from "../lib/site-config.js";
import type { SiteData } from "../types.js";

export function HomePage({ data }: { data: SiteData }) {
  const showServices = data.features?.showServices !== false;
  const showReviews = data.features?.showReviews !== false;
  const shouldShowGallery = data.features?.showGallery !== false && data.photos.length > 0;

  return (
    <div className="selection:bg-black selection:text-white">
      <Hero data={data} showServicesLink={false} />

      {/* Philosophy Section - Pure Typography */}
      <section className="py-60 px-8 bg-white border-t border-black/5">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="font-serif text-[clamp(3rem,10vw,8rem)] font-normal leading-[0.85] tracking-tighter text-black max-w-6xl">
            We believe in the power <br />
            <span className="italic opacity-30">of absolute simplicity</span> <br />
            and nurturing care.
          </h2>
          <div className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-20">
             <div className="text-2xl font-light leading-relaxed text-black/60 max-w-xl">
               {data.business.description}
             </div>
             <div className="flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-black/20 block mb-4">— Founder's Philosophy</span>
             </div>
          </div>
        </div>
      </section>

      {showServices && (
        <Section title="Offerings" id="services">
          <ServicesList data={data} limit={6} />
        </Section>
      )}

      {showReviews && (
        <Section title="Reflections" id="reviews">
          <ReviewsList data={data} limit={6} />
        </Section>
      )}

      {shouldShowGallery && (
        <Section title="Gallery" id="gallery">
          <Gallery data={data} />
        </Section>
      )}

      {/* Contact Section - Final Inquiry */}
      <section id="contact" className="py-60 bg-white border-t border-black/5">
        <div className="mx-auto max-w-[1700px] px-8 text-center">
            <span className="text-[10px] uppercase font-bold tracking-[0.5em] text-black/20 block mb-12">Next Steps</span>
            <h2 className="font-serif text-9xl tracking-tighter mb-24">
              Join the <span className="italic text-[#8a5f2a]">Family</span>.
            </h2>
            <div className="flex flex-col items-center gap-12">
               <a
                 href={`tel:${data.business.phone}`}
                 className="text-4xl font-serif hover:italic transition-all border-b border-black/10 pb-2"
               >
                 {data.business.phone}
               </a>
               <p className="text-xl font-light text-black/40 max-w-md">
                 Our doors are open for those seeking a boutique, high-end care environment.
               </p>
               <a
                 href="/contact"
                 className="mt-10 px-20 py-6 bg-black text-white text-[10px] uppercase font-bold tracking-[0.4em] hover:bg-white hover:text-black hover:border hover:border-black transition-all"
               >
                 Detailed Inquiry
               </a>
            </div>
        </div>
      </section>
    </div>
  );
}
