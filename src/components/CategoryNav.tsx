// src/components/CategoryNav.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../utils/api";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../styles/CategoryNav.css";

interface Category {
  _id: string;
  name: string;
  imageUrl?: string; // ✅ if backend sends category image
  image?: string;    // ✅ optional fallback key
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const CategoryNav: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const activeCategory = params.get("category");

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollNav = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  // ✅ Cloudinary + server url optimize (SMALL ICONS)
  const getOptimizedImgUrl = (url?: string, size = 160) => {
    if (!url) return "";

    // public_id (cloudinary)
    if (!url.startsWith("http") && cloudName) {
      return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${size},h_${size},c_fill/${url}`;
    }

    // absolute
    if (url.startsWith("http")) {
      if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
        if (url.includes("/image/upload/f_auto")) return url;
        return url.replace(
          "/image/upload/",
          `/image/upload/f_auto,q_auto,w_${size},h_${size},c_fill/`
        );
      }
      return url;
    }

    // relative
    if (url.includes("/uploads/")) return `${API_BASE}${url}`;
    return `${IMAGE_BASE_URL}/uploads/${url}`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes("edu") || name.includes("learn")) return "📚";
    if (name.includes("out") || name.includes("sport")) return "⚽";
    if (name.includes("art") || name.includes("craft")) return "🎨";
    if (name.includes("baby") || name.includes("toddler")) return "👶";
    if (name.includes("puzzle") || name.includes("game")) return "🧩";
    if (name.includes("car") || name.includes("vehicle")) return "🚗";
    if (name.includes("doll") || name.includes("action")) return "👸";
    if (name.includes("electronic") || name.includes("tech")) return "🔋";
    return "🧸";
  };

  const formatCategoryName = (name: string) =>
    name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  return (
    <div className="category-nav-container">
      <div className="category-nav-wrapper">
        {/* Left Arrow (Desktop) */}
        <button
          className="nav-arrow nav-arrow--left"
          onClick={() => scrollNav("left")}
          aria-label="Scroll Left"
          type="button"
        >
          <FiChevronLeft size={20} />
        </button>

        <div className="category-scroll" ref={scrollRef}>
          {/* All Toys */}
          <Link
            to="/products"
            className={`category-item ${!activeCategory ? "active" : ""}`}
          >
            <span className="category-icon" aria-hidden>
              🎮
            </span>
            <span className="category-text">All Toys</span>
          </Link>

          {/* Categories */}
          {categories.map((cat, index) => {
            const img = cat.imageUrl || cat.image;
            const imgUrl = img ? getOptimizedImgUrl(img, 160) : "";
            const isFirstFew = index < 6; // ✅ only first few eager

            return (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className={`category-item ${activeCategory === cat._id ? "active" : ""}`}
              >
                {/* ✅ Use image if available else emoji */}
                {imgUrl ? (
                  <img
                    className="cat-circle-img"
                    src={imgUrl}
                    alt={formatCategoryName(cat.name)}
                    width={56}
                    height={56}
                    loading={isFirstFew ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={isFirstFew ? "high" : "auto"}
                  />
                ) : (
                  <span className="category-icon" aria-hidden>
                    {getCategoryIcon(cat.name)}
                  </span>
                )}

                <span className="category-text">{formatCategoryName(cat.name)}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Arrow (Desktop) */}
        <button
          className="nav-arrow nav-arrow--right"
          onClick={() => scrollNav("right")}
          aria-label="Scroll Right"
          type="button"
        >
          <FiChevronRight size={20} />
        </button>

        <div className="scroll-fade-right" />
      </div>
    </div>
  );
};

export default CategoryNav;
