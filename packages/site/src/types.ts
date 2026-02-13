export type PageKey = "home" | "about" | "services" | "reviews" | "contact";

export type SiteData = {
  business: {
    name: string;
    tagline: string;
    description: string;
    phone: string;
    email?: string;
    address: {
      street: string;
      locality: string;
      state: string;
      postCode: string;
      country: string;
    };
    coordinates?: { lat: number; lng: number };
    hours: Array<{ day: string; open: string; close: string }>;
    serviceArea: string[];
    category: string;
  };
  about?: {
    heading?: string;
    story?: string;
    philosophy?: string;
    qualifications?: string[];
  };
  services: Array<{ name: string; description?: string }>;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    date: string;
    reply?: { text: string; date: string };
  }>;
  photos: Array<{
    url: string;
    sourcePath?: string;
    alt: string;
    category?: string;
  }>;
  posts?: Array<{
    title?: string;
    summary: string;
    date: string;
    photos?: string[];
  }>;
  pages?: PageKey[];
  features?: {
    showServices?: boolean;
    showReviews?: boolean;
    showGallery?: boolean;
    showPosts?: boolean;
    showMapEmbed?: boolean;
    maxPhotos?: number;
  };
  seo?: {
    baseUrl?: string;
    titleSuffix?: string;
    defaultDescription?: string;
  };
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    neutralBackground?: string;
  };
};
