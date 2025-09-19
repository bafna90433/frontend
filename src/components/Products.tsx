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
  tags?: string[];
  description?: string;
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

// ✅ helper to lowercase
const normalize = (val?: string) =>
  typeof val === "string" ? val.toLowerCase() : "";

// ✅ strong filter
const matchesQuery = (p: Product, q: string) => {
  if (!q) return true;
  const n = q.trim().toLowerCase();
  if (!n) return true;

  const checks: string[] = [];

  if (p.name) checks.push(p.name.toLowerCase());
  if (p.sku) checks.push(p.sku.toLowerCase());

  if (typeof p.category === "string")
    checks.push(p.category.toLowerCase());
  if (p.category && typeof p.category === "object" && p.category.name)
    checks.push(String(p.category.name).toLowerCase());

  if (Array.isArray(p.tags))
    checks.push(p.tags.join(" ").toLowerCase());

  if (p.description)
    checks.push(p.description.toLowerCase());

  // strict check: must include query word
  return checks.some((c) => c.includes(n));
};

// ✅ clean backend product
const cleanProduct = (raw: any): Product => {
  return {
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
  } as Product;
};

const Products: React.FC = () => {
  const location = useLocation();
  const { q: initialQ, category: initialCategory, page: initialPage, limit: initialLimit } =
    parseQuery(location.search);

  const [query, setQuery] = useState<string>(initialQ);
  const [category, setCategory] = useState<string>(initialCategory);
  const [page, setPage] = useState<number>(initialPage || 1);
  const [limit] = useState<number>(initialLimit || 24);

  const [displayed, setDisplayed] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        const res = await api.get("/products", { signal: controller.signal });

        if (!alive) return;

        let arr: any[] = [];
        if (Array.isArray(res.data)) arr = res.data;
        else if (res.data?.products) arr = res.data.products;
        else if (res.data?.docs) arr = res.data.docs;

        const cleaned = arr.map(cleanProduct);

        // ✅ Strict filter always applied
        let filtered = cleaned;
        if (query && query.trim()) {
          filtered = cleaned.filter((p) => matchesQuery(p, query));
        }

        if (category && category.trim()) {
          const c = category.toLowerCase();
          filtered = filtered.filter((p) => {
            if (!p.category) return false;
            if (typeof p.category === "string")
              return p.category.toLowerCase().includes(c);
            if (typeof p.category === "object" && p.category.name)
              return String(p.category.name).toLowerCase().includes(c);
            return false;
          });
        }

        setDisplayed(filtered);
        setTotal(filtered.length);
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load products");
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
              No products found
              {query ? ` for "${query}"` : ""}
              {category ? ` in category "${category}"` : ""}.
            </div>
          ) : (
            <div className="products-grid">
              {displayed.map((p) => (
                <ProductCard key={p._id} product={p} userRole="customer" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
