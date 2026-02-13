import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard"; 
import "../styles/HotDealsSection.css";

/* --- TYPES --- */
// ✅ Updated Interface to match ProductCard expectations
type Product = {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images?: string[];
  slug?: string;
  stock?: number;
  tagline?: string;
  // Optional fields jo clone karte waqt add honge
  sale_end_time?: string;
  hotDealValue?: number;
  hotDealType?: string;
};

type DealType = "none" | "percent" | "flat" | "NONE" | "PERCENT" | "FLAT";

type HotDealItem = {
  productId: string;
  endsAt: string | null; 
  discountType: DealType;
  discountValue: number;
  product?: Product | null;
};

type HotCfg = {
  hotDealsEnabled?: boolean;
  hotDealsPageEnabled?: boolean;
  hotDealsTitle?: string;
  hotDealsItems?: HotDealItem[];
};

/* --- SUB-COMPONENT --- */
const HotDealCard: React.FC<{ item: HotDealItem }> = ({ item }) => {
  if (!item.product) return null;
  return (
    <div className="hd-cardWrap">
      <ProductCard product={item.product as any} />
    </div>
  );
};

/* --- MAIN COMPONENT --- */
const HotDealsSection: React.FC<{ allProducts: Product[]; cfg: HotCfg }> = ({
  allProducts,
  cfg,
}) => {
  const enabled = cfg?.hotDealsEnabled !== false;
  const title = cfg?.hotDealsTitle || "Deals Of The Day";

  const items = useMemo(() => {
    const raw = Array.isArray(cfg?.hotDealsItems) ? cfg.hotDealsItems : [];

    return raw
      .map((it) => {
        // Find original product
        const p = it.product || allProducts.find((x) => x._id === it.productId) || null;
        if (!p) return null;

        // ✅ FIX: Hum Price yahan calculate NAHI karenge.
        // Hum bas 'Deal Info' pass karenge taaki ProductCard khud calculate kare (99 -> 89).
        
        const cloned: Product = {
          ...p,
          // 1. Timer ke liye mapping (Bahut Zaroori)
          sale_end_time: it.endsAt || undefined,

          // 2. Deal Value pass karein (ProductCard logic trigger karne ke liye)
          hotDealValue: it.discountValue,
          hotDealType: it.discountType,

          // Note: Price aur MRP ko same rehne de (99 aur 175). 
          // ProductCard ab apne aap 99 ko 89 dikhayega.
        };

        return { ...it, product: cloned };
      })
      .filter(Boolean) as HotDealItem[];
  }, [cfg, allProducts]);

  if (!enabled || !items.length) return null;

  return (
    <section className="hd-wrap">
      {/* Header */}
      <div className="hd-head">
        <div className="hd-left">
          <h2 className="hd-title">{title}</h2>
        </div>

        {cfg?.hotDealsPageEnabled !== false && (
          <Link className="hd-viewall" to="/hot-deals">
            View All →
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className="hd-grid">
        {items.slice(0, 8).map((it) => (
          <HotDealCard key={it.productId} item={it} />
        ))}
      </div>
    </section>
  );
};

export default HotDealsSection;