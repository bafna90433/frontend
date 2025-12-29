import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom"; // 👈 Import Link for navigation
import api from "../utils/api";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import CategoryNav from "./CategoryNav";
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

interface Banner {
  _id: string;
  imageUrl: string;
  link?: string;
}

const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeDemos = useRef<Record<string, boolean>>({});

  const runScrollDemo = (id: string) => {
    const container = document.getElementById(`scroll-${id}`);
    if (!container || activeDemos.current[id]) return;

    activeDemos.current[id] = true;
    const firstProduct = container.querySelector<HTMLElement>(".product-link");
    const productWidth = firstProduct ? firstProduct.offsetWidth + 16 : 200;
    const distance = Math.min(
      productWidth * 4,
      container.scrollWidth - container.clientWidth
    );

    const duration = 1500;
    container.scrollBy({ left: distance, behavior: "smooth" });
    setTimeout(() => {
      container.scrollBy({ left: -distance, behavior: "smooth" });
      activeDemos.current[id] = false;
    }, duration);
  };

  // ✅ Fetch all
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
          setBanners(bannerRes.data || []);
        } else {
          throw new Error("Failed to fetch data");
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load data. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ✅ Intersection scroll animation
  useEffect(() => {
    if (!loading && categories.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("data-id");
              if (id) runScrollDemo(id);
            }
          });
        },
        { threshold: 0.4 }
      );

      categories.forEach((cat) => {
        const el = document.getElementById(`scroll-${cat._id}`);
        if (el) observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, [loading, categories]);

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="home-container">
      {/* ✅ Category navigation strip */}
      <CategoryNav />

      {/* ✅ Banner Slider */}
      {banners.length > 0 && <BannerSlider banners={banners} />}

      {/* ✅ Loading skeleton */}
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
                  sx={{ marginRight: "0.8rem", borderRadius: "8px" }}
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
              <div className="product-scroll-wrapper">
                <div
                  id={`scroll-${cat._id}`}
                  data-id={cat._id}
                  className="product-scroll"
                >
                  {items.map((product) => (
                    <div key={product._id} className="product-link">
                      <ProductCard product={product} userRole="customer" />
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="empty-category-message">
                      No products in this category
                    </div>
                  )}
                </div>
                <div className="scroll-indicator">← Scroll →</div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty-category-message">No categories available</div>
      )}

      <FloatingCheckoutButton />

      {/* ✅ NEW FOOTER SECTION ADDED HERE */}
      <footer className="home-footer">
        <div className="footer-links-container">
            <h3>Quick Links</h3>
            <ul className="footer-links">
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions">Terms & Conditions</Link></li>
                <li><Link to="/shipping-delivery">Shipping & Delivery</Link></li>
                <li><Link to="/cancellation-refund">Cancellation & Refund</Link></li>
            </ul>
        </div>
        <div className="footer-copyright">
            <p>© {new Date().getFullYear()} Bafna Toys. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;