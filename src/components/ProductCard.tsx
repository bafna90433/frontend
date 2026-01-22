import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { 
  ShoppingCart, 
  Zap, 
  Tag, 
  Box, 
  Plus, 
  Minus,
  Info,
  Star,
  Eye,
  TrendingUp,
  Shield,
  CheckCircle,
  Sparkles
} from "lucide-react";
import "../styles/ProductCard.css";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  sku?: string;
  images?: string[];
  price: number;
  mrp?: number;
  tagline?: string;
  packSize?: string;
  category?: { _id: string; name: string } | string;
  stock?: number;
  rating?: number;
  reviews?: number;
  featured?: boolean;
}

interface ProductCardProps {
  product: Product;
  userRole: "admin" | "customer";
  index?: number;
}

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const getOptimizedImageUrl = (url: string, width = 400) => {
  if (!url) return "";
  if (url.includes("res.cloudinary.com")) return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
  if (url.startsWith("http")) return url;
  return `${IMAGE_BASE_URL}/uploads/${encodeURIComponent(url)}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const cartItem = cartItems.find((item) => item._id === product._id);
  const itemCount = cartItem?.quantity ?? 0;
  const minQty = product.price < 60 ? 3 : 2;

  const handleNavigate = () => navigate(product.slug ? `/product/${product.slug}` : `/product/${product._id}`);

  const actions = {
    add: (e: React.MouseEvent) => { 
      e.stopPropagation(); 
      setCartItemQuantity(product, minQty); 
    },
    inc: (e: React.MouseEvent) => { 
      e.stopPropagation(); 
      setCartItemQuantity(product, itemCount + 1); 
    },
    dec: (e: React.MouseEvent) => { 
      e.stopPropagation(); 
      const nextQty = itemCount <= minQty ? 0 : itemCount - 1;
      setCartItemQuantity(product, nextQty); 
    },
    quickView: (e: React.MouseEvent) => {
      e.stopPropagation();
      // Add quick view modal logic here
      console.log("Quick view:", product._id);
    }
  };

  const categoryName = typeof product.category === "object" ? product.category?.name : product.category;
  const discountPercent = product.mrp && product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  // Calculate rating stars
  const rating = product.rating || 4.5;
  const filledStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div 
      className="pc-wrapper" 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="pc-card">
        {/* Glassmorphic Top Badges */}
        <div className="pc-top-badges">
          {product.featured && (
            <span className="pc-badge pc-badge--featured">
              <TrendingUp size={10} /> Featured
            </span>
          )}
          {/* Hot Deal removed */}
        </div>

        {/* Product Image with Interactive Overlay */}
        <div className="pc-image-container" onClick={handleNavigate}>
          <div className="pc-image-wrapper">
            {!imgLoaded && <div className="pc-skeleton" />}
            <img
              src={getOptimizedImageUrl(product.images?.[0] || "", 400)}
              alt={product.name}
              className={`pc-img ${imgLoaded ? "pc-img--loaded" : ""}`}
              loading={index < 4 ? "eager" : "lazy"}
              onLoad={() => setImgLoaded(true)}
            />
            {/* Gradient Overlay */}
            <div className="pc-image-gradient" />
            
            {/* Quick Actions Overlay */}
            <div className={`pc-quick-actions ${isHovered ? "pc-quick-actions--visible" : ""}`}>
              <button className="pc-action-btn pc-action-btn--view" onClick={actions.quickView}>
                <Eye size={18} />
              </button>
            </div>
          </div>

          {/* Discount Ribbon */}
          {discountPercent > 0 && (
            <div className="pc-discount-ribbon">
              <Sparkles size={10} />
              <span>{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        <div className="pc-body">
          {/* Category and Stock Status */}
          <div className="pc-meta-row">
            <span className="pc-category-tag">
              {categoryName || "Toys"}
            </span>
            <div className="pc-stock-status">
              {product.stock === 0 ? (
                <span className="pc-stock pc-stock--out">Out of Stock</span>
              ) : product.stock && product.stock <= 10 ? (
                <span className="pc-stock pc-stock--low">
                  <Zap size={10} /> {product.stock} left
                </span>
              ) : (
                <span className="pc-stock pc-stock--in">
                  <CheckCircle size={10} /> In Stock
                </span>
              )}
            </div>
          </div>

          {/* Product Title */}
          <h3 className="pc-title" onClick={handleNavigate}>
            {product.name}
            {product.sku && <span className="pc-sku-badge">#{product.sku.slice(0, 6)}</span>}
          </h3>

          {/* Rating */}
          {(product.rating || product.reviews) && (
            <div className="pc-rating">
              <div className="pc-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    fill={i < filledStars ? "#fbbf24" : i === filledStars && hasHalfStar ? "url(#half-star)" : "none"}
                    className={i < filledStars ? "pc-star pc-star--filled" : "pc-star"}
                  />
                ))}
              </div>
              <span className="pc-rating-text">{rating.toFixed(1)}</span>
              {product.reviews && (
                <span className="pc-reviews">({product.reviews} reviews)</span>
              )}
            </div>
          )}

          {/* Product Specs */}
          <div className="pc-specs">
            {product.tagline && (
              <span className="pc-spec-item">
                <Tag size={10} /> {product.tagline}
              </span>
            )}
            {product.packSize && (
              <span className="pc-spec-item">
                <Box size={10} /> {product.packSize}
              </span>
            )}
          </div>

          {/* Pricing Section */}
          <div className="pc-price-section">
            <div className="pc-price-main">
              <div className="pc-current-price">
                <span className="pc-currency">₹</span>
                <span className="pc-amount">{product.price.toLocaleString()}</span>
                {product.mrp && product.mrp > product.price && (
                  <span className="pc-mrp">
                    <span className="pc-mrp-label">MRP </span>
                    <span className="pc-mrp-value">₹{product.mrp.toLocaleString()}</span>
                  </span>
                )}
              </div>
              
              {discountPercent > 0 && (
                <div className="pc-savings">
                  Save ₹{(product.mrp! - product.price).toLocaleString()}
                </div>
              )}
            </div>

            {/* Min Qty Indicator */}
            {itemCount === 0 && (
              <div className="pc-min-qty">
                <Info size={10} /> Minimum order: {minQty} items
              </div>
            )}
          </div>

          {/* Cart Actions */}
          <div className="pc-actions">
            {itemCount === 0 ? (
              <button 
                className="pc-add-to-cart" 
                onClick={actions.add}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? (
                  <>
                    <Shield size={16} /> Notify Me
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    <span>Add to Cart</span>
                    <span className="pc-min-indicator">Min {minQty}</span>
                  </>
                )}
              </button>
            ) : (
              <div className="pc-quantity-controls">
                <div className="pc-quantity-display">
                  <span className="pc-quantity-label">In cart:</span>
                  <span className="pc-quantity-value">{itemCount}</span>
                  <span className="pc-quantity-total">₹{(itemCount * product.price).toLocaleString()}</span>
                </div>
                <div className="pc-quantity-buttons">
                  <button 
                    onClick={actions.dec} 
                    className="pc-qty-btn pc-qty-btn--decrease"
                    title={itemCount === minQty ? "Remove from cart" : "Decrease quantity"}
                  >
                    {itemCount === minQty ? "Remove" : <Minus size={14} />}
                  </button>
                  <button 
                    onClick={actions.inc} 
                    className="pc-qty-btn pc-qty-btn--increase"
                    disabled={product.stock !== undefined && itemCount >= product.stock}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;