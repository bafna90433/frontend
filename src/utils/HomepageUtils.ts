// ════════════════════════════════════════════════════════════
// HOMEPAGE UTILITY FUNCTIONS
// Extracted from Homepage.tsx — logic unchanged
// ════════════════════════════════════════════════════════════

import { MEDIA_URL } from "./api";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

export const optimizeCloudinary = (
  url: string | undefined,
  w: number,
  h: number,
  crop = "c_fill"
): string => {
  if (!url) return "/placeholder.png";

  if (url.includes("ik.imagekit.io")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}tr=w-${w},h-${h},cm-at_max,f-auto,q-80`;
  }

  if (!url.startsWith("http") && CLOUD_NAME) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${w},h_${h},${crop}/${url}`;
  }
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/image/upload/f_auto") || url.includes("/w_")) return url;
    return url.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto,w_${w},h_${h},${crop}/`
    );
  }

  return url.startsWith("http")
    ? url
    : `${MEDIA_URL}/uploads/${encodeURIComponent(url)}`;
};

export const cleanProduct = (raw: any) => ({
  _id: String(raw._id ?? raw.id ?? ""),
  name: raw.name ?? raw.title ?? "Untitled",
  sku: raw.sku ?? "",
  images: Array.isArray(raw.images)
    ? raw.images
    : typeof raw.images === "string"
    ? [raw.images]
    : [],
  price: typeof raw.price === "number" ? raw.price : Number(raw.price) || 0,
  mrp: Number(raw.mrp || raw.MRP || 0),
  innerQty: raw.innerQty,
  bulkPricing: Array.isArray(raw.bulkPricing) ? raw.bulkPricing : [],
  category: raw.category ?? raw.categoryName ?? "",
  taxFields: Array.isArray(raw.taxFields) ? raw.taxFields : [],
  description: raw.description ?? "",
  tags: Array.isArray(raw.tags) ? raw.tags : [],
  ...raw,
});

export const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const cleanTextForPDF = (str: string) => {
  if (!str) return "";
  // Remove non-standard characters that break PDF fonts
  return str.replace(/[^\x00-\x7F]/g, "").trim();
};
