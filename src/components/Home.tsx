// src/pages/Home.tsx
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

// ✅ NEW COMPONENT (row based promo)
import HomePromoSection from "../components/HomePromoSection";

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
  rating?: number; // optional (for promo row stars)
  ratingCount?: number; // optional
}

interface Banner {
  _id: string;
  imageUrl: string;
  link?: string;
}

// ✅ Promo types
type PromoBanner = { image: string; link?: string };
type PromoBlock = {
  sideBanners?: PromoBanner[];
  bestSellingProducts?: Product[];
  onSaleProducts?: Product[];
};

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

  hotDealsEnabled?: boolean;
  hotDealsPageEnabled?: boolean;
  hotDealsTitle?: string;
  hotDealsEndsAt?: string | null;
  hotDealsProductIds?: string[];
  hotDealsProducts?: Product[];

  promo?: PromoBlock;
};

const safeArr = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
const safeStrArr = (v: any): string[] => (Array.isArray(v) ? v.map(String) : []);

// ✅ Cloudinary optimizer
const optimizeCloudinary = (url: string, w: number, h: number) => {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  const TRANSFORM = `f_auto,q_auto,w_${w},h_${h},c_fill,g_auto`;
  return url.replace("/image/upload/", `/image/upload/${TRANSFORM}/`);
};

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
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
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

  // ✅ Promo data
  const promoSideBanners = useMemo(() => safeArr<PromoBanner>(homeCfg?.promo?.sideBanners), [homeCfg]);
  const bestSellingProducts = useMemo(() => safeArr<Product>(homeCfg?.promo?.bestSellingProducts), [homeCfg]);
  const onSaleProducts = useMemo(() => safeArr<Product>(homeCfg?.promo?.onSaleProducts), [homeCfg]);

  // ✅ optimize promo banners urls
  const promoSideBannersOptimized = useMemo(() => {
    return promoSideBanners.slice(0, 2).map((b) => ({
      ...b,
      image: optimizeCloudinary(b.image, 400, 520),
    }));
  }, [promoSideBanners]);

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="home-container">
      {!loading && banners.length > 0 && <BannerSlider banners={banners} />}

      {!loading && (
        <div className="trustbar">
          <div className="trust-item">
            <div className="trust-icon" aria-hidden>
              <FaTruckFast />
            </div>
            <div className="trust-text">
              <h4>Fast Delivery</h4>
              <p>Quick dispatch</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon" aria-hidden>
              <MdSecurity />
            </div>
            <div className="trust-text">
              <h4>Secure Pay</h4>
              <p>Safe checkout</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon" aria-hidden>
              <HiBadgeCheck />
            </div>
            <div className="trust-text">
              <h4>Quality</h4>
              <p>Checked products</p>
            </div>
          </div>

          <div className="trust-item">
            <div className="trust-icon" aria-hidden>
              <BiSupport />
            </div>
            <div className="trust-text">
              <h4>Support</h4>
              <p>Help on call</p>
            </div>
          </div>
        </div>
      )}

      {/* Shop By Category */}
      {!loading && categories.length > 0 && (
        <>
          <div className="section-heading-wrapper">
            <h3 className="section-heading">Shop By Category</h3>
            <div className="section-heading-line"></div>
          </div>

          <div className="category-circles-section">
            {categories.map((cat) => {
              const raw = cat.image || cat.imageUrl || "";
              const img = optimizeCloudinary(raw, 160, 160);

              return (
                <Link key={cat._id} to={`/products?category=${cat._id}`} className="cat-circle-item">
                  <div className="cat-circle-img-wrapper">
                    {raw ? (
                      <img
                        src={img}
                        alt={cat.name}
                        className="cat-circle-img"
                        width={130}
                        height={130}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="cat-placeholder">
                        <FiImage />
                      </div>
                    )}
                  </div>
                  <span className="cat-circle-name">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {loading && (
        <div className="category-circles-section">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cat-circle-skeleton">
              <Skeleton variant="circular" width={130} height={130} sx={{ "@media (max-width: 768px)": { width: 55, height: 55 } }} />
              <Skeleton variant="text" width={50} />
            </div>
          ))}
        </div>
      )}

      {!loading && products.length > 0 && (
        <section className="two-col-mobile two-col-mobile--trending">
          <TrendingSection products={products as any} config={homeCfg as any} />
        </section>
      )}

      {!loading && products.length > 0 && homeCfg && (
        <section className="two-col-mobile two-col-mobile--hotdeals">
          <HotDealsSection allProducts={products as any} cfg={homeCfg as any} />
        </section>
      )}

      {/* ✅ FINAL PROMO SECTION (REFERENCE DESIGN - rows) */}
      {!loading &&
        homeCfg?.promo &&
        (promoSideBannersOptimized.length > 0 || bestSellingProducts.length > 0 || onSaleProducts.length > 0) && (
          <HomePromoSection
            sideBanners={promoSideBannersOptimized as any}
            bestSelling={bestSellingProducts as any}
            onSale={onSaleProducts as any}
          />
        )}

      {!loading && popularCats.length > 0 && (
        <PopularCategories
          categories={popularCats}
          title={homeCfg?.popularTitle || "Popular Categories"}
          subtitle={homeCfg?.popularSubtitle || ""}
        />
      )}

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

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-brand">
              <h3>Bafna Toys</h3>
              <p>Best toys, best deals — safe & fast delivery.</p>
            </div>

            <div className="footer-links-container">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li>
                  <Link to="/privacy-policy">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms-conditions">Terms & Conditions</Link>
                </li>
                <li>
                  <Link to="/shipping-delivery">Shipping & Delivery</Link>
                </li>
                <li>
                  <Link to="/cancellation-refund">Cancellation & Refund</Link>
                </li>
              </ul>
            </div>

            <div className="footer-social">
              <h4>Follow Us</h4>
              <div className="social-row">
                <a className="social-btn insta" href="https://www.instagram.com/bafna_toys?igsh=MXRmNWs3dmZyYTJmbw==" target="_blank" rel="noreferrer">
                  Instagram
                </a>
                <a className="social-btn youtube" href="https://www.youtube.com/channel/UCZWOi-W-yK8s_RMb_XF_iUA" target="_blank" rel="noreferrer">
                  YouTube
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Bafna Toys. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;