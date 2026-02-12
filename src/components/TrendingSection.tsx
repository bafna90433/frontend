import React, { useMemo, useState, useEffect } from "react";
import api from "../utils/api";
import TrendingProductCard from "./TrendingProductCard";
import "../styles/TrendingSection.css";

// ✅ Updated Product Type with Timer & Featured
type Product = {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images?: string[];
  stock?: number;
  rating?: number;
  reviews?: number;
  category?: { _id: string; name: string } | string;
  slug?: string;
  sale_end_time?: string; // ✅ Timer Field Added
  featured?: boolean;     // ✅ Featured Badge Added
};

type TrendingSectionCfg = {
  title: string;
  productIds: string[];
  products?: Product[];
};

type HomeConfig = {
  trendingTitle?: string;
  trendingProductIds?: string[];
  trendingSections?: TrendingSectionCfg[];
  bannerImage?: string;
  bannerLink?: string;
};

const toStrArr = (v: any): string[] => (Array.isArray(v) ? v.map(String) : []);

const toSections = (v: any): TrendingSectionCfg[] => {
  if (!Array.isArray(v)) return [];
  return v.map((s: any) => ({
    title: typeof s?.title === "string" ? s.title : "",
    productIds: toStrArr(s?.productIds),
    products: Array.isArray(s?.products) ? s.products : undefined,
  }));
};

const cap = (s: string) =>
  (s || "").trim() ? (s.trim().charAt(0).toUpperCase() + s.trim().slice(1)) : "";

type Props = {
  products: Product[];
  config?: HomeConfig | null;
};

const TrendingSection: React.FC<Props> = ({ products, config }) => {
  const [cfg, setCfg] = useState<HomeConfig | null>(config ?? null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (config) {
      setCfg(config);
      return;
    }

    // Fallback fetch if config prop is missing
    const fetchConfig = async () => {
      try {
        const res = await api.get("/home-config");
        setCfg(res.data || {});
      } catch (e) {
        console.error("Failed to load home-config:", e);
        setCfg({});
      }
    };
    fetchConfig();
  }, [config]);

  const sections = useMemo(() => toSections(cfg?.trendingSections), [cfg]);

  const safeSections = useMemo(() => {
    if (sections.length > 0) return sections;

    // Fallback logic if no sections defined
    const oldIds = toStrArr(cfg?.trendingProductIds);
    const ids = oldIds.length ? oldIds : (products?.slice(0, 6).map((p) => p._id) || []);

    return [
      {
        title: "All Trending", 
        productIds: ids,
        products: [], // Placeholder
      },
    ];
  }, [sections, cfg, products]);

  // Reset index if out of bounds
  useEffect(() => {
    if (activeIdx > safeSections.length - 1) setActiveIdx(0);
  }, [activeIdx, safeSections.length]);

  const activeSection = safeSections[activeIdx];

  const activeProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    // 1. If section has pre-loaded products
    if (activeSection?.products && activeSection.products.length > 0) {
      return activeSection.products
        .filter((p) => p && typeof p.price === "number")
        .slice(0, 6);
    }

    // 2. Otherwise match from the main 'products' prop using IDs
    const sectionIds = toStrArr(activeSection?.productIds);
    const picked = sectionIds
      .map((id) => products.find((p) => p._id === id))
      .filter((p): p is Product => Boolean(p) && typeof p.price === "number");

    // Fallback: just show first 6 products if no IDs match
    return (picked.length ? picked : products.slice(0, 6)).slice(0, 6);
  }, [activeSection, products]);

  if (!products || products.length === 0) return null;

  const bannerImage = cfg?.bannerImage || "";
  const bannerLink = cfg?.bannerLink || "";
  const mainTitle = cfg?.trendingTitle || "Trending Products";

  return (
    <section className="trending-wrap">
      {/* 1. SECTION HEADING */}
      <div className="section-heading-wrapper" style={{ marginBottom: "20px" }}>
        <h3 className="section-heading">{mainTitle}</h3>
        <div className="section-heading-line"></div>
      </div>

      {/* 2. TABS (Only if multiple sections exist) */}
      <div className="trending-head">
        {safeSections.length > 1 && (
          <div className="trending-tabs">
            {safeSections.map((s, idx) => (
              <button
                key={`${s.title}-${idx}`}
                className={`t-tab ${idx === activeIdx ? "active" : ""}`}
                onClick={() => setActiveIdx(idx)}
                type="button"
              >
                {cap(s.title) || `Section ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. BODY (Grid + Banner) */}
      <div className="trending-body">
        {/* Product Grid */}
        <div className="trending-grid">
          {activeProducts.map((p) => (
            <TrendingProductCard key={p._id} product={p} />
          ))}
        </div>

        {/* Banner (Visible on Desktop, Hidden on Mobile) */}
        {bannerImage && (
          <aside className="trending-banner">
            {bannerLink ? (
              <a href={bannerLink} target="_blank" rel="noreferrer">
                <img src={bannerImage} alt="Trending Banner" />
              </a>
            ) : (
              <img src={bannerImage} alt="Trending Banner" />
            )}
          </aside>
        )}
      </div>
    </section>
  );
};

export default TrendingSection;