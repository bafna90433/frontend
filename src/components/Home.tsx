import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import TrendingSection from "./TrendingSection";
import PopularCategories from "./PopularCategories";
import HotDealsSection from "./HotDealsSection";
import ErrorMessage from "./ErrorMessage";
import FloatingCheckoutButton from "../components/FloatingCheckoutButton";

import { FiChevronLeft, FiChevronRight, FiArrowRight, FiImage } from "react-icons/fi";
import { FaTruckFast } from "react-icons/fa6";
import { MdSecurity } from "react-icons/md";
import { HiBadgeCheck } from "react-icons/hi";
import { BiSupport } from "react-icons/bi";
import { Skeleton } from "@mui/material";
import "../styles/Home.css";

interface Category {
  _id: string;
  name: string;
  image?: string;
  imageUrl?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  category?: { _id: string; name: string };
  images: string[];
  slug?: string;
  mrp?: number;
}

interface Banner {
  _id: string;
  imageUrl: string;
  link?: string;
}

type HomeCfg = {
  popularTitle?: string;
  popularSubtitle?: string;
  popularCategoryIds?: string[];
  popularCategories?: Category[];

  trendingTitle?: string;
  trendingProductIds?: string[];
  trendingSections?: { title: string; productIds: string[]; products?: Product[] }[];

  bannerImage?: string;
  bannerLink?: string;

  // ✅ HOT DEALS
  hotDealsEnabled?: boolean;
  hotDealsPageEnabled?: boolean;
  hotDealsTitle?: string;
  hotDealsEndsAt?: string | null;
  hotDealsProductIds?: string[];
  hotDealsProducts?: Product[];
};

const safeArr = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
const safeStrArr = (v: any): string[] => (Array.isArray(v) ? v.map(String) : []);

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [homeCfg, setHomeCfg] = useState<HomeCfg | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollContainer = (id: string, direction: "left" | "right") => {
    const container = document.getElementById(`scroll-${id}`);
    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -container.clientWidth : container.clientWidth,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [catRes, prodRes, bannerRes, cfgRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
          api.get("/banners"),
          api.get("/home-config"),
        ]);

        setCategories(safeArr<Category>(catRes.data?.categories || catRes.data || []));
        setProducts(safeArr<Product>(prodRes.data?.products || prodRes.data || []));
        setBanners(safeArr<Banner>(bannerRes.data?.banners || bannerRes.data || []));
        setHomeCfg(cfgRes.data || null);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const popularCats = useMemo(() => {
    if (!homeCfg) return [];
    if (Array.isArray(homeCfg.popularCategories) && homeCfg.popularCategories.length > 0) {
      return homeCfg.popularCategories;
    }
    const ids = safeStrArr(homeCfg.popularCategoryIds);
    if (!ids.length) return [];
    return categories.filter((c) => ids.includes(c._id));
  }, [homeCfg, categories]);

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="home-container">
      {/* 1️⃣ Banner Slider */}
      {!loading && banners.length > 0 && <BannerSlider banners={banners} />}

      {/* ✅ TRUST BAR */}
      {!loading && (
        <div className="trustbar">
          <div className="trust-item">
            <div className="trust-icon" aria-hidden><FaTruckFast /></div>
            <div className="trust-text"><h4>Fast Delivery</h4><p>Quick dispatch</p></div>
          </div>
          <div className="trust-item">
            <div className="trust-icon" aria-hidden><MdSecurity /></div>
            <div className="trust-text"><h4>Secure Pay</h4><p>Safe checkout</p></div>
          </div>
          <div className="trust-item">
            <div className="trust-icon" aria-hidden><HiBadgeCheck /></div>
            <div className="trust-text"><h4>Quality</h4><p>Checked products</p></div>
          </div>
          <div className="trust-item">
            <div className="trust-icon" aria-hidden><BiSupport /></div>
            <div className="trust-text"><h4>Support</h4><p>Help on call</p></div>
          </div>
        </div>
      )}

      {/* 2️⃣ Shop By Category */}
      {!loading && categories.length > 0 && (
        <>
          <div className="section-heading-wrapper">
            <h3 className="section-heading">Shop By Category</h3>
            <div className="section-heading-line"></div>
          </div>

          <div className="category-circles-section">
            {categories.map((cat) => (
              <Link key={cat._id} to={`/products?category=${cat._id}`} className="cat-circle-item">
                <div className="cat-circle-img-wrapper">
                  {cat.image || cat.imageUrl ? (
                    <img src={cat.image || cat.imageUrl} alt={cat.name} className="cat-circle-img" />
                  ) : (
                    <div className="cat-placeholder"><FiImage /></div>
                  )}
                </div>
                <span className="cat-circle-name">{cat.name}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="category-circles-section">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cat-circle-skeleton">
              <Skeleton
                variant="circular"
                width={180}
                height={180}
                sx={{ "@media (max-width: 768px)": { width: 80, height: 80 } }}
              />
              <Skeleton variant="text" width={100} />
            </div>
          ))}
        </div>
      )}

      {/* 3️⃣ Trending */}
      {!loading && products.length > 0 && (
        <section className="two-col-mobile two-col-mobile--trending">
          <TrendingSection products={products as any} config={homeCfg as any} />
        </section>
      )}

      {/* 3.5️⃣ Hot Deals */}
      {!loading && products.length > 0 && homeCfg && (
        <section className="two-col-mobile two-col-mobile--hotdeals">
          <HotDealsSection allProducts={products as any} cfg={homeCfg as any} />
        </section>
      )}

      {/* 4️⃣ Popular */}
      {!loading && popularCats.length > 0 && (
        <PopularCategories
          categories={popularCats}
          title={homeCfg?.popularTitle || "Popular Categories"}
          subtitle={homeCfg?.popularSubtitle || ""}
        />
      )}

      {/* 5️⃣ Category Wise Rows */}
      {!loading &&
        categories.map((cat) => {
          const items = products.filter((p) => p.category?._id === cat._id);
          if (!items.length) return null;

          return (
            <div key={cat._id} className="category-block">
              <div className="category-header">
                <h2 className="category-title">
                  <span className="title-highlight">{cat.name}</span>
                </h2>
                <Link to={`/products?category=${cat._id}`} className="view-all-btn">
                  View All <FiArrowRight />
                </Link>
              </div>

              <div className="product-scroll-wrapper">
                <button className="scroll-btn scroll-btn--left" onClick={() => scrollContainer(cat._id, "left")}>
                  <FiChevronLeft size={22} />
                </button>

                <div id={`scroll-${cat._id}`} className="product-scroll">
                  {items.map((product) => (
                    <div key={product._id} className="product-link">
                      <ProductCard product={product as any} userRole="customer" />
                    </div>
                  ))}
                </div>

                <button className="scroll-btn scroll-btn--right" onClick={() => scrollContainer(cat._id, "right")}>
                  <FiChevronRight size={22} />
                </button>
              </div>
            </div>
          );
        })}

      <FloatingCheckoutButton />

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-links-container">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
              <li><Link to="/shipping-delivery">Shipping & Delivery</Link></li>
              <li><Link to="/cancellation-refund">Cancellation & Refund</Link></li>
            </ul>
          </div>
          <div className="footer-copyright">
            <p>© {new Date().getFullYear()} Bafna Toys</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;