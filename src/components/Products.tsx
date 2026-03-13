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

const optimizeCloudinary = (url: string | undefined, w: number, h: number) => {
  if (!url) return "/placeholder.png";

  if (!url.startsWith("http") && CLOUD_NAME) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${w},h_${h},c_fill/${url}`;
  }

  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/image/upload/f_auto")) return url;
    return url.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto,w_${w},h_${h},c_fill/`
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

const Products: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  
  const [activeDeals, setActiveDeals] = useState<HotDeal[]>([]);
  
  // Trust settings state
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
    api
      .get("/categories")
      .then((res) => setCategories(res.data?.categories || res.data || []))
      .catch((err) => console.error("Failed to load categories", err));

    api
      .get("/banners")
      .then((res) => {
        const fetchedBanners = Array.isArray(res.data?.banners) 
          ? res.data.banners 
          : (Array.isArray(res.data) ? res.data : []);
        setBanners(fetchedBanners);
      })
      .catch((err) => console.error("Failed to load banners", err))
      .finally(() => setBannersLoading(false));

    api
      .get("/home-config")
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

    // Fetch Trust Settings
    api
      .get("/trust-settings")
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

      {/* ================= PROFESSIONAL MARQUEE BANNER ================= */}
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
          {/* ================= B2B PREMIUM GOLD BANNER ================= */}
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

          {/* ================= TRUST & FACTORY SECTION (NEW DESIGN) ================= */}
          {!loading && trustData && (
            <div className="fw-trust-factory-wrapper">
              
              {/* Card 1: Trust Badges */}
              <div className="fw-tf-card fw-tf-badges-card">
                <div className="fw-tf-header">
                  <span className="fw-tf-line"></span>
                  <h3>Why Retailers Trust Us</h3>
                  <span className="fw-tf-line"></span>
                </div>
                
                <div className="fw-badges-grid">
                  {trustData.badge1 && <img src={optimizeCloudinary(trustData.badge1, 150, 150)} alt="Badge 1" className="fw-badge-img" />}
                  {trustData.badge2 && <img src={optimizeCloudinary(trustData.badge2, 150, 150)} alt="Badge 2" className="fw-badge-img" />}
                  {trustData.badge3 && <img src={optimizeCloudinary(trustData.badge3, 150, 150)} alt="Badge 3" className="fw-badge-img" />}
                  {trustData.badge4 && <img src={optimizeCloudinary(trustData.badge4, 150, 150)} alt="Badge 4" className="fw-badge-img" />}
                </div>
              </div>

              {/* Card 2: Starter Box & Factory Images */}
              <div className="fw-tf-card fw-tf-tour-card">
                
                {/* Left Side: Starter Retail Box */}
                <div className="fw-tf-starter-col">
                  <h3 className="fw-starter-title">Starter Retail Box</h3>
                  <ul className="fw-starter-list">
                    <li>50 Mixed Toys</li>
                    <li>Best Selling Items</li>
                    <li>Special Wholesale Price</li>
                  </ul>
                  <button className="fw-order-now-btn" onClick={() => navigate('/products')}>
                    Order Now <ChevronRight size={14} />
                  </button>
                  
                  {/* Container for the uploaded 3D Box image */}
                  <div className="fw-starter-img-container">
                    {trustData.starterBoxImage ? (
                      <img src={optimizeCloudinary(trustData.starterBoxImage, 300, 200)} alt="Starter Box" className="fw-starter-box-img" />
                    ) : (
                      <div className="fw-starter-box-placeholder">📦</div>
                    )}
                  </div>
                </div>

                {/* Right Side: Factory Images */}
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

             {/* Card 3: Bottom Banner */}
              <div className="fw-tf-card fw-tf-bottom-card">
                <h4 className="fw-bis-cert-title">
                  All Toys BIS Certified
                </h4>
                
                <div className="fw-payment-pill">
                  COD | GST Invoicing Available <ChevronRight size={16} />
                </div>

                {trustData.factoryImage && (
                  <img src={optimizeCloudinary(trustData.factoryImage, 900, 300)} alt="Factory Banner" className="fw-factory-bottom-img" />
                )}
              </div>

            </div>
          )}
          {/* ================= END TRUST & FACTORY SECTION ================= */}

        </main>
      </div> {/* <-- Yahan main container close ho gaya */}

      {/* ======================================================== */}
      {/* NAYA FULL-WIDTH FACTORY SLIDER (FOOTER KE THEEK UPAR)    */}
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
              {/* Original Images */}
              {trustData.factorySliderImages.map((imgUrl: string, index: number) => (
                <div className="fw-slider-img-container" key={`orig-${index}`}>
                  <img src={optimizeCloudinary(imgUrl, 400, 300)} alt={`Factory Feed ${index}`} />
                </div>
              ))}
              {/* Duplicate Images for Seamless Infinite Loop */}
              {trustData.factorySliderImages.map((imgUrl: string, index: number) => (
                <div className="fw-slider-img-container" key={`dup-${index}`}>
                  <img src={optimizeCloudinary(imgUrl, 400, 300)} alt={`Factory Feed Dup ${index}`} />
                </div>
              ))}
            </div>
          </div>
          
        </div>
      )}

      {/* ✅ DARK FOOTER FROM HOMEPAGE SCREENSHOT */}
      {!loading && (
        <footer className="fw-global-footer">
          <div className="fw-footer-content">
            
            <div className="fw-footer-brand">
              <div className="fw-brand-logo">
                <span className="fw-bear-icon">🧸</span> BafnaToys
              </div>
              <p className="fw-brand-desc">
                Inspiring imagination through play. The cutest toys, best deals, delivered safely and fast.
              </p>
              
              {/* GST Number in Footer */}
              <div style={{ marginTop: '12px', padding: '8px 12px', background: '#1f2937', borderRadius: '6px', display: 'inline-block', border: '1px solid #374151' }}>
                <span style={{ color: '#9ca3af', fontSize: '12px', display: 'block' }}>Registered Business</span>
                <span style={{ color: '#ff2a75', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.5px' }}>
                  GSTIN: 33ANCPH3967L1ZT 
                </span>
              </div>
            </div>

            <div className="fw-footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
                <li><Link to="/shipping-delivery">Shipping & Delivery</Link></li>
                <li><Link to="/cancellation-refund">Cancellation & Refund</Link></li>
              </ul>
            </div>

            <div className="fw-footer-social">
              <h4>Connect With Us</h4>
              <div className="fw-social-buttons">
                <a href="https://www.instagram.com/bafna_toys/" target="_blank" rel="noreferrer" className="fw-s-btn fw-btn-insta">
                  Instagram
                </a>
                <a href="https://www.youtube.com/@BafnaToys" target="_blank" rel="noreferrer" className="fw-s-btn fw-btn-yt">
                  YouTube
                </a>
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