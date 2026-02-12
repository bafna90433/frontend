import React, { useMemo } from "react"; // useEffect aur useState hata diya
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard"; 
import "../styles/HotDealsSection.css";

/* --- TYPES --- */
type Product = {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images?: string[];
  slug?: string;
  stock?: number;
  tagline?: string;
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

/* --- HELPERS --- */
const calcDealPrice = (base: number, it: HotDealItem) => {
  const v = Number(it.discountValue || 0);
  const type = String(it.discountType || "NONE").toUpperCase();

  if (!v || type === "NONE") return base;

  if (type === "PERCENT") {
    const off = (base * v) / 100;
    return Math.max(1, Math.round(base - off));
  }

  if (type === "FLAT") {
    return Math.max(1, Math.round(base - v));
  }

  return base;
};

/* --- SUB-COMPONENT: CARD WRAPPER (Timer Removed) --- */
const HotDealCard: React.FC<{ item: HotDealItem }> = ({ item }) => {
  // ❌ Maine yahan se duplicate Timer Logic hata diya hai

  if (!item.product) return null;

  return (
    <div className="hd-cardWrap">
      {/* Ab sirf ProductCard dikhega, uska internal timer use hoga */}
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
        const p = it.product || allProducts.find((x) => x._id === it.productId) || null;
        if (!p) return null;

        const dealPrice = calcDealPrice(p.price, it);

        // Product Clone logic
        const cloned: Product = {
          ...p,
          mrp: p.mrp || (dealPrice < p.price ? p.price : p.mrp),
          price: dealPrice,
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