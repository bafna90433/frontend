import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
  WifiOff,
  RefreshCw,
  Package,
  Zap,
  MapPin,
  Heart,
  TrendingUp,
  IndianRupee,
  Award,
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
// ANIMATED COUNTER
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
// SKELETON CARD
// ════════════════════════════════════════════════════════════

const ProductSkeleton: React.FC = () => (
  <div className="sp-skeleton-card">
    <div className="sp-skeleton-img sp-shimmer" />
    <div className="sp-skeleton-body">
      <div className="sp-skeleton-line sp-shimmer" style={{ width: "75%" }} />
      <div className="sp-skeleton-line sp-shimmer" style={{ width: "50%" }} />
      <div
        className="sp-skeleton-line short sp-shimmer"
        style={{ width: "35%" }}
      />
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════

const Products: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeDeals, setActiveDeals] = useState<HotDeal[]>([]);
  const [trustData, setTrustData] = useState<any>(null);
  
  // ✅ GRID CONFIG STATE
  const [gridConfig, setGridConfig] = useState({ pc: 5, mobile: 2 });

  const [loading, setLoading] = useState(true);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const searchTerm = params.get("search") || params.get("q") || "";

  const marqueeItems = useMemo(
    () => [
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
    ],
    []
  );

  // ══════════════════════════════════════════════════
  // EFFECTS
  // ══════════════════════════════════════════════════

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname, categoryId]);

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

    // ✅ FETCH DYNAMIC GRID LAYOUT
    api
      .get("/grid-layout")
      .then((r) => {
        if (r.data) {
          setGridConfig({
            pc: r.data.pcColumns || 5,
            mobile: r.data.mobileColumns || 2,
          });
        }
      })
      .catch(console.error);
  }, []);

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
          setError(
            e?.response?.data?.message || e.message || "Failed to load"
          );
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

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, searchTerm, sortBy, activePriceFilter]);

  // ══════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════

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

  const handleCatClick = useCallback(
    (cat: Category) => {
      if (cat.link?.trim()) {
        cat.link.startsWith("http")
          ? (window.location.href = cat.link)
          : navigate(cat.link);
      } else {
        navigate(`/?category=${cat._id}`);
      }
    },
    [navigate]
  );

  const goPage = useCallback((n: number) => {
    setCurrentPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ══════════════════════════════════════════════════
  // COMPUTED
  // ══════════════════════════════════════════════════

  const displayed = useMemo(() => {
    let f = [...allProducts];

    if (categoryId) {
      f = f.filter((p) =>
        typeof p.category === "string"
          ? p.category === categoryId
          : p.category?._id === categoryId
      );
    }

    if (searchTerm) {
      const n = searchTerm.toLowerCase();
      f = f.filter(
        (p) =>
          p.name.toLowerCase().includes(n) ||
          (p.sku || "").toLowerCase().includes(n)
      );
    }

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

    if (activePriceFilter) {
      f = f.filter(
        (p) =>
          (p.price || 0) >= activePriceFilter.min &&
          (p.price || 0) <= activePriceFilter.max
      );
    }

    if (sortBy === "price-low")
      f.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price-high")
      f.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "name-asc")
      f.sort((a, b) => a.name.localeCompare(b.name));

    return f;
  }, [allProducts, categoryId, searchTerm, sortBy, activeDeals, activePriceFilter]);

  const totalPages = Math.ceil(displayed.length / ITEMS_PER_PAGE);

  const paginated = useMemo(
    () =>
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

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════

  return (
    <div className="sp-wrapper">
      {/* ✅ DYNAMIC GRID SETTINGS */}
      <style>
        {`
          .sp-grid {
            grid-template-columns: repeat(${gridConfig.pc}, 1fr) !important;
          }
          @media (max-width: 768px) {
            .sp-grid {
              grid-template-columns: repeat(${gridConfig.mobile}, 1fr) !important;
            }
          }
        `}
      </style>

      <CategorySEO
        title={seoTitle}
        description="Buy bulk toys at wholesale prices from India's leading B2B toy supplier."
        keywords="wholesale toys, bulk toys, B2B toys India"
        url={`https://bafnatoys.com${location.pathname}${location.search}`}
        jsonLd={{}}
      />

      {/* ═══ MARQUEE TICKER ═══ */}
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

      {/* ═══ HERO BANNER (BLOB MESH) ═══ */}
      <section className="sp-hero">
        {/* Animated Blob Background */}
        <div className="sp-hero-glow sp-hero-glow-1" />
        <div className="sp-hero-glow sp-hero-glow-2" />
        <div className="sp-hero-glow sp-hero-glow-3" />

        {/* ═══ DESKTOP HERO ═══ */}
        <div className="sp-hero-grid sp-hero-desktop">
          <div className="sp-hero-content">
            <div className="sp-hero-badge">
              <Factory size={13} />
              Direct from Manufacturer
            </div>
            <h1 className="sp-hero-title">
              India's Trusted
              <span className="sp-hero-highlight"> B2B Toy Manufacturer</span>
            </h1>
            <p className="sp-hero-sub">
              Premium Wholesale Toys for Toy Stores, Supermarket, Retail Stores and Resellers
            </p>
            <div className="sp-hero-features">
              <div className="sp-hero-feature">
                <div className="sp-hero-feature-icon">
                  <Truck size={16} />
                </div>
                <div>
                  <strong>Free Delivery</strong>
                  <span>Orders ₹5000+</span>
                </div>
              </div>
              <div className="sp-hero-feature">
                <div className="sp-hero-feature-icon">
                  <Shield size={16} />
                </div>
                <div>
                  <strong>BIS Certified</strong>
                  <span>All Products</span>
                </div>
              </div>
              <div className="sp-hero-feature">
                <div className="sp-hero-feature-icon">
                  <Package size={16} />
                </div>
                <div>
                  <strong>400+ Products</strong>
                  <span>Wide Range</span>
                </div>
              </div>
            </div>
          </div>
          <div className="sp-hero-visual">
            <div className="sp-hero-offer-ring">
              <div className="sp-hero-offer-inner">
                <span className="sp-offer-up">UP TO</span>
                <span className="sp-offer-num">50%</span>
                <span className="sp-offer-label">& MORE OFF MRP</span>
              </div>
            </div>
            <div className="sp-hero-float sp-hero-float-1">
              <Zap size={14} />
              Fast Moving
            </div>
            <div className="sp-hero-float sp-hero-float-2">
              <TrendingUp size={14} />
              High Margins
            </div>
          </div>
        </div>

        {/* ═══ MOBILE HERO ═══ */}
        <div className="sp-hero-mobile">
          <div className="sp-mh-top">
            <div className="sp-mh-badge">
              <div className="sp-mh-badge-dot" />
              <Factory size={11} />
              <span>Direct from Manufacturer</span>
            </div>
            <h1 className="sp-mh-title">
              India's Trusted
              <br />
              <span className="sp-mh-gradient">B2B Toy Manufacturer</span>
            </h1>
            <p className="sp-mh-sub">
              Premium Wholesale Toys for Toy Stores, Supermarket, Retail Stores and Resellers
            </p>
          </div>

          <div className="sp-mh-offer-section">
            <div className="sp-mh-offer-card">
              <div className="sp-mh-offer-visual">
                <div className="sp-mh-offer-ring">
                  <div className="sp-mh-offer-inner">
                    <span className="sp-mh-offer-up">UP TO</span>
                    <span className="sp-mh-offer-num">50<small>%</small></span>
                    <span className="sp-mh-offer-tag">OFF MRP</span>
                  </div>
                </div>
              </div>
              <div className="sp-mh-offer-perks">
                <div className="sp-mh-perk">
                  <div className="sp-mh-perk-icon sp-mh-perk-green">
                    <Shield size={13} />
                  </div>
                  <div className="sp-mh-perk-text">
                    <strong>BIS Certified</strong>
                    <span>All products tested</span>
                  </div>
                </div>
                <div className="sp-mh-perk">
                  <div className="sp-mh-perk-icon sp-mh-perk-blue">
                    <Package size={13} />
                  </div>
                  <div className="sp-mh-perk-text">
                    <strong>400+ Products</strong>
                    <span>Huge catalogue</span>
                  </div>
                </div>
                <div className="sp-mh-perk">
                  <div className="sp-mh-perk-icon sp-mh-perk-purple">
                    <Truck size={13} />
                  </div>
                  <div className="sp-mh-perk-text">
                    <strong>Free Delivery</strong>
                    <span>Orders above ₹5K</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sp-mh-stats">
            <div className="sp-mh-stat">
              <div className="sp-mh-stat-icon">
                <Star size={12} fill="#fbbf24" color="#fbbf24" />
              </div>
              <div className="sp-mh-stat-info">
                <strong>4.8/5</strong>
                <span>Rating</span>
              </div>
            </div>
            <div className="sp-mh-stat-divider" />
            <div className="sp-mh-stat">
              <div className="sp-mh-stat-icon">
                <Users size={12} />
              </div>
              <div className="sp-mh-stat-info">
                <strong>4,900+</strong>
                <span>Retailers</span>
              </div>
            </div>
            <div className="sp-mh-stat-divider" />
            <div className="sp-mh-stat">
              <div className="sp-mh-stat-icon">
                <Factory size={12} />
              </div>
              <div className="sp-mh-stat-info">
                <strong>Direct</strong>
                <span>Manufacturer</span>
              </div>
            </div>
            <div className="sp-mh-stat-divider" />
            <div className="sp-mh-stat">
              <div className="sp-mh-stat-icon">
                <IndianRupee size={12} />
              </div>
              <div className="sp-mh-stat-info">
                <strong>Best</strong>
                <span>Prices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INSTAGRAM STRIP ═══ */}
      <a
        href="https://www.instagram.com/bafna_toys"
        target="_blank"
        rel="noopener noreferrer"
        className="sp-insta-strip"
      >
        <Instagram size={15} />
        <span>
          Check out our toy videos on Instagram <strong>@bafna_toys</strong>
        </span>
        <ExternalLink size={13} />
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

      {/* ═══ MAIN LAYOUT (SIDEBAR + GRID) ═══ */}
      <div className="sp-layout">
        {/* SIDEBAR */}
        <aside className="sp-sidebar" role="complementary">
          <div className="sp-sb-inner">
            <div className="sp-sb-section">
              <h3 className="sp-sb-heading">
                <LayoutGrid size={14} />
                Categories
              </h3>
              <ul className="sp-sb-list">
                {categories.map((cat) => {
                  const isActive = categoryId === cat._id || (!categoryId && cat.link === "/");
                  return (
                    <li
                      key={cat._id}
                      className={isActive ? "active" : ""}
                      onClick={() => handleCatClick(cat)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleCatClick(cat)}
                    >
                      {cat.image ? (
                        <img
                          src={optimizeCloudinary(cat.image, 36, 36)}
                          alt=""
                          className="sp-sb-cat-img"
                        />
                      ) : (
                        <span className="sp-sb-dot" />
                      )}
                      <span>{cat.name}</span>
                      <ChevronRight size={14} className="sp-sb-arrow" />
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="sp-sb-divider" />

            <div className="sp-sb-section">
              <h3 className="sp-sb-heading">
                <SlidersHorizontal size={14} />
                Price Range
              </h3>
              <div className="sp-range-wrap">
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={maxPriceInput || 0}
                  onChange={(e) => setMaxPriceInput(Number(e.target.value))}
                  className="sp-range"
                />
                <div className="sp-range-labels">
                  <span>₹0</span>
                  <span>₹{maxPriceInput || 0}</span>
                </div>
              </div>
              <div className="sp-price-row">
                <div className="sp-price-field">
                  <label>Min</label>
                  <div className="sp-price-input-wrap">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={minPriceInput}
                      onChange={(e) =>
                        setMinPriceInput(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>
                </div>
                <span className="sp-price-dash">–</span>
                <div className="sp-price-field">
                  <label>Max</label>
                  <div className="sp-price-input-wrap">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="5000"
                      value={maxPriceInput}
                      onChange={(e) =>
                        setMaxPriceInput(
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    />
                  </div>
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
          {/* Mobile Horizontal Categories (Only shows on mobile) */}
          <div className="sp-mob-cats">
            <div className="sp-mob-cats-track">
              {categories.map((cat) => {
                const isActive = categoryId === cat._id || (!categoryId && cat.link === "/");
                return (
                  <button
                    key={cat._id}
                    className={`sp-mob-cat ${isActive ? "active" : ""}`}
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
                        <Package size={18} />
                      )}
                    </div>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating Glass Toolbar */}
          <div className="sp-toolbar">
            <div className="sp-toolbar-left">
              <button
                className="sp-back-btn sp-mob-only"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="sp-toolbar-info">
                <h2 className="sp-toolbar-title">
                  {searchTerm ? `"${searchTerm}"` : catName || "All Toys"}
                </h2>
                <span className="sp-toolbar-count">
                  {displayed.length} product{displayed.length !== 1 && "s"}
                </span>
              </div>
            </div>
            <div className="sp-toolbar-right">
              <button
                className="sp-filter-toggle sp-mob-only"
                onClick={() => setMobileFilterOpen(true)}
              >
                <Filter size={15} />
                <span>Filters</span>
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
            <div className="sp-active-filters">
              {searchTerm && (
                <span className="sp-filter-chip">
                  <Search size={12} />
                  {searchTerm}
                  <button onClick={() => navigate(location.pathname)}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {activePriceFilter && (
                <span className="sp-filter-chip">
                  ₹{activePriceFilter.min} – ₹{activePriceFilter.max}
                  <button onClick={() => setActivePriceFilter(null)}>
                    <X size={12} />
                  </button>
                </span>
              )}
              <button className="sp-clear-all" onClick={handleClear}>
                Clear All
              </button>
            </div>
          )}

          {/* Content States */}
          {loading ? (
            <div className="sp-grid">
              {Array.from({ length: 15 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="sp-error-state">
              <div className="sp-error-icon">
                <WifiOff size={44} />
              </div>
              <h2>Connection Failed</h2>
              <p>
                {error === "Network Error"
                  ? "It looks like you're offline or the server is unreachable."
                  : error}
              </p>
              <button
                className="sp-error-retry"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon">
                <Search size={44} />
              </div>
              <h2>No products found</h2>
              <p>Try adjusting your filters or browse a different category</p>
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
                <nav className="sp-pagination" aria-label="Page navigation">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => goPage(currentPage - 1)}
                    aria-label="Previous page"
                    className="sp-page-arrow"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {getPages().map((pg, i) => (
                    <button
                      key={i}
                      className={`sp-page-btn ${
                        pg === currentPage ? "active" : ""
                      } ${pg === "..." ? "dots" : ""}`}
                      disabled={pg === "..."}
                      onClick={() => typeof pg === "number" && goPage(pg)}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => goPage(currentPage + 1)}
                    aria-label="Next page"
                    className="sp-page-arrow"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>

      {/* ═══ BENTO TRUST STATS ═══ */}
      <section className="sp-trust-section">
        <div className="sp-trust-grid">
          {[
            {
              icon: <Star size={28} />,
              gradient: "linear-gradient(135deg, #fef3c7, #fde68a)",
              color: "#b45309",
              title: "4.8/5",
              sub: "Average Rating",
            },
            {
              icon: <Users size={24} />,
              gradient: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
              color: "#1d4ed8",
              title: "4,900+",
              sub: "Active Retailers",
            },
            {
              icon: <Truck size={24} />,
              gradient: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
              color: "#047857",
              title: "All India",
              sub: "Door Delivery",
            },
            {
              icon: <Factory size={24} />,
              gradient: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
              color: "#6d28d9",
              title: "Direct",
              sub: "Manufacturer",
            },
            {
              icon: <Award size={24} />,
              gradient: "linear-gradient(135deg, #fce7f3, #fbcfe8)",
              color: "#9d174d",
              title: "BIS Certified",
              sub: "All Products",
            }
          ].map((s, i) => (
            <div className="sp-trust-card" key={i}>
              <div
                className="sp-trust-icon"
                style={{ background: s.gradient, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="sp-trust-info">
                <strong>{s.title}</strong>
                <span>{s.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FACTORY SECTION (NOW FULL WIDTH) ═══ */}
      {!loading && trustData && (
        <section className="sp-factory">
          <div className="sp-factory-inner">
            <div className="sp-section-header">
              <span className="sp-section-badge">
                <Factory size={14} />
                Our Facility
              </span>
              <h2 className="sp-section-title">Inside Our Factory</h2>
              <p className="sp-section-desc">
                State-of-the-art manufacturing with quality at every step
              </p>
            </div>

            <div className="sp-factory-counter">
              <div className="sp-counter-card">
                <div className="sp-counter-number">
                  <AnimatedCounter
                    target={trustData.retailerCount || "4901+"}
                  />
                </div>
                <p>Happy Retailers Across India</p>
              </div>
            </div>

            <div className="sp-factory-grid">
              {trustData.factoryVisuals &&
              trustData.factoryVisuals.length > 0
                ? trustData.factoryVisuals.map(
                    (item: any, i: number) =>
                      item.image && (
                        <div className="sp-factory-card" key={i}>
                          <div className="sp-factory-card-img">
                            <img
                              src={optimizeCloudinary(item.image, 400, 280)}
                              alt={item.label || `Process ${i + 1}`}
                              loading="lazy"
                            />
                          </div>
                          {item.label && (
                            <div className="sp-factory-card-label">
                              {item.label}
                            </div>
                          )}
                        </div>
                      )
                  )
                : [
                    { img: trustData.manufacturingUnit, label: "Manufacturing" },
                    { img: trustData.packingDispatch, label: "Packing & Dispatch" },
                    { img: trustData.warehouseStorage, label: "Warehouse Storage" },
                  ].map(
                    (item, i) =>
                      item.img && (
                        <div className="sp-factory-card" key={i}>
                          <div className="sp-factory-card-img">
                            <img
                              src={optimizeCloudinary(item.img, 400, 280)}
                              alt={item.label}
                              loading="lazy"
                            />
                          </div>
                          <div className="sp-factory-card-label">
                            {item.label}
                          </div>
                        </div>
                      )
                  )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BIS SECTION ═══ */}
      {!loading && trustData?.factoryImage && (
        <section className="sp-bis">
          <div className="sp-bis-inner">
            <div className="sp-bis-content">
              <div className="sp-bis-badge">
                <Shield size={16} />
                Quality Assured
              </div>
              <h3>All Toys Are BIS Certified</h3>
              <p>
                Every product meets Indian safety standards for complete peace
                of mind
              </p>
              <div className="sp-bis-gst">GSTIN: 33ANCPH3967L1ZT</div>
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
      {!loading && trustData?.customerReviews?.length > 0 && (
        <section className="sp-reviews">
          <div className="sp-reviews-inner">
            <div className="sp-section-header">
              <span className="sp-section-badge">
                <Heart size={14} />
                Testimonials
              </span>
              <h2 className="sp-section-title">Retailers Love Us</h2>
              <p className="sp-section-desc">
                Trusted by thousands of verified businesses across India
              </p>
            </div>

            <div className="sp-reviews-grid">
              {trustData.customerReviews
                .slice(0, 4)
                .map((r: any, i: number) => (
                  <div className="sp-review-card" key={i}>
                    <div className="sp-review-img">
                      <img
                        src={optimizeCloudinary(r.image, 400, 400)}
                        alt={r.reviewerName}
                        loading="lazy"
                      />
                    </div>
                    <div className="sp-review-body">
                      <div className="sp-review-stars">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            size={14}
                            fill={si < (r.rating || 5) ? "#f59e0b" : "none"}
                            color={si < (r.rating || 5) ? "#f59e0b" : "#e2e8f0"}
                          />
                        ))}
                      </div>
                      <p className="sp-review-text">"{r.reviewText}"</p>
                      <div className="sp-review-author">
                        <strong>{r.reviewerName}</strong>
                        <span className="sp-verified-badge">
                          <BadgeCheck size={12} />
                          Verified Buyer
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ FOOTER WITH WAVE ═══ */}
      {!loading && (
        <footer className="sp-footer">
          <div className="sp-footer-wave" />
          <div className="sp-footer-top">
            <div className="sp-footer-inner">
              <div className="sp-footer-brand">
                <div className="sp-footer-logo">
                  <span className="sp-logo-icon">🧸</span>
                  BafnaToys
                </div>
                <p>
                  Inspiring imagination through play. Premium wholesale toys
                  with the best deals and fast delivery across India.
                </p>
                {trustData && (
                  <div className="sp-marketplace-row">
                    <span className="sp-mp-label">Also available on:</span>
                    <div className="sp-mp-logos">
                      {trustData.amazonLink && trustData.amazonLogo && (
                        <a href={trustData.amazonLink} target="_blank" rel="noreferrer">
                          <img src={optimizeCloudinary(trustData.amazonLogo, 80, 40, "c_fit")} alt="Amazon" />
                        </a>
                      )}
                      {trustData.flipkartLink && trustData.flipkartLogo && (
                        <a href={trustData.flipkartLink} target="_blank" rel="noreferrer">
                          <img src={optimizeCloudinary(trustData.flipkartLogo, 80, 40, "c_fit")} alt="Flipkart" />
                        </a>
                      )}
                      {trustData.meeshoLink && trustData.meeshoLogo && (
                        <a href={trustData.meeshoLink} target="_blank" rel="noreferrer">
                          <img src={optimizeCloudinary(trustData.meeshoLogo, 80, 40, "c_fit")} alt="Meesho" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {trustData?.makeInIndiaLogo && (
                  <img
                    src={optimizeCloudinary(trustData.makeInIndiaLogo, 120, 60, "c_fit")}
                    alt="Make In India"
                    className="sp-mii-logo"
                  />
                )}
                <div className="sp-footer-gst">
                  <Shield size={13} />
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
              <div className="sp-footer-locations">
                <h4>Our Locations</h4>
                <address>
                  <div className="sp-location-item">
                    <MapPin size={14} />
                    <div>
                      <strong>Unit 1</strong>
                      <span>Bafna Toys 1, Shasha Warehousing, Thondamuthur Main Road, Coimbatore - 641007</span>
                    </div>
                  </div>
                  <div className="sp-location-item">
                    <MapPin size={14} />
                    <div>
                      <strong>Unit 2</strong>
                      <span>Bafna Toys 2, Prashant Textiles Mills Warehouse, Sundapalayam, Coimbatore - 641 007</span>
                    </div>
                  </div>
                  <div className="sp-location-item">
                    <MapPin size={14} />
                    <div>
                      <strong>Unit 3</strong>
                      <span>Bafna Toys 3 - 1-12 Warehouse, Rangasamy Nagar, Vedapatti, Coimbatore - 641007</span>
                    </div>
                  </div>
                  <div className="sp-location-item">
                    <MapPin size={14} />
                    <div>
                      <strong>Unit 4</strong>
                      <span>Bafna Toys 4 - GRVR Farms, PSG Rangasamy Nagar, Vedapatti, Coimbatore - 641007</span>
                    </div>
                  </div>
                </address>
              </div>
              <div className="sp-footer-connect">
                <h4>Connect With Us</h4>
                <div className="sp-social-stack">
                  {trustData?.instagramLink && (
                    <a href={trustData.instagramLink} target="_blank" rel="noreferrer" className="sp-social-link sp-social-insta">
                      <Instagram size={16} /> Instagram
                    </a>
                  )}
                  {trustData?.youtubeLink && (
                    <a href={trustData.youtubeLink} target="_blank" rel="noreferrer" className="sp-social-link sp-social-yt">
                      <Youtube size={16} /> YouTube
                    </a>
                  )}
                  {trustData?.facebookLink && (
                    <a href={trustData.facebookLink} target="_blank" rel="noreferrer" className="sp-social-link sp-social-fb">
                      <Facebook size={16} /> Facebook
                    </a>
                  )}
                  {trustData?.linkedinLink && (
                    <a href={trustData.linkedinLink} target="_blank" rel="noreferrer" className="sp-social-link sp-social-li">
                      <Linkedin size={16} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="sp-footer-bottom">
            <span>© {new Date().getFullYear()} BafnaToys. All rights reserved.</span>
          </div>
        </footer>
      )}

      {/* ═══ MOBILE FILTER DRAWER ═══ */}
      {mobileFilterOpen && (
        <div className="sp-drawer-overlay" onClick={() => setMobileFilterOpen(false)}>
          <div className="sp-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="sp-drawer-handle" />
            <div className="sp-drawer-head">
              <h3><Filter size={17} /> Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)} aria-label="Close filters"><X size={18} /></button>
            </div>
            <div className="sp-drawer-body">
              <div className="sp-drawer-section">
                <h4>Price Range</h4>
                <div className="sp-range-wrap">
                  <input type="range" min="0" max="10000" value={maxPriceInput || 0} onChange={(e) => setMaxPriceInput(Number(e.target.value))} className="sp-range" />
                  <div className="sp-range-labels"><span>₹0</span><span>₹{maxPriceInput || 0}</span></div>
                </div>
                <div className="sp-price-row">
                  <div className="sp-price-field">
                    <label>Min</label>
                    <div className="sp-price-input-wrap">
                      <span>₹</span>
                      <input type="number" placeholder="0" value={minPriceInput} onChange={(e) => setMinPriceInput(e.target.value ? Number(e.target.value) : "")} />
                    </div>
                  </div>
                  <span className="sp-price-dash">–</span>
                  <div className="sp-price-field">
                    <label>Max</label>
                    <div className="sp-price-input-wrap">
                      <span>₹</span>
                      <input type="number" placeholder="5000" value={maxPriceInput} onChange={(e) => setMaxPriceInput(e.target.value ? Number(e.target.value) : "")} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="sp-drawer-actions">
                <button className="sp-apply-btn" onClick={() => { handleApplyPrice(); setMobileFilterOpen(false); }}>Apply Filters</button>
                <button className="sp-clear-drawer-btn" onClick={handleClear}>Clear All</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FloatingCheckoutButton />
    </div>
  );
};

export default Products;