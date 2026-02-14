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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {photos.map((photo, idx) => (
        <div
          key={`${photo.url}-${idx}`}
          className={`relative overflow-hidden group bg-slate-100 aspect-[3/4] ${
            idx % 4 === 0 ? 'lg:aspect-[16/9] lg:col-span-2' : ''
          }`}
        >
          <img
            className="h-full w-full object-cover grayscale brightness-110 hover:grayscale-0 hover:brightness-100 transition-all duration-[2s] ease-in-out"
            src={photo.url}
            alt={photo.alt}
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
