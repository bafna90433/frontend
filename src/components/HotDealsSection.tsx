import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// ✅ File name match (HotdealProductCard.tsx)
import HotdealProductCard from "./HotdealProductCard";

import "../styles/HotDealsSection.css";

type Product = {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images?: string[];
  slug?: string;
  stock?: number;
};

type DealType = "none" | "percent" | "flat" | "NONE" | "PERCENT" | "FLAT";

type HotDealItem = {
  productId: string;
  endsAt: string | null; // ISO
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

const pad = (n: number) => String(n).padStart(2, "0");

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

        // ✅ Clone product (response only)
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

      <div className="hd-grid">
        {items.slice(0, 8).map((it) => (
          <HotDealCard key={it.productId} item={it} />
        ))}
      </div>
    </section>
  );
};

const HotDealCard: React.FC<{ item: HotDealItem }> = ({ item }) => {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const end = item?.endsAt ? new Date(item.endsAt).getTime() : 0;
    if (!end) return;

    const t = setInterval(() => {
      const diff = Math.max(0, end - Date.now());
      if (diff <= 0) {
        clearInterval(t);
        setLeft({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }

      setLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(t);
  }, [item?.endsAt]);

  const timerText = item.endsAt
    ? `${left.d}D ${pad(left.h)}:${pad(left.m)}:${pad(left.s)}`
    : "";

  // ✅ product null safe
  if (!item.product) return null;

  return (
    <div className="hd-cardWrap">
      {timerText && <div className="hd-timerBadge">{timerText}</div>}
      <HotdealProductCard product={item.product as any} />
    </div>
  );
};

export default HotDealsSection;
