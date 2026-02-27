import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { MEDIA_URL } from "../utils/api"; 
import ProductCard from "./ProductCard";
import "../styles/Products.css";
import CategorySEO from "./CategorySEO";
import FloatingCheckoutButton from "./FloatingCheckoutButton";
import { SlidersHorizontal } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("default");

  const params = new URLSearchParams(location.search);
  const categoryId = params.get("category");
  const searchTerm = params.get("search") || params.get("q") || "";

  // Fetch Categories for Circular Menu
  useEffect(() => {
    api.get("/categories")
       .then(res => setCategories(res.data || []))
       .catch(err => console.error("Failed to load categories", err));
  }, []);

  // Fetch Products
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
    return () => {
      alive = false;
      controller.abort();
    };
  }, [location.search, categoryId, searchTerm]);

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

    // Apply Sorting
    if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [allProducts, categoryId, searchTerm, sortBy]);

  const categoryName = typeof displayed[0]?.category === "object"
      ? displayed[0]?.category?.name
      : typeof displayed[0]?.category === "string"
      ? displayed[0]?.category : "";

  const bottomHeadingCategories = ["pullback series"];
  const isBottomHeading = bottomHeadingCategories.some((cat) =>
    categoryName?.toLowerCase().includes(cat)
  );

  const seoTitle = categoryName ? `Wholesale ${categoryName} Supplier in India | Bafna Toys` : searchTerm ? `Search results for "${searchTerm}" | Bafna Toys` : "Wholesale Toys Supplier | Bafna Toys";
  const seoDescription = categoryName ? `Buy bulk ${categoryName.toLowerCase()} wholesale from Bafna Toys, Coimbatore. Best quality ${categoryName.toLowerCase()} for shops & distributors across India.` : searchTerm ? `Showing results for "${searchTerm}" at Bafna Toys. Wholesale toys supplier for shops and distributors in India.` : "Bafna Toys is a wholesale toy supplier in Coimbatore, India. Buy bulk toys including dolls, friction cars, pullback series & more at wholesale prices.";
  const seoKeywords = categoryName ? `wholesale ${categoryName}, bulk ${categoryName}, ${categoryName} supplier India, Bafna Toys` : "wholesale toys, bulk toy supplier India, Bafna Toys distributor";
  const seoUrl = `https://bafnatoys.com${location.pathname}${location.search}`;

  const productListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: displayed.map((p, i) => ({
      "@type": "Product",
      position: i + 1,
      name: p.name,
      image: Array.isArray(p.images) ? p.images[0] : p.images,
      description: p.description || `${p.name} available at wholesale prices.`,
      offers: { "@type": "Offer", priceCurrency: "INR", price: p.price || 0, availability: "https://schema.org/InStock", url: `https://bafnatoys.com/product/${p._id}` },
    })),
  };

  return (
    <div className="products-page container" style={{ paddingBottom: "100px" }}>
      <CategorySEO title={seoTitle} description={seoDescription} keywords={seoKeywords} url={seoUrl} jsonLd={productListSchema} />

      {/* --- CIRCULAR CATEGORY MENU (Story Style) --- */}
      <h2 style={{ textAlign: "center", marginBottom: "10px", fontSize: "22px", fontWeight: "800" }}>Shop By Category</h2>
      <div className="category-scroll-container">
        <div className="category-track">
          {/* "All" Category Item */}
          <div className={`category-item ${!categoryId ? "active" : ""}`} onClick={() => navigate("/products")}>
            <div className="category-circle-wrapper">
               <div className="category-circle-inner" style={{ background: '#f8fafc', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌟</div>
            </div>
            <span>ALL TOYS</span>
          </div>

          {/* Dynamic Categories */}
          {categories.map(cat => {
            const isActive = categoryId === cat._id;
            const imgSrc = cat.image ? (cat.image.startsWith("http") ? cat.image : `${MEDIA_URL}/uploads/${encodeURIComponent(cat.image)}`) : "/placeholder.png";
            
            return (
              <div key={cat._id} className={`category-item ${isActive ? "active" : ""}`} onClick={() => navigate(`/products?category=${cat._id}`)}>
                <div className="category-circle-wrapper">
                  <img src={imgSrc} alt={cat.name} className="category-img" />
                </div>
                <span>{cat.name.toUpperCase()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- FILTER & SORT BAR --- */}
      <div className="filter-info-bar">
        <h1 className="current-cat-title">
          {searchTerm ? `Search: "${searchTerm}"` : categoryName || "All Products"}
          <span className="item-count">({displayed.length} items)</span>
        </h1>
        <div className="sort-wrapper">
          <SlidersHorizontal size={18} color="#64748b" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="default">Sort by: Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {loading && <div className="loader">Loading products…</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && (
        displayed.length === 0 ? (
          <div className="empty" style={{ textAlign: "center", padding: "60px 20px", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <h2>No products found</h2>
            <p>Try clearing your search or selecting a different category.</p>
            <button onClick={() => navigate("/products")} style={{ marginTop: "15px", padding: "10px 20px", background: "var(--color-gradient)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>View All Products</button>
          </div>
        ) : (
          <div className="products-grid">
            {displayed.map((p, idx) => (
              <ProductCard key={p._id} product={p} userRole="customer" index={idx} />
            ))}
          </div>
        )
      )}

      {isBottomHeading && (
        <h1 className="page-title category-title-bottom" style={{ marginTop: "40px" }}>{categoryName || "Products"}</h1>
      )}

      {/* Floating Checkout Button */}
      <FloatingCheckoutButton />
    </div>
  );
};

export default Products;