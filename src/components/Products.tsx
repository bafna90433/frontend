import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ProductCard from "./ProductCard";
import "../styles/Products.css";

const API_BASE = "http://localhost:5000";

type BulkTier = { inner: number; qty: number; price: number };
type Product = {
  _id: string;
  name: string;
  sku?: string;
  images?: string[];
  price: number;
  innerQty?: number;
  bulkPricing: BulkTier[];
  category?: { _id: string; name: string } | string;
  taxFields?: string[];
};

const Products: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  // support both ?search= and ?q=
  const q = (params.get("search") || params.get("q") || "").trim();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // try backend search (prefer `search` param; change if your API expects `q`)
        const { data } = await axios.get(`${API_BASE}/api/products`, {
          params: { search: q },
        });
        if (!alive) return;
        const arr: Product[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];
        setItems(arr);
      } catch (e) {
        if (alive) setErr("Could not load products.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [q]);

  const title = q ? `Results for “${q}”` : "All Products";

  return (
    <div className="products-page">
      <div className="products-head">
        <h1>{title}</h1>
        {q && (
          <button className="clear-btn" onClick={() => navigate("/products")}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="state">Loading…</div>
      ) : err ? (
        <div className="state error">{err}</div>
      ) : items.length === 0 ? (
        <div className="state empty">
          <p>No products found.</p>
          <button className="clear-btn" onClick={() => navigate("/products")}>
            View all products
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} userRole="customer" />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
