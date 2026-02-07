import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import ProductCard from "./ProductCard";
import BannerSlider from "./BannerSlider";
import "../styles/Home.css";
import { Skeleton } from "@mui/material";
import ErrorMessage from "./ErrorMessage";
import FloatingCheckoutButton from "../components/FloatingCheckoutButton";
import { FiChevronLeft, FiChevronRight, FiArrowRight, FiImage } from "react-icons/fi";

interface Category {
  _id: string;
  name: string;
  image?: string;
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
  stock?: number;
  rating?: number;
  reviews?: number;
  tagline?: string;
  packSize?: string;
  featured?: boolean;
  mrp?: number;
  slug?: string;
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

  // Generic Scroll Function
  const scrollContainer = (id: string, direction: "left" | "right") => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = container.clientWidth / 2; // Scroll half screen width
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

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

      {/* ✅ Shop By Category Heading */}
      {!loading && categories.length > 0 && (
        <div className="section-heading-wrapper">
          <h3 className="section-heading">Shop By Category</h3>
          <div className="section-heading-line"></div>
        </div>
      )}

      {/* ✅ Circular Categories Section WITH BUTTONS */}
      <div className="category-scroll-wrapper">
        {/* Left Scroll Button (Only shows on Desktop via CSS) */}
        {!loading && categories.length > 4 && (
          <button 
            className="scroll-btn cat-scroll-left" 
            onClick={() => scrollContainer("category-circles-box", "left")}
            aria-label="Scroll Left"
          >
            <FiChevronLeft size={24} />
          </button>
        )}

        <div id="category-circles-box" className="category-circles-section">
          {loading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="cat-circle-skeleton">
                 <Skeleton 
                    variant="circular" 
                    width={180} 
                    height={180} 
                    sx={{
                      '@media (max-width: 768px)': { width: 80, height: 80 }
                    }}
                 />
                 <Skeleton variant="text" width={100} />
               </div>
             ))
          ) : (
            categories.map((cat) => (
              <Link key={cat._id} to={`/products?category=${cat._id}`} className="cat-circle-item">
                <div className="cat-circle-img-wrapper">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="cat-circle-img" />
                  ) : (
                    <div className="cat-placeholder"><FiImage /></div>
                  )}
                </div>
                <span className="cat-circle-name">{cat.name}</span>
              </Link>
            ))
          )}
        </div>

        {/* Right Scroll Button */}
        {!loading && categories.length > 4 && (
          <button 
            className="scroll-btn cat-scroll-right" 
            onClick={() => scrollContainer("category-circles-box", "right")}
            aria-label="Scroll Right"
          >
            <FiChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Product Sections */}
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="category-block">
            <Skeleton
              variant="text"
              width="40%"
              height={40}
              sx={{ marginLeft: "1rem", marginBottom: "1rem", borderRadius: "10px" }}
            />
            <div className="product-scroll">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton
                  key={j}
                  variant="rectangular"
                  width={200}
                  height={280}
                  sx={{ marginRight: "1rem", borderRadius: "20px" }}
                />
              ))}
            </div>
          </div>
        ))
      ) : categories.length > 0 ? (
        categories.map((cat) => {
          const items = products.filter((p) => p.category?._id === cat._id);
          if (items.length === 0) return null;

          return (
            <div key={cat._id} id={`cat-${cat._id}`} className="category-block">
              <div className="category-header">
                <h2 className="category-title">
                  <span className="title-highlight">{cat.name}</span>
                </h2>
                <Link
                  to={`/products?category=${cat._id}`}
                  className="view-all-btn"
                >
                  View All <FiArrowRight />
                </Link>
              </div>

              <div className="product-scroll-wrapper">
                <button
                  className="scroll-btn prod-scroll-left"
                  onClick={() => scrollContainer(`scroll-${cat._id}`, "left")}
                  aria-label="Scroll Left"
                >
                  <FiChevronLeft size={24} />
                </button>

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
                </div>

                <button
                  className="scroll-btn prod-scroll-right"
                  onClick={() => scrollContainer(`scroll-${cat._id}`, "right")}
                  aria-label="Scroll Right"
                >
                  <FiChevronRight size={24} />
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty-category-message">
          No categories found 🎈
        </div>
      )}

      <FloatingCheckoutButton />

      <footer className="home-footer">
        <div className="footer-content">
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
            <p>© {new Date().getFullYear()} Bafna Toys. Spreading Joy! 🚀</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;