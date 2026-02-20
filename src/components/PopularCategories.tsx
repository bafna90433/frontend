// src/components/PopularCategories.tsx
import React, { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../styles/PopularCategories.css";

type Category = {
  _id: string;
  name: string;
  image?: string;
  imageUrl?: string;
};

interface Props {
  categories: Category[];
  title?: string;
  subtitle?: string;
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const getCatImageRaw = (c: Category) => c.image || c.imageUrl || "";

const getOptimizedCatImage = (url: string, size = 200) => { // ✅ Increased to 200 for HD Crispness
  if (!url) return "";

  if (!url.startsWith("http") && cloudName) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,dpr_auto,w_${size},h_${size},c_fill,g_auto/${url}`;
  }

  if (
    url.startsWith("http") &&
    url.includes("res.cloudinary.com") &&
    url.includes("/image/upload/")
  ) {
    if (url.includes("/image/upload/f_auto")) return url;

    return url.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto,dpr_auto,w_${size},h_${size},c_fill,g_auto/`
    );
  }

  if (url.includes("/uploads/")) return `${API_BASE}${url}`;
  if (!url.startsWith("http")) return `${IMAGE_BASE_URL}/uploads/${url}`;

  return url;
};

const PopularCategories: React.FC<Props> = ({ categories, title, subtitle }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories]
  );

  if (!list.length) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -width / 1.5 : width / 1.5,
      behavior: "smooth",
    });
  };

  return (
    <section className="pc-section">
      <div className="pc-heading">
        <h2>{title || "Popular Categories"}</h2>
        {subtitle && <p>{subtitle}</p>}
        <div className="pc-heading-line"></div> {/* ✅ Added premium underline */}
      </div>

      <div className="pc-slider-container">
        <button
          className="pc-arrow pc-arrow-left"
          onClick={() => scroll("left")}
          type="button"
          aria-label="Scroll left"
        >
          <FiChevronLeft />
        </button>

        <div className="pc-pill">
          <div className="pc-slider" ref={scrollRef}>
            {list.map((cat, index) => {
              const raw = getCatImageRaw(cat);
              // ✅ Fetching 200px image so it looks crisp on 130px desktop circles
              const img = raw ? getOptimizedCatImage(raw, 200) : "";
              const eager = index < 8;

              return (
                <Link
                  key={cat._id}
                  to={`/products?category=${cat._id}`}
                  className="pc-item"
                >
                  <div className="pc-circle">
                    {img ? (
                      <img
                        src={img}
                        alt={cat.name}
                        loading={eager ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={eager ? "high" : "auto"}
                        // ✅ Removed hardcoded width/height so CSS can scale it properly
                      />
                    ) : (
                      <div className="pc-noimg">No Img</div>
                    )}
                  </div>

                  <span className="pc-name">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <button
          className="pc-arrow pc-arrow-right"
          onClick={() => scroll("right")}
          type="button"
          aria-label="Scroll right"
        >
          <FiChevronRight />
        </button>
      </div>
    </section>
  );
};

export default PopularCategories;