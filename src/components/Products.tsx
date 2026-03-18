import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api, { MEDIA_URL } from "../utils/api";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import "../styles/Products.css";
import CategorySEO from "./CategorySEO";
import FloatingCheckoutButton from "./FloatingCheckoutButton";
import {
  X,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  SlidersHorizontal,
  Search,
  Sparkles,
  ArrowUpDown,
  Filter,
  Star,
  Users,
  Truck,
  Factory,
  Shield,
  BadgeCheck,
  ExternalLink,
  Instagram,
  Youtube,
  Facebook,
  Linkedin,
  Clock,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@mui/material";

// ════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════

type BulkTier = { inner: number; qty: number; price: number };

type Product = {
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

type Category = {
  _id: string;
  name: string;
  image?: string;
  link?: string;
};

type Banner = { _id: string; imageUrl: string; link?: string };

type HotDeal = {
  productId: string;
  discountType: "PERCENT" | "FLAT" | "NONE";
  discountValue: number;
  endsAt: string | null;
};

// ════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

const optimizeCloudinary = (
  url: string | undefined,
  w: number,
  h: number,
  crop = "c_fill"
): string => {
  if (!url) return "/placeholder.png";
  
  if (!url.startsWith("http") && CLOUD_NAME) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${w},h_${h},${crop}/${url}`;
  }
  
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/image/upload/f_auto")) return url;
    return url.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto,w_${w},h_${h},${crop}/`
    );
  }
  
  return url.startsWith("http")
    ? url
    : `${MEDIA_URL}/uploads/${encodeURIComponent(url)}`;
};

const cleanProduct = (raw: any): Product => ({
  _id: String(raw._id ?? raw.id ?? ""),
  name: raw.name ?? raw.title ?? "Untitled",
  sku: raw.sku ?? "",
  images: Array.isArray(raw.images)
    ? raw.images
    : typeof raw.images === "string"
    ? [raw.images]
    : [],
  price: typeof raw.price === "number" ? raw.price : Number(raw.price) || 0,
  innerQty: raw.innerQty,
  bulkPricing: Array.isArray(raw.bulkPricing) ? raw.bulkPricing : [],
  category: raw.category ?? raw.categoryName ?? "",
  taxFields: Array.isArray(raw.taxFields) ? raw.taxFields : [],
  description: raw.description ?? "",
  tags: Array.isArray(raw.tags) ? raw.tags : [],
  ...raw,
});

// ════════════════════════════════════════════════════════════
// ANIMATED COUNTER COMPONENT
// ════════════════════════════════════════════════════════════

const AnimatedCounter: React.FC<{
  target: string | number;
  duration?: number;
}> = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const targetNum =
            parseInt(String(target).replace(/\D/g, ""), 10) || 4900;
          let start: number | null = null;
          
          const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * targetNum));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(targetNum);
          };
          
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString("en-IN")}
      {String(target).replace(/[0-9.,]/g, "")}
    </span>
  );
};

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════

const Products: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Data State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeDeals, setActiveDeals] = useState<HotDeal[]>([]);
  const [trustData, setTrustData] = useState<any>(null);

  // Loading State
  const [loading, setLoading] = useState(true);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [sortBy, setSortBy] = useState("default");
  const [minPriceInput, setMinPriceInput] = useState<number | "">(0);
  const [maxPriceInput, setMaxPriceInput] = useState<number | "">(5000);
  const [activePriceFilter, setActivePriceFilter] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const ITEMS_PER_PAGE = 25;

  // URL Params
  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const searchTerm = params.get("search") || params.get("q") || "";

  // Marquee Items
  const marqueeItems = useMemo(() => [
    { icon: "📦", text: "Small MOQ Ordering" },
    { icon: "🧸", text: "400+ Toy Products" },
    { icon: "🚚", text: "All-India Door Delivery" },
    { icon: "💵", text: "Higher Retail Margins" },
    { icon: "🏭", text: "Factory Direct Supply" },
    { icon: "📊", text: "Fast Moving Toys" },
    { icon: "🎁", text: "Attractive Packaging" },
    { icon: "🧾", text: "Easy Ordering for Retailers" },
    { icon: "🔁", text: "Regular New Launches" },
    { icon: "🏷️", text: "Beat E-Commerce Prices" },
  ], []);

  // ════════════════════════════════════════════════════════════
  // EFFECTS
  // ════════════════════════════════════════════════════════════

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, categoryId]);

  // Fetch static data
  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data?.categories || r.data || []))
      .catch(console.error);

    api
      .get("/banners")
      .then((r) => {
        const b = Array.isArray(r.data?.banners)
          ? r.data.banners
          : Array.isArray(r.data)
          ? r.data
          : [];
        setBanners(b);
      })
      .catch(console.error)
      .finally(() => setBannersLoading(false));

    api
      .get("/home-config")
      .then((r) => {
        const items =
          r.data?.hotDealsItemsResolved || r.data?.hotDealsItems || [];
        setActiveDeals(
          items.map((it: any) => ({
            productId: it.productId || it.product?._id,
            discountType: it.discountType || "NONE",
            discountValue: Number(it.discountValue || 0),
            endsAt: it.endsAt || null,
          }))
        );
      })
      .catch(console.error);

    api
      .get("/trust-settings")
      .then((r) => setTrustData(r.data))
      .catch(console.error);
  }, []);

  // Fetch products
  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const r = await api.get("/products", {
          signal: ctrl.signal,
          params: {
            ...(categoryId ? { category: categoryId } : {}),
            ...(searchTerm ? { search: searchTerm } : {}),
          },
        });
        
        if (!alive) return;
        
        const arr = Array.isArray(r.data)
          ? r.data
          : r.data?.products || r.data?.docs || [];
        setAllProducts(arr.map(cleanProduct));
      } catch (e: any) {
        if (!ctrl.signal.aborted) {
          setError(e?.response?.data?.message || e.message || "Failed to load");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    
    fetchProducts();
    
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [location.search, categoryId, searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, searchTerm, sortBy, activePriceFilter]);

  // ════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════

  const handleApplyPrice = useCallback(() => {
    setActivePriceFilter({
      min: Number(minPriceInput) || 0,
      max: Number(maxPriceInput) || Infinity,
    });
  }, [minPriceInput, maxPriceInput]);

  const handleClear = useCallback(() => {
    setSortBy("default");
    setActivePriceFilter(null);
    setMinPriceInput(0);
    setMaxPriceInput(5000);
    navigate("/");
  }, [navigate]);

  const handleCatClick = useCallback((cat: Category) => {
    if (cat.link?.trim()) {
      cat.link.startsWith("http")
        ? (window.location.href = cat.link)
        : navigate(cat.link);
    } else {
      navigate(`/?category=${cat._id}`);
    }
  }, [navigate]);

  const goPage = useCallback((n: number) => {
    setCurrentPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ════════════════════════════════════════════════════════════

  const displayed = useMemo(() => {
    let f = [...allProducts];
    
    // Filter by category
    if (categoryId) {
      f = f.filter((p) =>
        typeof p.category === "string"
          ? p.category === categoryId
          : p.category?._id === categoryId
      );
    }
    
    // Filter by search
    if (searchTerm) {
      const n = searchTerm.toLowerCase();
      f = f.filter(
        (p) =>
          p.name.toLowerCase().includes(n) ||
          (p.sku || "").toLowerCase().includes(n)
      );
    }
    
    // Apply deals
    if (activeDeals.length) {
      f = f.map((p) => {
        const d = activeDeals.find((x) => x.productId === p._id);
        return d
          ? {
              ...p,
              hotDealType: d.discountType,
              hotDealValue: d.discountValue,
              sale_end_time: d.endsAt || undefined,
            }
          : p;
      });
    }
    
    // Filter by price
    if (activePriceFilter) {
      f = f.filter(
        (p) =>
          (p.price || 0) >= activePriceFilter.min &&
          (p.price || 0) <= activePriceFilter.max
      );
    }
    
    // Sort
    if (sortBy === "price-low") {
      f.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      f.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "name-asc") {
      f.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return f;
  }, [allProducts, categoryId, searchTerm, sortBy, activeDeals, activePriceFilter]);

  const totalPages = Math.ceil(displayed.length / ITEMS_PER_PAGE);
  
  const paginated = useMemo(() => 
    displayed.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    ),
    [displayed, currentPage]
  );

  const getPages = useCallback(() => {
    const p: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        p.push(i);
      } else if (p[p.length - 1] !== "...") {
        p.push("...");
      }
    }
    return p;
  }, [totalPages, currentPage]);

  const catName = useMemo(() => {
    if (!categoryId) return "";
    return (
      categories.find((c) => c._id === categoryId)?.name ||
      (typeof displayed[0]?.category === "object"
        ? displayed[0]?.category?.name
        : "") ||
      ""
    );
  }, [categoryId, categories, displayed]);

  const seoTitle = catName
    ? `Wholesale ${catName} | Bafna Toys`
    : searchTerm
    ? `Search: "${searchTerm}"`
    : "Shop Wholesale Toys | Bafna Toys";

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  return (
    <div className="sp-wrapper">
      <CategorySEO
        title={seoTitle}
        description="Buy bulk toys at wholesale prices from India's leading B2B toy supplier."
        keywords="wholesale toys, bulk toys, B2B toys India"
        url={`https://bafnatoys.com${location.pathname}${location.search}`}
        jsonLd={{}}
      />

      {/* ═══ MARQUEE ═══ */}
      <div className="sp-marquee">
        <div className="sp-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span className="sp-marquee-chip" key={i}>
              <span className="sp-marquee-emoji">{item.icon}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ HERO BANNER ═══ */}
      <div className="sp-hero-banner">
        <div className="sp-hero-content">
          <div className="sp-hero-badge">
            <Factory size={14} />
            Direct from Manufacturer
          </div>
          <h1 className="sp-hero-title">
            India's Trusted
            <br />
            <span>B2B Toy Wholesale</span>
          </h1>
          <p className="sp-hero-sub">
            For Toy Stores, Supermarkets & Retail Resellers
          </p>
          <div className="sp-hero-perks">
            <span>
              <Truck size={14} /> Free Delivery ₹5000+
            </span>
            <span>
              <Shield size={14} /> BIS Certified
            </span>
            <span>
              <BadgeCheck size={14} /> 400+ Products
            </span>
          </div>
        </div>
        <div className="sp-hero-offer">
          <div className="sp-offer-circle">
            <span className="sp-offer-num">50%</span>
            <span className="sp-offer-txt">& MORE OFF MRP</span>
          </div>
        </div>
      </div>

      {/* ═══ INSTAGRAM STRIP ═══ */}
      <a
        href="https://www.instagram.com/bafna_toys"
        target="_blank"
        rel="noopener noreferrer"
        className="sp-insta-strip"
      >
        <Instagram size={16} />
        Follow @bafna_toys for latest updates & launches
        <ExternalLink size={14} />
      </a>

      {/* ═══ BANNERS ═══ */}
      {!categoryId &&
        !searchTerm &&
        (bannersLoading ? (
          <div className="sp-banner-skeleton">
            <Skeleton
              variant="rectangular"
              width="100%"
              height={260}
              sx={{ borderRadius: "20px" }}
            />
          </div>
        ) : (
          banners.length > 0 && (
            <div className="sp-banner-wrap">
              <BannerSlider banners={banners} />
            </div>
          )
        ))}

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="sp-layout">
        {/* SIDEBAR */}
        <aside className="sp-sidebar">
          <div className="sp-sb-inner">
            <div className="sp-sb-section">
              <h3 className="sp-sb-heading">
                <LayoutGrid size={15} />
                Categories
              </h3>
              <ul className="sp-sb-list">
                <li
                  className={!categoryId ? "active" : ""}
                  onClick={() => navigate("/")}
                >
                  <span className="sp-sb-icon">✦</span>
                  <span>All Toys</span>
                  <ChevronRight size={14} className="sp-sb-arrow" />
                </li>
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    className={categoryId === cat._id ? "active" : ""}
                    onClick={() => handleCatClick(cat)}
                  >
                    {cat.image ? (
                      <img
                        src={optimizeCloudinary(cat.image, 36, 36)}
                        alt=""
                        className="sp-sb-cat-img"
                      />
                    ) : (
                      <span className="sp-sb-icon">📦</span>
                    )}
                    <span>{cat.name}</span>
                    <ChevronRight size={14} className="sp-sb-arrow" />
                  </li>
                ))}
              </ul>
            </div>

            <div className="sp-sb-divider" />

            <div className="sp-sb-section">
              <h3 className="sp-sb-heading">
                <SlidersHorizontal size={15} />
                Price Range
              </h3>
              <input
                type="range"
                min="0"
                max="10000"
                value={maxPriceInput || 0}
                onChange={(e) => setMaxPriceInput(Number(e.target.value))}
                className="sp-range"
              />
              <div className="sp-price-row">
                <div className="sp-price-field">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) =>
                      setMinPriceInput(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
                <span className="sp-price-dash">—</span>
                <div className="sp-price-field">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) =>
                      setMaxPriceInput(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>
              <button className="sp-apply-btn" onClick={handleApplyPrice}>
                Apply Filter
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="sp-main">
          {/* Mobile Categories */}
          <div className="sp-mob-cats">
            <div className="sp-mob-cats-track">
              <div
                className={`sp-mob-cat ${!categoryId ? "active" : ""}`}
                onClick={() => navigate("/")}
              >
                <div className="sp-mob-cat-circle">
                  <span>✦</span>
                </div>
                <span>All</span>
              </div>
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className={`sp-mob-cat ${
                    categoryId === cat._id ? "active" : ""
                  }`}
                  onClick={() => handleCatClick(cat)}
                >
                  <div className="sp-mob-cat-circle">
                    {cat.image ? (
                      <img
                        src={optimizeCloudinary(cat.image, 80, 80)}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span>📦</span>
                    )}
                  </div>
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <div className="sp-toolbar">
            <div className="sp-toolbar-left">
              <button
                className="sp-back-btn sp-mob-only"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="sp-toolbar-title">
                {searchTerm
                  ? `"${searchTerm}"`
                  : catName || "All Toys"}
                <span className="sp-count-badge">{displayed.length}</span>
              </h2>
            </div>
            <div className="sp-toolbar-right">
              <button
                className="sp-filter-toggle sp-mob-only"
                onClick={() => setMobileFilterOpen(true)}
              >
                <Filter size={16} />
                Filters
              </button>
              <div className="sp-sort-wrap">
                <ArrowUpDown size={14} className="sp-sort-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sp-sort-select"
                  aria-label="Sort products"
                >
                  <option value="default">Relevance</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                  <option value="name-asc">Name: A → Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || activePriceFilter) && (
            <div className="sp-filters-bar">
              {searchTerm && (
                <span className="sp-filter-tag">
                  <Search size={12} />
                  {searchTerm}
                  <X
                    size={13}
                    onClick={() => navigate(location.pathname)}
                  />
                </span>
              )}
              {activePriceFilter && (
                <span className="sp-filter-tag">
                  ₹{activePriceFilter.min} – ₹{activePriceFilter.max}
                  <X
                    size={13}
                    onClick={() => setActivePriceFilter(null)}
                  />
                </span>
              )}
              <button className="sp-clear-btn" onClick={handleClear}>
                Clear All
              </button>
            </div>
          )}

          {/* Error and Loading States */}
          {loading ? (
            <div className="sp-grid">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  width="100%"
                  height={320}
                  sx={{ borderRadius: "16px" }}
                />
              ))}
            </div>
          ) : error ? (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'var(--sp-bg)',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ backgroundColor: '#fee2e2', padding: '24px', borderRadius: '50%', marginBottom: '24px' }}>
                <WifiOff size={48} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--sp-text)', marginBottom: '12px' }}>
                Connection Failed
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--sp-text-muted)', maxWidth: '320px', marginBottom: '32px', lineHeight: 1.5 }}>
                {error === "Network Error" 
                  ? "It looks like you're offline or the server is unreachable. Please check your internet connection." 
                  : error}
              </p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', backgroundColor: 'var(--sp-primary)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
                }}
              >
                <RefreshCw size={18} />
                Try Again
              </button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="sp-empty">
              <Sparkles size={52} />
              <h2>No products found</h2>
              <p>Try different filters or categories</p>
              <button onClick={handleClear}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="sp-grid">
                {paginated.map((p, i) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    userRole="customer"
                    index={i}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="sp-pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => goPage(currentPage - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {getPages().map((pg, i) => (
                    <button
                      key={i}
                      className={`${pg === currentPage ? "active" : ""} ${
                        pg === "..." ? "dots" : ""
                      }`}
                      disabled={pg === "..."}
                      onClick={() =>
                        typeof pg === "number" && goPage(pg)
                      }
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => goPage(currentPage + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* 🔴 ✅ UPDATED Dynamic Trust Factory Section ✅ 🔴 */}
          {!loading && trustData && (
            <div className="sp-factory-section">
              <div className="sp-factory-header">
                <span className="sp-line" />
                <h3>Inside Our Factory</h3>
                <span className="sp-line" />
              </div>

              <div className="sp-factory-stats">
                <div className="sp-stat-card sp-stat-hero">
                  <div className="sp-stat-number">
                    <AnimatedCounter
                      target={trustData.retailerCount || "49000+"}
                    />
                  </div>
                  <p>Happy Retailers Across India</p>
                </div>
              </div>

              {/* Dynamic Grid mapping from factoryVisuals or fallback to old static mapping */}
              <div className="sp-factory-grid">
                {trustData.factoryVisuals && trustData.factoryVisuals.length > 0 ? (
                  trustData.factoryVisuals.map((item: any, i: number) => (
                    item.image && (
                      <div className="sp-factory-card" key={i}>
                        <img
                          src={optimizeCloudinary(item.image, 400, 280)}
                          alt={item.label || `Process ${i+1}`}
                          loading="lazy"
                        />
                        {item.label && <div className="sp-factory-label">{item.label}</div>}
                      </div>
                    )
                  ))
                ) : (
                  [
                    {
                      img: trustData.manufacturingUnit,
                      label: "Manufacturing",
                    },
                    {
                      img: trustData.packingDispatch,
                      label: "Packing & Dispatch",
                    },
                    {
                      img: trustData.warehouseStorage,
                      label: "Warehouse Storage",
                    },
                  ].map(
                    (item, i) =>
                      item.img && (
                        <div className="sp-factory-card" key={i}>
                          <img
                            src={optimizeCloudinary(item.img, 400, 280)}
                            alt={item.label}
                            loading="lazy"
                          />
                          <div className="sp-factory-label">{item.label}</div>
                        </div>
                      )
                  )
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ═══ TRUST STATS ═══ */}
      <section className="sp-trust-strip">
        <div className="sp-trust-inner">
          {[
            {
              icon: <Star size={24} />,
              color: "#f59e0b",
              title: "4.8/5",
              sub: "Avg. Rating",
            },
            {
              icon: <Users size={24} />,
              color: "#2563eb",
              title: "4,900+",
              sub: "Retailers",
            },
            {
              icon: <Truck size={24} />,
              color: "#059669",
              title: "All India",
              sub: "Delivery",
            },
            {
              icon: <Factory size={24} />,
              color: "#7c3aed",
              title: "Direct",
              sub: "Manufacturer",
            },
          ].map((s, i) => (
            <div className="sp-trust-stat" key={i}>
              <div className="sp-trust-icon" style={{ color: s.color }}>
                {s.icon}
              </div>
              <div>
                <h4>{s.title}</h4>
                <p>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FACTORY SLIDER ═══ */}
      {!loading &&
        trustData?.factorySliderImages?.length > 0 && (
          <section className="sp-slider-section">
            <div className="sp-slider-head">
              <h3>Live Facility Feed</h3>
              <p>Our Coimbatore manufacturing facility</p>
            </div>
            <div className="sp-slider-viewport">
              <div className="sp-slider-track">
                {[
                  ...trustData.factorySliderImages,
                  ...trustData.factorySliderImages,
                ].map((img: string, i: number) => (
                  <div className="sp-slider-card" key={i}>
                    <img
                      src={optimizeCloudinary(img, 400, 280)}
                      alt={`Factory ${i + 1}`}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* ═══ BIS BANNER ═══ */}
      {!loading && trustData?.factoryImage && (
        <section className="sp-bis-section">
          <div className="sp-bis-inner">
            <h4>All Toys BIS Certified</h4>
            <div className="sp-gst-pill">
              GSTIN: 33ANCPH3967L1ZT
            </div>
            <img
              src={optimizeCloudinary(trustData.factoryImage, 1200, 400)}
              alt="Factory"
              className="sp-bis-img"
              loading="lazy"
            />
          </div>
        </section>
      )}

      {/* ═══ REVIEWS ═══ */}
      {!loading &&
        trustData?.customerReviews?.length > 0 && (
          <section className="sp-reviews-section">
            <div className="sp-reviews-inner">
              <h2>Retailers Love Us</h2>
              <p className="sp-reviews-sub">
                Trusted by thousands of verified businesses
              </p>
              <div className="sp-reviews-grid">
                {trustData.customerReviews
                  .slice(0, 4)
                  .map((r: any, i: number) => (
                    <div className="sp-review-card" key={i}>
                      <div className="sp-review-img-wrap">
                        <img
                          src={optimizeCloudinary(r.image, 400, 400)}
                          alt={r.reviewerName}
                          loading="lazy"
                        />
                      </div>
                      <div className="sp-review-body">
                        <div className="sp-review-stars">
                          {"★".repeat(r.rating || 5)}
                          <span>{"★".repeat(5 - (r.rating || 5))}</span>
                        </div>
                        <p>"{r.reviewText}"</p>
                        <div className="sp-review-footer">
                          <strong>{r.reviewerName}</strong>
                          <span>
                            <BadgeCheck size={13} />
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

      {/* ═══ FOOTER ═══ */}
      {!loading && (
        <footer className="sp-footer">
          <div className="sp-footer-inner">
            <div className="sp-footer-brand">
              <div className="sp-footer-logo">🧸 BafnaToys</div>
              <p>
                Inspiring imagination through play. Premium toys, best
                deals, fast delivery.
              </p>
              {trustData && (
                <div className="sp-marketplace-row">
                  <span className="sp-mp-label">Also on:</span>
                  {trustData.amazonLink && trustData.amazonLogo && (
                    <a
                      href={trustData.amazonLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={optimizeCloudinary(
                          trustData.amazonLogo,
                          80,
                          40,
                          "c_fit"
                        )}
                        alt="Amazon"
                      />
                    </a>
                  )}
                  {trustData.flipkartLink && trustData.flipkartLogo && (
                    <a
                      href={trustData.flipkartLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={optimizeCloudinary(
                          trustData.flipkartLogo,
                          80,
                          40,
                          "c_fit"
                        )}
                        alt="Flipkart"
                      />
                    </a>
                  )}
                  {trustData.meeshoLink && trustData.meeshoLogo && (
                    <a
                      href={trustData.meeshoLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={optimizeCloudinary(
                          trustData.meeshoLogo,
                          80,
                          40,
                          "c_fit"
                        )}
                        alt="Meesho"
                      />
                    </a>
                  )}
                </div>
              )}
              {trustData?.makeInIndiaLogo && (
                <img
                  src={optimizeCloudinary(
                    trustData.makeInIndiaLogo,
                    120,
                    60,
                    "c_fit"
                  )}
                  alt="Make In India"
                  className="sp-mii-logo"
                />
              )}
              <div className="sp-footer-gst">
                <Shield size={14} />
                GSTIN: 33ANCPH3967L1ZT
              </div>
            </div>

            <nav className="sp-footer-nav">
              <h4>Quick Links</h4>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-conditions">Terms & Conditions</Link>
              <Link to="/shipping-delivery">Shipping & Delivery</Link>
              <Link to="/cancellation-refund">Cancellation & Refund</Link>
            </nav>

            <div className="sp-footer-addr">
              <h4>Our Locations</h4>
              <address>
                <div>
                  <strong>Unit 1</strong>
                  <span>1-12, Thondamuthur Road, Coimbatore - 641007</span>
                </div>
                <div>
                  <strong>Unit 4</strong>
                  <span>
                    GRVR Farms, PSG Rangasamy Nagar, Vedapatti,
                    Coimbatore - 641007
                  </span>
                </div>
              </address>
            </div>

            <div className="sp-footer-social">
              <h4>Connect</h4>
              <div className="sp-social-row">
                {trustData?.instagramLink && (
                  <a
                    href={trustData.instagramLink}
                    target="_blank"
                    rel="noreferrer"
                    className="sp-social-btn insta"
                  >
                    <Instagram size={16} />
                    Instagram
                  </a>
                )}
                {trustData?.youtubeLink && (
                  <a
                    href={trustData.youtubeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="sp-social-btn yt"
                  >
                    <Youtube size={16} />
                    YouTube
                  </a>
                )}
                {trustData?.facebookLink && (
                  <a
                    href={trustData.facebookLink}
                    target="_blank"
                    rel="noreferrer"
                    className="sp-social-btn fb"
                  >
                    <Facebook size={16} />
                    Facebook
                  </a>
                )}
                {trustData?.linkedinLink && (
                  <a
                    href={trustData.linkedinLink}
                    target="_blank"
                    rel="noreferrer"
                    className="sp-social-btn li"
                  >
                    <Linkedin size={16} />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="sp-footer-bottom">
            © {new Date().getFullYear()} BafnaToys. All rights reserved.
          </div>
        </footer>
      )}

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div
          className="sp-drawer-overlay"
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            className="sp-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sp-drawer-head">
              <h3>
                <Filter size={18} />
                Filters
              </h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="sp-drawer-body">
              <h4>Price Range</h4>
              <input
                type="range"
                min="0"
                max="10000"
                value={maxPriceInput || 0}
                onChange={(e) => setMaxPriceInput(Number(e.target.value))}
                className="sp-range"
              />
              <div className="sp-price-row">
                <div className="sp-price-field">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPriceInput}
                    onChange={(e) =>
                      setMinPriceInput(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
                <span className="sp-price-dash">—</span>
                <div className="sp-price-field">
                  <span>₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPriceInput}
                    onChange={(e) =>
                      setMaxPriceInput(
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>
              <button
                className="sp-apply-btn"
                onClick={() => {
                  handleApplyPrice();
                  setMobileFilterOpen(false);
                }}
              >
                Apply
              </button>
              <button className="sp-clear-drawer" onClick={handleClear}>
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingCheckoutButton />
    </div>
  );
};

export default Products;