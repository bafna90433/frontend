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

  const [displayed, setDisplayed] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

        setDisplayed(cleaned);
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
  }, [location.search]);

  return (
    <div className="products-page container" style={{ padding: "24px" }}>
      <h1 className="page-title">Products</h1>

      {loading && <div className="loader">Loading products…</div>}
      {error && <div className="error">Error: {error}</div>}

      {!loading && !error && (
        <>
          {displayed.length === 0 ? (
            <div className="empty">No products found.</div>
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
