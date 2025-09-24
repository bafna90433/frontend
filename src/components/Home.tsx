import React, { useEffect, useState } from "react";
import api from "../utils/api";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import "../styles/Home.css";
import { Skeleton } from "@mui/material";
import ErrorMessage from "./ErrorMessage";
import FloatingCheckoutButton from "../components/FloatingCheckoutButton";

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  sku?: string;
  price: number;
  category?: { _id: string; name: string };
  bulkPricing: { inner: number; qty: number; price: number }[];
  innerQty: number;
  images: string[];
  taxFields?: string[];
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole: "admin" | "customer" = "customer";

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [catRes, prodRes, bannerRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
          api.get("/banners"),
        ]);

        if (
          catRes.status === 200 &&
          prodRes.status === 200 &&
          bannerRes.status === 200
        ) {
          setCategories(catRes.data || []);
          setProducts(prodRes.data || []);
          setBanners(
            (bannerRes.data || [])
              .map((b: any) => b.imageUrl || b.url || b.image)
              .filter(Boolean)
          );
        } else {
          throw new Error("Failed to fetch data");
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load products. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="home-container">
      {banners.length > 0 && <BannerSlider banners={banners} />}

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="category-block">
            <Skeleton
              variant="text"
              width="60%"
              height={30}
              sx={{ marginLeft: "0.5rem" }}
            />
            <div className="product-scroll">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton
                  key={j}
                  variant="rectangular"
                  width={140}
                  height={180}
                  sx={{
                    marginRight: "0.8rem",
                    borderRadius: "8px",
                  }}
                />
              ))}
            </div>
          </div>
        ))
      ) : categories.length > 0 ? (
        categories.map((cat) => {
          const items = products.filter((p) => p.category?._id === cat._id);

          return (
            <div key={cat._id} id={`cat-${cat._id}`} className="category-block">
              <h2 className="category-title">{cat.name}</h2>
              <div className="product-scroll">
                {items.map((product) => (
                  <div key={product._id} className="product-link">
                    <ProductCard product={product} userRole={userRole} />
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="empty-category-message">
                    No products in this category
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty-category-message">No categories available</div>
      )}

      <div style={{ height: 72 }} />
      <FloatingCheckoutButton />
    </div>
  );
};

export default Home;
