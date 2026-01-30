import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../utils/api";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi"; // ✅ Import Icons
import "../styles/CategoryNav.css";

interface Category {
  _id: string;
  name: string;
}

const CategoryNav: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeCategory = params.get("category");
  
  // ✅ 1. Create Ref for the scroll container
  const scrollRef = useRef<HTMLDivElement>(null);

  // ✅ 2. Scroll Function
  const scrollNav = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300; // Distance to scroll
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
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

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('edu') || name.includes('learn')) return '📚';
    if (name.includes('out') || name.includes('sport')) return '⚽';
    if (name.includes('art') || name.includes('craft')) return '🎨';
    if (name.includes('baby') || name.includes('toddler')) return '👶';
    if (name.includes('puzzle') || name.includes('game')) return '🧩';
    if (name.includes('car') || name.includes('vehicle')) return '🚗';
    if (name.includes('doll') || name.includes('action')) return '👸';
    if (name.includes('electronic') || name.includes('tech')) return '🔋';
    return '🧸';
  };

  const formatCategoryName = (name: string) => {
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="category-nav-container">
      <div className="category-nav-wrapper">
        
        {/* ✅ Left Arrow Button (PC Only) */}
        <button 
          className="nav-arrow nav-arrow--left" 
          onClick={() => scrollNav("left")}
          aria-label="Scroll Left"
        >
          <FiChevronLeft size={20} />
        </button>

        {/* Scroll Container with Ref */}
        <div className="category-scroll" ref={scrollRef}>
          {/* All Categories Button */}
          <Link
            to="/products"
            className={`category-item ${!activeCategory ? "active" : ""}`}
          >
            <span className="category-icon">🎮</span>
            <span className="category-text">All Toys</span>
          </Link>

          {/* Category Items */}
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat._id}`}
              className={`category-item ${
                activeCategory === cat._id ? "active" : ""
              }`}
            >
              <span className="category-icon">{getCategoryIcon(cat.name)}</span>
              <span className="category-text">{formatCategoryName(cat.name)}</span>
            </Link>
          ))}
        </div>
        
        {/* ✅ Right Arrow Button (PC Only) */}
        <button 
          className="nav-arrow nav-arrow--right" 
          onClick={() => scrollNav("right")}
          aria-label="Scroll Right"
        >
          <FiChevronRight size={20} />
        </button>

        {/* Visual Fade for Scroll */}
        <div className="scroll-fade-right"></div>
      </div>
    </div>
  );
};

export default CategoryNav;