import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api, { MEDIA_URL } from "../utils/api";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import "../styles/Products.css"; 
import CategorySEO from "./CategorySEO";
import FloatingCheckoutButton from "./FloatingCheckoutButton";
import { X, ChevronRight, ChevronLeft, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@mui/material";

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

type Banner = {
  _id: string;
  imageUrl: string;
  link?: string;
};

type HotDeal = {
  productId: string;
  discountType: "PERCENT" | "FLAT" | "NONE";
  discountValue: number;
  endsAt: string | null;
};

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

// ✅ Added `crop` parameter with default "c_fill"
const optimizeCloudinary = (url: string | undefined, w: number, h: number, crop: string = "c_fill") => {
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

// ==========================================
// Number Animation (Timer)
// ==========================================
const AnimatedCounter: React.FC<{ target: string | number; duration?: number }> = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const targetString = String(target);
    const targetNumber = parseInt(targetString.replace(/\D/g, ""), 10) || 49000;
    
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * targetNumber));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(targetNumber);
      }
    };

    window.requestAnimationFrame(step);
  }, [target, duration]);

  return (
    <>{count.toLocaleString('en-IN')}{String(target).replace(/[0-9.,]/g, "")}</>
  );
};

const Products: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeDeals, setActiveDeals] = useState<HotDeal[]>([]);
  const [trustData, setTrustData] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<string>("default");

  const [minPriceInput, setMinPriceInput] = useState<number | "">(0);
  const [maxPriceInput, setMaxPriceInput] = useState<number | "">(5000);
  const [activePriceFilter, setActivePriceFilter] = useState<{min: number, max: number} | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 25; 

  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const searchTerm = params.get("search") || params.get("q") || "";

  // Marquee items data
  const marqueeItems = [
    { icon: "📦", text: "Small MOQ Ordering" },
    { icon: "🧸", text: "400+ Toy Products" },
    { icon: "🚚", text: "All-India Door Delivery" },
    { icon: "💵", text: "Higher Retail Margins" },
    { icon: "🏭", text: "Factory Direct Supply" },
    { icon: "📊", text: "Fast Moving Toys" },
    { icon: "🎁", text: "Attractive Packaging" },
    { icon: "🧾", text: "Easy Ordering for Retailers" },
    { icon: "🔁", text: "Regular New Toy Launches" },
    { icon: "🏷️", text: "Beat E-Commerce Prices" }
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, categoryId]);

  useEffect(() => {
    api.get("/categories")
      .then((res) => setCategories(res.data?.categories || res.data || []))
      .catch((err) => console.error("Failed to load categories", err));

    api.get("/banners")
      .then((res) => {
        const fetchedBanners = Array.isArray(res.data?.banners) 
          ? res.data.banners 
          : (Array.isArray(res.data) ? res.data : []);
        setBanners(fetchedBanners);
      })
      .catch((err) => console.error("Failed to load banners", err))
      .finally(() => setBannersLoading(false));

    api.get("/home-config")
      .then((res) => {
        const items = res.data?.hotDealsItemsResolved || res.data?.hotDealsItems || [];
        const mappedDeals = items.map((it: any) => ({
          productId: it.productId || it.product?._id,
          discountType: it.discountType || "NONE",
          discountValue: Number(it.discountValue || 0),
          endsAt: it.endsAt || null,
        }));
        setActiveDeals(mappedDeals);
      })
      .catch((err) => console.error("Failed to load deals", err));

    api.get("/trust-settings")
      .then((res) => setTrustData(res.data))
      .catch((err) => console.error("Failed to load trust settings", err));
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get("/products", {
          signal: controller.signal,
          params: {
            ...(categoryId ? { category: categoryId } : {}),
            ...(searchTerm ? { search: searchTerm } : {}),
          },
        });

        if (!alive) return;

        const arr: any[] = Array.isArray(res.data)
          ? res.data
          : res.data?.products || res.data?.docs || [];

        setAllProducts(arr.map(cleanProduct));
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.message || err.message || "Failed to load products");
        setAllProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [location.search, categoryId, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, searchTerm, sortBy, activePriceFilter]);

  const handleApplyPriceFilter = () => {
    setActivePriceFilter({
      min: Number(minPriceInput) || 0,
      max: Number(maxPriceInput) || Infinity,
    });
  };

  const displayed = useMemo(() => {
    let filtered = [...allProducts];

    if (categoryId) {
      filtered = filtered.filter((p) =>
        typeof p.category === "string"
          ? p.category === categoryId
          : p.category?._id === categoryId
      );
    }

    if (searchTerm) {
      const n = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(n) ||
          (p.sku || "").toLowerCase().includes(n)
      );
    }

    if (activeDeals.length > 0) {
      filtered = filtered.map((p) => {
        const deal = activeDeals.find((d) => d.productId === p._id);
        if (deal) {
          return {
            ...p,
            hotDealType: deal.discountType,
            hotDealValue: deal.discountValue,
            sale_end_time: deal.endsAt || undefined,
          };
        }
        return p;
      });
    }

    if (activePriceFilter) {
      filtered = filtered.filter((p) => {
        const price = p.price || 0;
        return price >= activePriceFilter.min && price <= activePriceFilter.max;
      });
    }

    if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [allProducts, categoryId, searchTerm, sortBy, activeDeals, activePriceFilter]);

  const totalPages = Math.ceil(displayed.length / ITEMS_PER_PAGE);

  const paginatedProducts = displayed.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryName = categoryId
    ? categories.find((c) => c._id === categoryId)?.name ||
      (typeof displayed[0]?.category === "object"
        ? displayed[0]?.category?.name
        : typeof displayed[0]?.category === "string"
        ? displayed[0]?.category
        : "")
    : "";

  const seoTitle = categoryName
    ? `Wholesale ${categoryName} Supplier | Bafna Toys`
    : searchTerm
    ? `Search results for "${searchTerm}"`
    : "Shop Wholesale Toys | Bafna Toys";

  const seoDescription =
    "Buy bulk toys including dolls, friction cars, pullback series & more at wholesale prices.";

  const seoUrl = `https://bafnatoys.com${location.pathname}${location.search}`;

  const handleClearFilters = () => {
    setSortBy("default");
    setActivePriceFilter(null);
    setMinPriceInput(0);
    setMaxPriceInput(5000);
    navigate("/products");
  };

  const handleCategoryClick = (cat: Category) => {
    if (cat.link && cat.link.trim() !== "") {
      if (cat.link.startsWith("http")) {
        window.location.href = cat.link;
      } else {
        navigate(cat.link);
      }
    } else {
      navigate(`/products?category=${cat._id}`);
    }
  };

  return (
    <div className="fw-shop-wrapper">
      <CategorySEO
        title={seoTitle}
        description={seoDescription}
        keywords="wholesale toys"
        url={seoUrl}
        jsonLd={{}}
      />

      <div className="fw-marquee-container">
        <div className="fw-marquee-content">
          {marqueeItems.map((item, index) => (
            <React.Fragment key={index}>
              <span className="fw-marquee-item">
                <span className="fw-marquee-icon">{item.icon}</span>
                <span className="fw-marquee-text">{item.text}</span>
              </span>
              <span className="fw-marquee-separator">•</span>
            </React.Fragment>
          ))}
          {marqueeItems.map((item, index) => (
            <React.Fragment key={`dup-${index}`}>
              <span className="fw-marquee-item">
                <span className="fw-marquee-icon">{item.icon}</span>
                <span className="fw-marquee-text">{item.text}</span>
              </span>
              <span className="fw-marquee-separator">•</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="fw-main-container">
        <aside className="fw-sidebar desktop-only">
          <div className="fw-sidebar-content">
            <div className="fw-sidebar-section">
              <h3 className="fw-sidebar-title">
                <LayoutGrid size={16} className="title-icon" /> CATEGORIES
              </h3>
              <ul className="fw-cat-list">
                <li
                  className={!categoryId ? "active" : ""}
                  onClick={() => navigate("/products")}
                >
                  <div className="cat-list-inner">
                    <div className="cat-icon-placeholder">🌟</div>
                    <span>All Toys</span>
                  </div>
                  <ChevronRight size={14} className="cat-arrow" />
                </li>

                {categories.map((cat) => {
                  const isActive = categoryId === cat._id;
                  const imgSrc = optimizeCloudinary(cat.image, 40, 40);

                  return (
                    <li
                      key={cat._id}
                      className={isActive ? "active" : ""}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      <div className="cat-list-inner">
                        {cat.image ? (
                          <img src={imgSrc} alt={cat.name} className="cat-list-img" />
                        ) : (
                          <div className="cat-icon-placeholder">📦</div>
                        )}
                        <span>{cat.name}</span>
                      </div>
                      <ChevronRight size={14} className="cat-arrow" />
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="fw-sidebar-section">
              <h3 className="fw-sidebar-title mt-4">
                <SlidersHorizontal size={16} className="title-icon" /> PRICE RANGE
              </h3>
              
              <div className="fw-price-slider-wrap">
                 <input 
                   type="range" 
                   min="0" 
                   max="10000" 
                   value={maxPriceInput || 0} 
                   onChange={(e) => setMaxPriceInput(Number(e.target.value))}
                   className="fw-custom-slider" 
                 />
              </div>

              <div className="fw-price-inputs">
                <div className="price-input-box">
                  <span className="rupee-icon">₹</span>
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minPriceInput} 
                    onChange={(e) => setMinPriceInput(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
                <span className="price-divider">-</span>
                <div className="price-input-box">
                  <span className="rupee-icon">₹</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxPriceInput} 
                    onChange={(e) => setMaxPriceInput(e.target.value ? Number(e.target.value) : "")}
                  />
                </div>
              </div>

              <button className="fw-apply-btn" onClick={handleApplyPriceFilter}>Apply Filter</button>
            </div>
          </div>
        </aside>

        <main className="fw-main-content">
          <div className="fw-premium-b2b-banner">
            <div className="fw-b2b-left-content">
              <h2 className="fw-b2b-heading">DIRECT FROM MANUFACTURER</h2>
              <h3 className="fw-b2b-subheading">BULK B2B ORDERS ONLY</h3>
              <p className="fw-b2b-desc">For Toy Stores, Supermarkets, Retail Stores & Resellers</p>
              <p className="fw-b2b-delivery">🚚 Free Door Delivery on Orders Above ₹5000</p>
            </div>

            <div className="fw-b2b-right-ribbon">
              <div className="fw-ribbon-text-top"></div>
              
              <div className="fw-ribbon-main-offer">
                <span className="fw-offer-number">50%</span>
                <div className="fw-offer-text-stacked">
                  <span>AND MORE</span>
                  <span>OFF MRP</span>
                </div>
              </div>
              
              <div className="fw-ribbon-text-bottom">BULK B2B ORDERS ONLY</div>
            </div>
          </div>
          
          <a 
            href="https://www.instagram.com/bafna_toys" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="fw-insta-banner"
          >
            <span>📸 Follow us on Instagram for latest updates! @bafna_toys</span>
          </a>

          {!categoryId && !searchTerm && (
            bannersLoading ? (
              <div style={{ width: "100%", padding: "10px 0", boxSizing: "border-box" }}>
                <Skeleton variant="rectangular" width="100%" height="280px" sx={{ borderRadius: "20px" }} />
              </div>
            ) : (
              banners.length > 0 && <BannerSlider banners={banners} />
            )
          )}

          <div className="fw-top-categories mobile-only">
            <div className="category-scroll-container">
              <div className="category-track">
                <div
                  className={`category-item ${!categoryId ? "active" : ""}`}
                  onClick={() => navigate("/products")}
                >
                  <div className="category-circle-wrapper">
                    <div className="category-circle-inner">🌟</div>
                  </div>
                  <span className="category-label">ALL TOYS</span>
                </div>

                {categories.map((cat) => {
                  const isActive = categoryId === cat._id;
                  const imgSrc = optimizeCloudinary(cat.image, 100, 100);

                  return (
                    <div
                      key={cat._id}
                      className={`category-item ${isActive ? "active" : ""}`}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      <div className="category-circle-wrapper">
                        <img
                          src={imgSrc}
                          alt={cat.name}
                          className="category-img"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <span className="category-label">{cat.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="fw-top-bar">
            <button className="fw-back-btn mobile-only" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} /> <span>Back</span>
            </button>

            <div className="fw-top-bar-main">
              <h1 className="fw-page-title">
                {searchTerm ? (
                  `Search: "${searchTerm}" (${displayed.length})`
                ) : categoryName ? (
                  `${categoryName} (${displayed.length})`
                ) : (
                  <>ALL TOYS ({displayed.length})</>
                )}
              </h1>

              <div className="fw-controls-row">
                <div className="fw-sort-container">
                  <span className="fw-sort-label desktop-only">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="fw-sort-select"
                  >
                    <option value="default">Default</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {(searchTerm || activePriceFilter) && (
            <div className="fw-active-filters">
              {searchTerm && (
                <span className="fw-tag">
                  Search: {searchTerm}
                  <X
                    size={14}
                    onClick={() => navigate(location.pathname)}
                    style={{ cursor: "pointer" }}
                  />
                </span>
              )}
              {activePriceFilter && (
                <span className="fw-tag">
                  Price: ₹{activePriceFilter.min} - ₹{activePriceFilter.max}
                  <X
                    size={14}
                    onClick={() => setActivePriceFilter(null)}
                    style={{ cursor: "pointer" }}
                  />
                </span>
              )}
              <span className="fw-clear-all" onClick={handleClearFilters}>
                Clear All
              </span>
            </div>
          )}

          {loading ? (
            <div className="fw-products-grid">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} style={{ width: "100%", padding: 0 }}>
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={320}
                    sx={{ borderRadius: "16px" }}
                  />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="error">Error: {error}</div>
          ) : displayed.length === 0 ? (
            <div className="fw-empty-state">
              <h2>No products found</h2>
              <p>Try adjusting your search, filters or selecting a different category.</p>
              <button onClick={handleClearFilters} className="fw-action-btn">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="fw-products-grid">
                {paginatedProducts.map((p, idx) => (
                  <ProductCard key={p._id} product={p} userRole="customer" index={idx} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="fw-pagination">
                  <button
                    className="fw-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      className={`fw-page-btn ${page === currentPage ? "active" : ""} ${
                        page === "..." ? "dots" : ""
                      }`}
                      disabled={page === "..."}
                      onClick={() => typeof page === "number" && handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    className="fw-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ================= TRUST & FACTORY SECTION ================= */}
          {!loading && trustData && (
            <div className="fw-trust-factory-wrapper">
              <div className="fw-tf-card fw-tf-tour-card">
                <div className="fw-tf-starter-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px 20px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '56px', fontWeight: '900', color: '#ea580c', lineHeight: '1.1', marginBottom: '10px' }}>
                      <AnimatedCounter target={trustData.retailerCount || "49000+"} />
                    </div>
                    <h3 style={{ fontSize: '28px', color: '#1e3a8a', fontWeight: '800', margin: '0' }}>Happy Retailers</h3>
                  </div>
                </div>

                <div className="fw-tf-factory-col">
                  <div className="fw-tf-header">
                    <span className="fw-tf-line"></span>
                    <h3>Inside Bafna Toys Factory</h3>
                    <span className="fw-tf-line"></span>
                  </div>
                  
                  <div className="fw-factory-grid">
                    <div className="fw-factory-item">
                      <img src={optimizeCloudinary(trustData.manufacturingUnit, 300, 250)} alt="Manufacturing Unit" />
                      <div className="fw-factory-label">Manufacturing Unit</div>
                    </div>
                    
                    <div className="fw-factory-item">
                      <img src={optimizeCloudinary(trustData.packingDispatch, 300, 250)} alt="Packing & Dispatch" />
                      <div className="fw-factory-label">Packing & Dispatch</div>
                    </div>
                    
                    <div className="fw-factory-item">
                      <img src={optimizeCloudinary(trustData.warehouseStorage, 300, 250)} alt="Warehouse Storage" />
                      <div className="fw-factory-label">Warehouse Storage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div> {/* <-- MAIN CONTAINER CLOSES HERE */}


      {/* ======================================================== */}
      {/* ✅ TRUST STATS BAR (Placed ABOVE Factory Slider)         */}
      {/* ======================================================== */}
      <section className="fw-trust-bar-section">
        <div className="fw-trust-bar-container">
          <div className="fw-trust-bar-grid">
            
            {/* Stat 1: Rating */}
            <div className="fw-trust-item">
              <div className="fw-trust-icon" style={{ color: '#f59e0b' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </div>
              <div className="fw-trust-text">
                <h4 className="fw-trust-title">4.8/5 Rating</h4>
                <p className="fw-trust-desc">Average Rating</p>
              </div>
            </div>

            {/* Stat 2: Retailers */}
            <div className="fw-trust-item">
              <div className="fw-trust-icon" style={{ color: '#3b82f6' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="fw-trust-text">
                <h4 className="fw-trust-title">4,900+</h4>
                <p className="fw-trust-desc">Retailers Served</p>
              </div>
            </div>

            {/* Stat 3: Delivery */}
            <div className="fw-trust-item">
              <div className="fw-trust-icon" style={{ color: '#10b981' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <div className="fw-trust-text">
                <h4 className="fw-trust-title">All India</h4>
                <p className="fw-trust-desc">Fast Delivery</p>
              </div>
            </div>

            {/* Stat 4: Manufacturer */}
            <div className="fw-trust-item">
              <div className="fw-trust-icon" style={{ color: '#8b5cf6' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                  <path d="M2 17h20"></path>
                  <path d="M6 7v10"></path>
                  <path d="M10 7v10"></path>
                  <path d="M14 7v10"></path>
                  <path d="M18 7v10"></path>
                  <path d="M8 2l-2 5"></path>
                  <path d="M16 2l2 5"></path>
                </svg>
              </div>
              <div className="fw-trust-text">
                <h4 className="fw-trust-title">Direct</h4>
                <p className="fw-trust-desc">Manufacturer</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* FACTORY FEED SLIDER                                      */}
      {/* ======================================================== */}
      {!loading && trustData && trustData.factorySliderImages && trustData.factorySliderImages.length > 0 && (
        <div className="fw-fullwidth-slider-section">
          <div className="fw-slider-header-container">
            <div className="fw-tf-header" style={{ marginBottom: '10px' }}>
              <span className="fw-tf-line"></span>
              <h3 style={{ fontSize: '24px', color: '#1e3a8a' }}>Coimbatore Factory: Live Facility Feed</h3>
              <span className="fw-tf-line"></span>
            </div>
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px', fontWeight: '500' }}>
              Explore our state-of-the-art production lines, storage, and specialized machinery.
            </p>
          </div>
          
          <div className="fw-factory-slider-wrapper">
            <div className="fw-factory-slider-track">
              {trustData.factorySliderImages.map((imgUrl: string, index: number) => (
                <div className="fw-slider-img-container" key={`orig-${index}`}>
                  <img src={optimizeCloudinary(imgUrl, 400, 300)} alt={`Factory Feed ${index}`} />
                </div>
              ))}
              {trustData.factorySliderImages.map((imgUrl: string, index: number) => (
                <div className="fw-slider-img-container" key={`dup-${index}`}>
                  <img src={optimizeCloudinary(imgUrl, 400, 300)} alt={`Factory Feed Dup ${index}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BIS & FACTORY PANORAMA                                   */}
      {/* ======================================================== */}
      {!loading && trustData && trustData.factoryImage && (
        <div style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          background: '#e0f2fe',
          padding: '60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderTop: '1px solid #bae6fd',
          boxSizing: 'border-box'
        }}>
          <h4 style={{ color: '#1e3a8a', fontSize: '24px', fontWeight: 800, margin: '0 0 16px 0' }}>
            All Toys BIS Certified
          </h4>
          
          <div style={{ background: '#0f172a', color: '#ffffff', padding: '10px 32px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            GSTIN: 33ANCPH3967L1ZT <ChevronRight size={16} />
          </div>

          <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <img 
              src={optimizeCloudinary(trustData.factoryImage, 1200, 400)} 
              alt="Factory Banner" 
              style={{ width: '100%', display: 'block', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', objectFit: 'cover' }} 
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ✅ WHAT ARE PEOPLE SAYING? (4-COLUMN REVIEWS)            */}
      {/* ======================================================== */}
      {!loading && trustData?.customerReviews && trustData.customerReviews.length > 0 && (
        <section className="fw-reviews-section">
          <div className="fw-reviews-container">
            <div className="fw-reviews-header">
              <h2 className="fw-reviews-heading">Retailers Love Bafna Toys</h2>
              <p className="fw-reviews-subheading">Trusted by thousands of verified customers</p>
            </div>

            <div className="fw-reviews-grid">
              {trustData.customerReviews.slice(0, 4).map((review: any, index: number) => (
                <div key={index} className="fw-review-card">
                  
                  <div className="fw-review-img-wrapper">
                    <img 
                      src={optimizeCloudinary(review.image, 400, 400)} 
                      alt={`Review by ${review.reviewerName}`} 
                      className="fw-review-img" 
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="fw-review-content">
                    <div className="fw-review-stars">
                      {'★'.repeat(review.rating || 5)}
                      <span className="fw-review-stars-empty">
                        {'★'.repeat(5 - (review.rating || 5))}
                      </span>
                    </div>
                    
                    <p className="fw-review-text">
                      "{review.reviewText}"
                    </p>
                    
                    <div className="fw-review-footer">
                      <span className="fw-review-author-name">{review.reviewerName}</span>
                      <span className="fw-review-verified">
                        <svg className="fw-verified-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
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

      {/* ======================================================== */}
      {/* ✅ DARK FOOTER (WITH LOGOS & DYNAMIC LINKS)              */}
      {/* ======================================================== */}
      {!loading && (
        <footer className="fw-global-footer">
          <div className="fw-footer-content">
            
            {/* 1. BRAND & TRUST SECTION */}
            <div className="fw-footer-brand">
              <div className="fw-brand-logo">
                <span className="fw-bear-icon">🧸</span> BafnaToys
              </div>
              <p className="fw-brand-desc">
                Inspiring imagination through play. The cutest toys, best deals, delivered safely and fast.
              </p>
              
              {/* ✅ MARKETPLACE & MAKE IN INDIA LOGOS */}
              <div className="fw-trust-section">
                <h5>Also Available On:</h5>
                <div className="fw-marketplace-logos">
                  {trustData?.amazonLink && trustData?.amazonLogo && (
                    <a href={trustData.amazonLink} target="_blank" rel="noreferrer" className="fw-logo-link">
                      {/* ✅ PASSED "c_fit" HERE */}
                      <img src={optimizeCloudinary(trustData.amazonLogo, 80, 40, "c_fit")} alt="Amazon" />
                    </a>
                  )}
                  {trustData?.flipkartLink && trustData?.flipkartLogo && (
                    <a href={trustData.flipkartLink} target="_blank" rel="noreferrer" className="fw-logo-link">
                      {/* ✅ PASSED "c_fit" HERE */}
                      <img src={optimizeCloudinary(trustData.flipkartLogo, 80, 40, "c_fit")} alt="Flipkart" />
                    </a>
                  )}
                  {trustData?.meeshoLink && trustData?.meeshoLogo && (
                    <a href={trustData.meeshoLink} target="_blank" rel="noreferrer" className="fw-logo-link">
                      {/* ✅ PASSED "c_fit" HERE */}
                      <img src={optimizeCloudinary(trustData.meeshoLogo, 80, 40, "c_fit")} alt="Meesho" />
                    </a>
                  )}
                </div>
                
                {trustData?.makeInIndiaLogo && (
                  <div className="fw-make-in-india">
                    {/* ✅ PASSED "c_fit" HERE */}
                    <img src={optimizeCloudinary(trustData.makeInIndiaLogo, 150, 80, "c_fit")} alt="Make In India" />
                  </div>
                )}
              </div>

              {/* ✅ GST BADGE */}
              <div className="fw-gst-badge">
                <span className="fw-gst-label">Registered Business</span>
                <span className="fw-gst-number">GSTIN: 33ANCPH3967L1ZT</span>
              </div>
            </div>

            {/* 2. QUICK LINKS */}
            <nav className="fw-footer-links" aria-label="Footer Quick Links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
                <li><Link to="/shipping-delivery">Shipping & Delivery</Link></li>
                <li><Link to="/cancellation-refund">Cancellation & Refund</Link></li>
              </ul>
            </nav>

            {/* 3. LOCATIONS */}
            <div className="fw-footer-address">
              <h4>Our Locations</h4>
              <address>
                <div className="fw-location-block">
                  <strong>Unit 1</strong>
                  <span>1-12, Thondamuthur Road</span>
                  <span>Coimbatore - 641007</span>
                </div>
                <div className="fw-location-block">
                  <strong>Unit 4</strong>
                  <span>GRVR Farms</span>
                  <span>PSG Rangasamy Nagar</span>
                  <span>Vedapatti, Coimbatore - 641007</span>
                </div>
              </address>
            </div>

            {/* 4. SOCIAL LINKS */}
            <div className="fw-footer-social">
              <h4>Connect With Us</h4>
              <div className="fw-social-buttons">
                {trustData?.instagramLink && (
                  <a href={trustData.instagramLink} target="_blank" rel="noreferrer" className="fw-s-btn fw-btn-insta">Instagram</a>
                )}
                {trustData?.youtubeLink && (
                  <a href={trustData.youtubeLink} target="_blank" rel="noreferrer" className="fw-s-btn fw-btn-yt">YouTube</a>
                )}
                {trustData?.facebookLink && (
                  <a href={trustData.facebookLink} target="_blank" rel="noreferrer" className="fw-s-btn fw-btn-fb">Facebook</a>
                )}
                {trustData?.linkedinLink && (
                  <a href={trustData.linkedinLink} target="_blank" rel="noreferrer" className="fw-s-btn fw-btn-in">LinkedIn</a>
                )}
              </div>
            </div>
          </div>

          <div className="fw-footer-bottom">
            <p>© {new Date().getFullYear()} BafnaToys. Filled with joy & play. All rights reserved.</p>
          </div>
        </footer>
      )}

      <FloatingCheckoutButton />
    </div>
  );
};

export default Products;