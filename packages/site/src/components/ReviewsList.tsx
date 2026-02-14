import React from "react";
import type { SiteData } from "../types.js";

export function ReviewsList({ data, limit }: { data: SiteData; limit?: number }) {
  const reviews = typeof limit === "number" ? data.reviews.slice(0, limit) : data.reviews;

  if (reviews.length === 0) {
    return <p className="font-light text-black/20 italic">Awaiting reflections.</p>;
  }

  return (
    <div className="space-y-40">
      {reviews.map((review, idx) => (
        <article key={`${review.author}-${idx}`} className="max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-1 text-[10px] uppercase font-bold tracking-[0.4em] text-black/20 pt-4">
            {(idx + 1).toString().padStart(2, '0')}
          </div>
          <div className="lg:col-span-11">
            <blockquote className="font-serif text-5xl lg:text-7xl leading-[0.9] tracking-tight text-black italic mb-12">
              "{review.text.slice(0, 350)}{review.text.length > 350 ? '...' : ''}"
            </blockquote>

            <div className="flex items-center gap-6">
              <span className="text-[10px] uppercase font-bold tracking-[0.3em]">{review.author}</span>
              <span className="h-px w-8 bg-black/10" />
              <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-black/30">
                {new Date(review.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
