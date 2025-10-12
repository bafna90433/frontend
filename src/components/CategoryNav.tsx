import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../utils/api";
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
        <div className="category-scroll">
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
        
        {/* Scroll Indicators */}
        <div className="scroll-indicator left-indicator">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
          </svg>
        </div>
        <div className="scroll-indicator right-indicator">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CategoryNav;