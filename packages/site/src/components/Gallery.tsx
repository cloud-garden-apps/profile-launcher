import React from "react";
import { getPhotoList } from "../lib/site-config.js";
import type { SiteData } from "../types.js";

export function Gallery({ data, limit }: { data: SiteData; limit?: number }) {
  const allPhotos = getPhotoList(data);
  const photos = typeof limit === "number" ? allPhotos.slice(0, limit) : allPhotos;

  if (data.features?.showGallery === false || photos.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo, idx) => (
        <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" key={`${photo.url}-${idx}`}>
          <img className="h-48 w-full object-cover" src={photo.url} alt={photo.alt} loading="lazy" />
        </figure>
      ))}
    </div>
  );
}
