// ════════════════════════════════════════════════════════════
// HOMEPAGE TYPES
// Extracted from Homepage.tsx — logic/functions unchanged
// ════════════════════════════════════════════════════════════

export type BulkTier = { inner: number; qty: number; price: number };

export type Product = {
  _id: string;
  name: string;
  sku?: string;
  images?: string[] | string;
  price?: number;
  innerQty?: number;
  bulkPricing?: BulkTier[];
  category?: { _id?: string; name?: string } | string;
  taxFields?: string[];
  tags?: string[];
  description?: string;
  [k: string]: any;
};

export type Category = {
  _id: string;
  name: string;
  image?: string;
  link?: string;
  slug?: string;
};

export type Banner = { _id: string; imageUrl: string; link?: string };

export type HotDeal = {
  productId: string;
  discountType: "PERCENT" | "FLAT" | "NONE";
  discountValue: number;
  endsAt: string | null;
};
