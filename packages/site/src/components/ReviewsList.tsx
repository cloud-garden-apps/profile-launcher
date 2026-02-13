import React from "react";
import type { SiteData } from "../types.js";

function stars(rating: number): string {
  return "★".repeat(Math.max(0, Math.min(5, rating)));
}

export function ReviewsList({ data, limit }: { data: SiteData; limit?: number }) {
  const reviews = typeof limit === "number" ? data.reviews.slice(0, limit) : data.reviews;

  if (reviews.length === 0) {
    return <p>No reviews available.</p>;
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review, idx) => (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={`${review.author}-${review.date}-${idx}`}>
          <p className="text-amber-500" aria-label={`${review.rating} stars`}>
            {stars(review.rating)}
          </p>
          <p className="mt-3 text-sm text-slate-700">{review.text}</p>
          <p className="mt-3 text-xs text-slate-500">
            {review.author} · {new Date(review.date).toLocaleDateString("en-AU")}
          </p>
        </article>
      ))}
    </div>
  );
}
