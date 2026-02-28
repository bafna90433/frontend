import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { MEDIA_URL } from "../utils/api"; 
import ProductCard from "./ProductCard";
import "../styles/Products.css";
import CategorySEO from "./CategorySEO";
import FloatingCheckoutButton from "./FloatingCheckoutButton";
import { SlidersHorizontal, Filter, X, ChevronRight, ChevronLeft } from "lucide-react";
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
};

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";

const optimizeCloudinary = (url: string | undefined, w: number, h: number) => {
  if (!url) return "/placeholder.png";
  if (!url.startsWith("http") && CLOUD_NAME) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${w},h_${h},c_fill/${url}`;
  }
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/image/upload/f_auto")) return url;
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${w},h_${h},c_fill/`);
  }
  return url.startsWith("http") ? url : `${MEDIA_URL}/uploads/${encodeURIComponent(url)}`;
};

const cleanProduct = (raw: any): Product => ({
  _id: String(raw._id ?? raw.id ?? ""),
  name: raw.name ?? raw.title ?? "Untitled",
  sku: raw.sku ?? "",
  images: Array.isArray(raw.images) ? raw.images : typeof raw.images === "string" ? [raw.images] : [],
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters & Sorting States
  const [sortBy, setSortBy] = useState<string>("default");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ✅ Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 20; // Ek page pe 20 products dikhenge (5 cols * 4 rows)

  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const searchTerm = params.get("search") || params.get("q") || "";

  useEffect(() => {
    api.get("/categories")
       .then(res => setCategories(res.data || []))
       .catch(err => console.error("Failed to load categories", err));
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
        const arr: any[] = Array.isArray(res.data) ? res.data : res.data?.products || res.data?.docs || [];
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
    return () => { alive = false; controller.abort(); };
  }, [location.search, categoryId, searchTerm]);

  // ✅ Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryId, searchTerm, sortBy, minPrice, maxPrice]);

  // Filter & Sort Logic
  const displayed = useMemo(() => {
    let filtered = [...allProducts];

    if (categoryId) {
      filtered = filtered.filter((p) =>
        typeof p.category === "string" ? p.category === categoryId : p.category?._id === categoryId
      );
    }

    if (searchTerm) {
      const n = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(n) || (p.sku || "").toLowerCase().includes(n)
      );
    }

    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min)) filtered = filtered.filter(p => (p.price || 0) >= min);
    if (!isNaN(max)) filtered = filtered.filter(p => (p.price || 0) <= max);

    if (sortBy === "price-low") filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price-high") filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  }, [allProducts, categoryId, searchTerm, sortBy, minPrice, maxPrice]);

  // ✅ Pagination Logic
  const totalPages = Math.ceil(displayed.length / ITEMS_PER_PAGE);
  const paginatedProducts = displayed.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Helper to generate page numbers with ellipses (e.g., 1 2 ... 5 6)
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" }); // ✅ Scroll to top on page change
  };

  const categoryName = typeof displayed[0]?.category === "object"
      ? displayed[0]?.category?.name
      : typeof displayed[0]?.category === "string"
      ? displayed[0]?.category : "";

  const seoTitle = categoryName ? `Wholesale ${categoryName} Supplier | Bafna Toys` : searchTerm ? `Search results for "${searchTerm}"` : "Shop Wholesale Toys | Bafna Toys";
  const seoDescription = "Buy bulk toys including dolls, friction cars, pullback series & more at wholesale prices.";
  const seoUrl = `https://bafnatoys.com${location.pathname}${location.search}`;

  const handleClearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
    navigate("/products");
  };

  return (
    <div className="fw-shop-wrapper">
      <CategorySEO title={seoTitle} description={seoDescription} keywords="wholesale toys" url={seoUrl} jsonLd={{}} />

      {/* --- FLAT FULL-HEIGHT SIDEBAR --- */}
      <aside className={`fw-sidebar ${isMobileFilterOpen ? "open" : ""}`}>
        <div className="sidebar-header mobile-only">
          <h3>Filters</h3>
          <button onClick={() => setIsMobileFilterOpen(false)}><X size={20} /></button>
        </div>

        <div className="fw-sidebar-content">
          <div className="fw-sidebar-section">
            <h3 className="fw-sidebar-title">Categories</h3>
            <ul className="fw-cat-list">
              <li 
                className={!categoryId ? "active" : ""} 
                onClick={() => { navigate("/products"); setIsMobileFilterOpen(false); }}
              >
                All Products
              </li>
              
              {loading && categories.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <li key={i}><Skeleton variant="text" width="80%" /></li>
                ))
              ) : (
                categories.map(cat => (
                  <li 
                    key={cat._id} 
                    className={categoryId === cat._id ? "active" : ""}
                    onClick={() => { navigate(`/products?category=${cat._id}`); setIsMobileFilterOpen(false); }}
                  >
                    <span>{cat.name}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="fw-sidebar-section">
            <h3 className="fw-sidebar-title">Price Range</h3>
            <div className="fw-price-inputs">
              <input 
                type="number" 
                placeholder="Min ₹" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)} 
              />
              <span className="separator">-</span>
              <input 
                type="number" 
                placeholder="Max ₹" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)} 
              />
            </div>
            {(minPrice || maxPrice) && (
               <button className="fw-clear-btn" onClick={() => { setMinPrice(""); setMaxPrice(""); }}>
                 Clear Price
               </button>
            )}
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="fw-main-content">
        
        {/* CIRCULAR CATEGORIES ON TOP (Like Home Page) */}
        <div className="fw-top-categories">
          <div className="category-scroll-container">
            <div className="category-track">
              <div className={`category-item ${!categoryId ? "active" : ""}`} onClick={() => navigate("/products")}>
                <div className="category-circle-wrapper">
                  <div className="category-circle-inner" style={{ background: '#f8fafc', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌟</div>
                </div>
                <span>ALL TOYS</span>
              </div>

              {categories.map(cat => {
                const isActive = categoryId === cat._id;
                const imgSrc = optimizeCloudinary(cat.image, 100, 100);
                return (
                  <div key={cat._id} className={`category-item ${isActive ? "active" : ""}`} onClick={() => navigate(`/products?category=${cat._id}`)}>
                    <div className="category-circle-wrapper">
                      <img src={imgSrc} alt={cat.name} className="category-img" loading="lazy" decoding="async" />
                    </div>
                    <span>{cat.name.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TOP BAR: Title & Sort */}
        <div className="fw-top-bar">
          <div className="fw-top-left">
            <button className="fw-mobile-filter-btn mobile-only" onClick={() => setIsMobileFilterOpen(true)}>
              <Filter size={18} /> Filters
            </button>
            <h1 className="fw-page-title">
              {searchTerm ? `Search: "${searchTerm}"` : categoryName || "All Products"}
              {!loading && <span className="fw-item-count">({displayed.length} items)</span>}
            </h1>
          </div>
          
          <div className="fw-top-right">
            <span className="fw-sort-label desktop-only">Sort by:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="fw-sort-select">
              <option value="default">Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* ACTIVE FILTERS */}
        {(searchTerm || minPrice || maxPrice) && (
          <div className="fw-active-filters">
            {searchTerm && <span className="fw-tag">Search: {searchTerm} <X size={14} onClick={() => navigate(location.pathname)} style={{cursor:'pointer'}} /></span>}
            {(minPrice || maxPrice) && <span className="fw-tag">Price: ₹{minPrice || '0'} - ₹{maxPrice || 'Any'} <X size={14} onClick={() => { setMinPrice(""); setMaxPrice(""); }} style={{cursor:'pointer'}} /></span>}
            <span className="fw-clear-all" onClick={handleClearFilters}>Clear All</span>
          </div>
        )}

        {/* GRID AREA */}
        {loading ? (
          <div className="fw-products-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ width: "100%", padding: "5px" }}>
                <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: "12px" }} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : displayed.length === 0 ? (
          <div className="fw-empty-state">
            <h2>No products found</h2>
            <p>Try adjusting your price range or selecting a different category.</p>
            <button onClick={handleClearFilters} className="fw-action-btn">View All Products</button>
          </div>
        ) : (
          <>
            <div className="fw-products-grid">
              {/* ✅ Mapped over paginatedProducts instead of displayed */}
              {paginatedProducts.map((p, idx) => (
                <ProductCard key={p._id} product={p} userRole="customer" index={idx} />
              ))}
            </div>

            {/* ✅ PAGINATION UI */}
            {totalPages > 1 && (
              <div className="fw-pagination">
                <button 
                  className="fw-page-btn" 
                  disabled={currentPage === 1} 
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft size={18} />
                </button>

                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    className={`fw-page-btn ${page === currentPage ? "active" : ""} ${page === '...' ? "dots" : ""}`}
                    disabled={page === '...'}
                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  className="fw-page-btn" 
                  disabled={currentPage === totalPages} 
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Overlay */}
      {isMobileFilterOpen && <div className="fw-overlay" onClick={() => setIsMobileFilterOpen(false)}></div>}

      <FloatingCheckoutButton />
    </div>
  );
};

export default Products;