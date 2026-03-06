import React, { useEffect, useMemo, useState, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

// ✅ Eager Loads (Initial screen elements)
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import ErrorMessage from "./ErrorMessage";
import FloatingCheckoutButton from "../components/FloatingCheckoutButton";
import OrderStepsBar from "../components/OrderStepsBar";
import HomeSEO from "./HomeSEO";

import { FiChevronLeft, FiChevronRight, FiArrowRight, FiImage } from "react-icons/fi";
import { FaTruckFast } from "react-icons/fa6";
import { MdSecurity } from "react-icons/md";
import { HiBadgeCheck } from "react-icons/hi";
import { BiSupport } from "react-icons/bi";
import { FaInstagram } from "react-icons/fa";
import { Skeleton } from "@mui/material";
import "../styles/Home.css";

// ✅ PERFORMANCE: Lazy Load heavy below-the-fold sections
const TrendingSection = lazy(() => import("./TrendingSection"));
const PopularCategories = lazy(() => import("./PopularCategories"));
const HotDealsSection = lazy(() => import("./HotDealsSection"));
const HomePromoSection = lazy(() => import("../components/HomePromoSection"));

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
  rating?: number;
  ratingCount?: number;
}

interface Banner {
  _id: string;
  imageUrl: string;
  link?: string;
}

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

const optimizeCloudinary = (url: string, w: number, h: number) => {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  const TRANSFORM = `f_auto,q_auto,w_${w},h_${h},c_fill,g_auto`;
  return url.replace("/image/upload/", `/image/upload/${TRANSFORM}/`);
};

// Placeholder skeleton component for Lazy loaded sections to prevent CLS
const SectionSkeleton = ({ height = "400px" }) => (
  <div
    style={{
      width: "100%",
      height,
      padding: "20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "var(--bg)",
    }}
  >
    <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: "12px" }} />
  </div>
);

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [homeCfg, setHomeCfg] = useState<HomeCfg | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollContainers = useRef<Map<string, HTMLDivElement>>(new Map());

  const scrollContainer = (id: string, direction: "left" | "right") => {
    const container = scrollContainers.current.get(id);
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

  const promoSideBanners = useMemo(
    () => safeArr<PromoBanner>(homeCfg?.promo?.sideBanners),
    [homeCfg]
  );
  const bestSellingProducts = useMemo(
    () => safeArr<Product>(homeCfg?.promo?.bestSellingProducts),
    [homeCfg]
  );
  const onSaleProducts = useMemo(
    () => safeArr<Product>(homeCfg?.promo?.onSaleProducts),
    [homeCfg]
  );

  const promoSideBannersOptimized = useMemo(() => {
    return promoSideBanners.slice(0, 2).map((b) => ({
      ...b,
      image: optimizeCloudinary(b.image, 400, 520),
    }));
  }, [promoSideBanners]);

  const rattlesCategory = useMemo(
    () => categories.find((c) => c.name.toLowerCase().includes("rattle")),
    [categories]
  );

  const rattlesProducts = useMemo(
    () => (rattlesCategory ? products.filter((p) => p.category?._id === rattlesCategory._id) : []),
    [products, rattlesCategory]
  );

  const homeSeoCategories = useMemo(
    () =>
      categories.map((cat) => ({
        name: cat.name,
        url: `https://bafnatoys.com/products?category=${cat._id}`,
      })),
    [categories]
  );

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <>
      <HomeSEO url="https://bafnatoys.com/" categories={homeSeoCategories} />

      <div className="home-container">
        {/* Premium Instagram Announcement Bar */}
        <div className="announcement-wrapper">
          <a
            href="https://www.instagram.com/bafna_toys/"
            target="_blank"
            rel="noreferrer"
            className="top-announcement-bar"
          >
            <div className="announcement-left">
              <span className="announcement-badge">▶ Play</span>
            </div>
            <span className="announcement-text">
              Want to see our toys in action? 🎥 Watch videos on our Instagram and come back to
              shop!
            </span>
            <span className="announcement-btn">
              Watch Now <FaInstagram size={15} />
            </span>
          </a>
        </div>

        {/* ✅ LCP & CLS FIX: Show Banner Skeleton while loading */}
        {loading ? (
          <div style={{ width: "100%", padding: "10px 0", margin: "20px auto", overflow: "hidden" }}>
            <Skeleton variant="rectangular" width="100%" height="300px" sx={{ borderRadius: "10px" }} />
          </div>
        ) : (
          banners.length > 0 && <BannerSlider banners={banners} />
        )}

        {!loading && <OrderStepsBar />}

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
                <Skeleton
                  variant="circular"
                  width={130}
                  height={130}
                  sx={{ "@media (max-width: 768px)": { width: 65, height: 65 } }}
                />
                <Skeleton variant="text" width={60} sx={{ mt: 1 }} />
              </div>
            ))}
          </div>
        )}

        {/* Clean Trust Bar */}
        {!loading && (
          <div className="trustbar-container">
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
          </div>
        )}

        {/* 🏠 ✨ VIP PREMIUM SECTION: HOUSE OF RATTLES */}
        {!loading && rattlesProducts.length > 0 && (
          <section className="house-of-rattles-section">
            <div className="hor-header">
              <img
                src="https://res.cloudinary.com/dpdecxqb9/image/upload/v1772200542/D13_viaowv.webp"
                alt="Rattles Logo"
                className="hor-logo"
                loading="lazy"
              />
              <div className="hor-header-content">
                <div className="hor-badges-wrapper">
                  <span className="hor-badge-primary">🌟 #1 Best Seller</span>
                  <span className="hor-badge-secondary">🔥 Retailers' Choice</span>
                </div>
                <h2 className="hor-title">
                  <span className="rattle-icon left" aria-hidden="true">
                    🪇
                  </span>
                  The House of Rattles
                  <span className="rattle-icon right" aria-hidden="true">
                    🪇
                  </span>
                </h2>
                <p className="hor-subtitle">Shake, Play & Smile! 👶 Discover the premium collection.</p>
              </div>
              <div className="hor-action">
                <Link to={`/products?category=${rattlesCategory?._id}`} className="hor-view-all-btn">
                  Explore All <span className="btn-icon-animate">✨</span>
                </Link>
              </div>
            </div>

            <div className="hor-products-wrapper">
              <button
                className="scroll-btn scroll-btn--left hor-scroll"
                onClick={() => scrollContainer("rattles-special", "left")}
                aria-label="Scroll left"
              >
                <FiChevronLeft size={22} />
              </button>
              <div
                id="scroll-rattles-special"
                className="product-scroll hor-scroll-container"
                ref={(el) => {
                  if (el) scrollContainers.current.set("rattles-special", el);
                  else scrollContainers.current.delete("rattles-special");
                }}
              >
                {rattlesProducts.map((product) => (
                  <div key={product._id} className="product-link">
                    <ProductCard product={product as any} userRole="customer" />
                  </div>
                ))}
              </div>
              <button
                className="scroll-btn scroll-btn--right hor-scroll"
                onClick={() => scrollContainer("rattles-special", "right")}
                aria-label="Scroll right"
              >
                <FiChevronRight size={22} />
              </button>
            </div>
          </section>
        )}

        {/* ✅ PERFORMANCE: Suspense boundaries added for lazy loaded components */}
        {!loading && products.length > 0 && (
          <Suspense fallback={<SectionSkeleton height="350px" />}>
            <section className="two-col-mobile two-col-mobile--trending">
              <TrendingSection products={products as any} config={homeCfg as any} />
            </section>
          </Suspense>
        )}

        {!loading && products.length > 0 && homeCfg && (
          <Suspense fallback={<SectionSkeleton height="350px" />}>
            <section className="two-col-mobile two-col-mobile--hotdeals">
              <HotDealsSection allProducts={products as any} cfg={homeCfg as any} />
            </section>
          </Suspense>
        )}

        {!loading &&
          homeCfg?.promo &&
          (promoSideBannersOptimized.length > 0 ||
            bestSellingProducts.length > 0 ||
            onSaleProducts.length > 0) && (
            <Suspense fallback={<SectionSkeleton height="450px" />}>
              <HomePromoSection
                sideBanners={promoSideBannersOptimized as any}
                bestSelling={bestSellingProducts as any}
                onSale={onSaleProducts as any}
              />
            </Suspense>
          )}

        {!loading && popularCats.length > 0 && (
          <Suspense fallback={<SectionSkeleton height="300px" />}>
            <PopularCategories
              categories={popularCats}
              title={homeCfg?.popularTitle || "Popular Categories"}
              subtitle={homeCfg?.popularSubtitle || ""}
            />
          </Suspense>
        )}

        {!loading &&
          categories.map((cat) => {
            if (cat.name.toLowerCase().includes("rattle")) return null;

            const items = products.filter((p) => p.category?._id === cat._id);
            if (!items.length) return null;

            return (
              <div key={cat._id} className="category-block">
                <div className="category-header">
                  <h2 className="category-title">{cat.name}</h2>
                  <Link to={`/products?category=${cat._id}`} className="view-all-btn">
                    View All <FiArrowRight />
                  </Link>
                </div>

                <div className="product-scroll-wrapper">
                  <button
                    className="scroll-btn scroll-btn--left"
                    onClick={() => scrollContainer(cat._id, "left")}
                    aria-label="Scroll left"
                  >
                    <FiChevronLeft size={22} />
                  </button>

                  <div
                    id={`scroll-${cat._id}`}
                    className="product-scroll"
                    ref={(el) => {
                      if (el) scrollContainers.current.set(cat._id, el);
                      else scrollContainers.current.delete(cat._id);
                    }}
                  >
                    {items.map((product) => (
                      <div key={product._id} className="product-link">
                        <ProductCard product={product as any} userRole="customer" />
                      </div>
                    ))}
                  </div>

                  <button
                    className="scroll-btn scroll-btn--right"
                    onClick={() => scrollContainer(cat._id, "right")}
                    aria-label="Scroll right"
                  >
                    <FiChevronRight size={22} />
                  </button>
                </div>
              </div>
            );
          })}

        <FloatingCheckoutButton />

        {/* ✅ CLS FIX: Render footer ONLY AFTER loading is complete */}
        {!loading && (
          <footer className="home-footer">
            <div className="footer-content">
              <div className="footer-top">
                <div className="footer-brand">
                  <h3>BafnaToys</h3>
                  <p>
                    Inspiring imagination through play. The best toys, best deals, delivered safely
                    and fast.
                  </p>
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
                  <h4>Connect With Us</h4>
                  <div className="social-row">
                    <a
                      className="social-btn insta"
                      href="https://www.instagram.com/bafna_toys/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Instagram
                    </a>
                    <a
                      className="social-btn youtube"
                      href="https://www.youtube.com/channel/UCZWOi-W-yK8s_RMb_XF_iUA"
                      target="_blank"
                      rel="noreferrer"
                    >
                      YouTube
                    </a>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <p>© {new Date().getFullYear()} BafnaToys. All rights reserved.</p>
              </div>
            </div>
          </footer>
        )}
      </div>
    </>
  );
};

export default Home;