// src/components/Products.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../utils/api";
import ProductCard from "./ProductCard";
import "../styles/Products.css";

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
  // allow other fields
  [k: string]: any;
};

const parseQuery = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    q: params.get("search") || params.get("q") || "",
    category: params.get("category") || "",
    page: Number(params.get("page") || "1"),
    limit: Number(params.get("limit") || "24"),
  };
};

const normalizeText = (s: any) => (typeof s === "string" ? s.toLowerCase() : "");

const matchesQuery = (p: Product, q: string) => {
  if (!q) return true;
  const n = q.trim().toLowerCase();
  if (!n) return true;

  // fields to check
  const checks: string[] = [];

  checks.push(normalizeText(p.name));
  checks.push(normalizeText(p.sku));
  if (Array.isArray(p.images)) checks.push(p.images.join(" ").toLowerCase());
  if (typeof p.category === "string") checks.push(p.category.toLowerCase());
  if (p.category && typeof p.category === "object" && p.category.name) checks.push(String(p.category.name).toLowerCase());

  // extra: check tags or other textual fields if present
  if (Array.isArray(p.tags)) checks.push(p.tags.join(" ").toLowerCase());
  if (p.description) checks.push(String(p.description).toLowerCase());

  return checks.some((c) => c.includes(n));
};

const cleanProduct = (raw: any): Product => {
  return {
    _id: String(raw._id ?? raw.id ?? ""),
    name: raw.name ?? raw.title ?? "Untitled",
    sku: raw.sku ?? "",
    images: Array.isArray(raw.images) ? raw.images : typeof raw.images === "string" ? [raw.images] : [],
    price: typeof raw.price === "number" ? raw.price : Number(raw.price) || 0,
    innerQty: raw.innerQty,
    bulkPricing: Array.isArray(raw.bulkPricing) ? raw.bulkPricing : [],
    category: raw.category ?? raw.categoryName ?? "",
    taxFields: Array.isArray(raw.taxFields) ? raw.taxFields : [],
    ...raw,
  } as Product;
};

const Products: React.FC = () => {
  const location = useLocation();
  const { q: initialQ, category: initialCategory, page: initialPage, limit: initialLimit } = parseQuery(location.search);

  const [query, setQuery] = useState<string>(initialQ);
  const [category, setCategory] = useState<string>(initialCategory);
  const [page, setPage] = useState<number>(initialPage || 1);
  const [limit] = useState<number>(initialLimit || 24);

  const [products, setProducts] = useState<Product[]>([]);
  const [displayed, setDisplayed] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // keep state in sync when URL changes
  useEffect(() => {
    const parsed = parseQuery(location.search);
    setQuery(parsed.q);
    setCategory(parsed.category);
    setPage(parsed.page || 1);
  }, [location.search]);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, any> = { limit };
        if (query && query.trim().length > 0) params.search = query.trim();
        if (category && category.trim().length > 0) params.category = category.trim();
        if (page && page > 1) params.page = page;

        // attempt server-side filtering (if backend supports it)
        const res = await api.get("/products", {
          params,
          signal: controller.signal,
        });

        if (!alive) return;

        // Normalize server response to array of products
        let arr: any[] = [];

        if (Array.isArray(res.data)) {
          arr = res.data;
        } else if (res.data && Array.isArray(res.data.products)) {
          arr = res.data.products;
          if (typeof res.data.total === "number") setTotal(res.data.total);
        } else if (res.data && Array.isArray(res.data.docs)) {
          arr = res.data.docs;
          if (typeof res.data.total === "number") setTotal(res.data.total);
        } else if (res.data && typeof res.data === "object" && res.data.products) {
          // fallback
          arr = Array.isArray(res.data.products) ? res.data.products : [];
        } else {
          // fallback: try to coerce to [] safely
          arr = Array.isArray(res.data) ? res.data : [];
        }

        // Clean items defensively
        const cleaned = arr.map(cleanProduct);

        // If query exists but server returned many (unfiltered), or server ignored search,
        // apply client-side filter as a fallback:
        let filtered = cleaned;
        if (query && query.trim().length > 0) {
          // If server respected search, cleaned should already be filtered.
          // But to be safe, filter client-side as well.
          filtered = cleaned.filter((p) => matchesQuery(p, query));
        }

        // If category param is provided, filter for category match too
        if (category && category.trim().length > 0) {
          const c = category.trim().toLowerCase();
          filtered = filtered.filter((p) => {
            if (!p.category) return false;
            if (typeof p.category === "string") return p.category.toLowerCase().includes(c);
            if (typeof p.category === "object" && p.category.name) return String(p.category.name).toLowerCase().includes(c);
            return false;
          });
        }

        setProducts(cleaned);
        setDisplayed(filtered);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch products:", err);
        setError(err?.response?.data?.message || err?.message || "Failed to load products");
        setProducts([]);
        setDisplayed([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [query, category, page, limit]);

  const heading = query
    ? `Results for "${query}"`
    : category
    ? `Category: ${category}`
    : "Products";

  return (
    <div className="products-page container" style={{ padding: "24px" }}>
      <h1 className="page-title">{heading}</h1>

      {loading && <div className="loader">Loading products…</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && (
        <>
          {displayed.length === 0 ? (
            <div className="empty">
              No products found{query ? ` for "${query}"` : ""}{category ? ` in category "${category}"` : ""}.
            </div>
          ) : (
            <div className="products-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
              gap: "24px"
            }}>
              {displayed.map((p) => (
                <ProductCard key={p._id} product={p} userRole="customer" />
              ))}
            </div>
          )}
        </>
      )}

      {/* Optional pager when server returns total */}
      {!loading && !error && total !== null && (
        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>Page {page} of {Math.max(1, Math.ceil((total || displayed.length) / limit))}</div>
          <div>
            <button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))}>Prev</button>
            <button onClick={() => setPage((s) => s + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
