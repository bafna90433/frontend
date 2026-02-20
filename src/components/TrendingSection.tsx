// src/components/TrendingSection.tsx
import React, { useMemo, useState, useEffect } from "react";
import api from "../utils/api";
import TrendingProductCard from "./TrendingProductCard";
import "../styles/TrendingSection.css";

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
  sale_end_time?: string;
  featured?: boolean;
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
const cap = (s: string) =>
  (s || "").trim() ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1) : "";

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

  const sections = useMemo(() => {
    const v = cfg?.trendingSections;
    if (!Array.isArray(v)) return [];
    return v.map((s: any) => ({
      title: typeof s?.title === "string" ? s.title : "",
      productIds: toStrArr(s?.productIds),
      products: Array.isArray(s?.products) ? s.products : undefined,
    }));
  }, [cfg]);

  const safeSections = useMemo(() => {
    if (sections.length > 0) return sections;

    const oldIds = toStrArr(cfg?.trendingProductIds);
    const ids = oldIds.length ? oldIds : (products?.slice(0, 6).map((p) => p._id) || []);

    return [{ title: "All Trending", productIds: ids }];
  }, [sections, cfg, products]);

  useEffect(() => {
    if (activeIdx > safeSections.length - 1) setActiveIdx(0);
  }, [activeIdx, safeSections.length]);

  const activeSection = safeSections[activeIdx];

  const activeProducts = useMemo(() => {
    if (!products?.length) return [];

    if (activeSection?.products?.length) {
      return activeSection.products
        .filter((p) => p && typeof p.price === "number")
        .slice(0, 6);
    }

    const ids = toStrArr(activeSection?.productIds);
    const picked = ids
      .map((id) => products.find((p) => p._id === id))
      .filter((p): p is Product => Boolean(p) && typeof p.price === "number");

    return (picked.length ? picked : products.slice(0, 6)).slice(0, 6);
  }, [activeSection, products]);

  if (!products?.length) return null;

  const bannerImage = cfg?.bannerImage || "";
  const bannerLink = cfg?.bannerLink || "";
  const mainTitle = cfg?.trendingTitle || "Trending Products";

  return (
    <section className="trending-wrap">
      {/* Premium Heading */}
      <div className="trending-heading">
        <h3 className="trending-title">{mainTitle}</h3>
        <div className="trending-line" />
      </div>

      {/* Modern Pill Tabs */}
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

      {/* Grid & Banner Layout */}
      <div className="trending-body">
        <div className="trending-grid">
          {activeProducts.map((p) => (
            <TrendingProductCard key={p._id} product={p} />
          ))}
        </div>

        {bannerImage && (
          <aside className="trending-banner">
            {bannerLink ? (
              <a href={bannerLink} target="_blank" rel="noreferrer">
                <img src={bannerImage} alt="Trending Banner" loading="lazy" />
              </a>
            ) : (
              <img src={bannerImage} alt="Trending Banner" loading="lazy" />
            )}
          </aside>
        )}
      </div>
    </section>
  );
};

export default TrendingSection;