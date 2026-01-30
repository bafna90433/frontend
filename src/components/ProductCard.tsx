import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { 
  ShoppingCart, 
  Zap, 
  Box, 
  Plus, 
  Minus, 
  Info, 
  Star, 
  TrendingUp, 
  Shield, 
  CheckCircle, 
  Sparkles,
  Tag
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
  // Hover state removed as it was only used for Quick View
  
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
    }
  };

  const categoryName = typeof product.category === "object" ? product.category?.name : product.category;
  const discountPercent = product.mrp && product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  // Rating Logic
  const rating = product.rating || 4.5;

  return (
    <div className="pc-wrapper">
      <div className="pc-card" onClick={handleNavigate}>
        
        {/* --- 1. Image Section --- */}
        <div className="pc-image-container">
          <div className="pc-image-wrapper">
            
            {/* Top Badges */}
            <div className="pc-top-badges">
              {product.featured && (
                <span className="pc-badge pc-badge--featured">
                  <TrendingUp size={10} strokeWidth={3} /> Featured
                </span>
              )}
            </div>

            {/* Main Image */}
            {!imgLoaded && <div className="pc-skeleton" />}
            <img
              src={getOptimizedImageUrl(product.images?.[0] || "", 400)}
              alt={product.name}
              className={`pc-img ${imgLoaded ? "pc-img--loaded" : ""}`}
              loading={index < 4 ? "eager" : "lazy"}
              onLoad={() => setImgLoaded(true)}
            />
            
            {/* Quick View Removed */}
          </div>

          {/* Discount Ribbon (Bottom Right) */}
          {discountPercent > 0 && (
            <div className="pc-discount-ribbon">
              <Sparkles size={10} fill="currentColor" />
              <span>{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        {/* --- 2. Body Section --- */}
        <div className="pc-body">
          
          {/* Stock & Category Row */}
          <div className="pc-meta-row">
            <span className="pc-category-tag">{categoryName || "Toys"}</span>
            <div className="pc-stock-status">
               {product.stock === 0 ? (
                <span className="pc-stock pc-stock--out">Out of Stock</span>
              ) : product.stock && product.stock <= 10 ? (
                <span className="pc-stock pc-stock--low">
                  <Zap size={10} fill="currentColor" /> {product.stock} left
                </span>
              ) : (
                <span className="pc-stock pc-stock--in">
                  <CheckCircle size={10} /> In Stock
                </span>
              )}
            </div>
          </div>

          {/* Product Title */}
          <h3 className="pc-title">
            {product.name}
          </h3>

          {/* Meta Chips: SKU, Tagline, Pack Size */}
          <div className="pc-meta-chips">
            
            {/* SKU Chip (Purple) */}
            {product.sku && (
              <span className="pc-chip pc-chip--sku">
                <span className="pc-chip-hash">#</span> 
                {product.sku.replace("#", "").slice(0, 8)}
              </span>
            )}

            {/* Tagline Chip (Orange) - ADDED BACK */}
            {product.tagline && (
              <span className="pc-chip pc-chip--tag">
                <Tag size={10} strokeWidth={2.5} /> 
                {product.tagline}
              </span>
            )}

            {/* Pack Size Chip (Blue) */}
            {product.packSize && (
              <span className="pc-chip pc-chip--box">
                <Box size={10} strokeWidth={2.5} /> 
                {product.packSize}
              </span>
            )}

            {/* Rating Chip (Yellow) */}
            {(product.rating || product.reviews) && (
               <span className="pc-chip pc-chip--rating">
                 <Star size={10} fill="#FBC02D" stroke="none" /> 
                 {rating.toFixed(1)}
               </span>
            )}
          </div>

          {/* --- 3. Price & Actions Section --- */}
          <div className="pc-price-section">
            <div className="pc-price-main">
              <div className="pc-current-price">
                <span className="pc-currency">₹</span>
                <span className="pc-amount">{product.price.toLocaleString()}</span>
                {product.mrp && product.mrp > product.price && (
                  <span className="pc-mrp">
                    MRP ₹{product.mrp.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Min Qty Alert */}
            {itemCount === 0 && (
              <div className="pc-min-qty">
                <Info size={10} /> Min Order: {minQty}
              </div>
            )}
          </div>

          {/* Cart Buttons */}
          <div className="pc-actions">
            {itemCount === 0 ? (
              <button 
                className="pc-add-to-cart" 
                onClick={actions.add}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? (
                  <> <Shield size={16} /> Notify Me </>
                ) : (
                  <> <ShoppingCart size={18} strokeWidth={2.5} /> Add to Cart </>
                )}
              </button>
            ) : (
              <div className="pc-quantity-controls">
                <div className="pc-qty-info">
                   <span className="pc-qty-label">Total:</span>
                   <span className="pc-qty-total">₹{(itemCount * product.price).toLocaleString()}</span>
                </div>
                <div className="pc-quantity-buttons">
                  <button onClick={actions.dec} className="pc-qty-btn pc-qty-btn--decrease">
                    {itemCount === minQty ? "Del" : <Minus size={14} strokeWidth={3} />}
                  </button>
                  <span className="pc-qty-val">{itemCount}</span>
                  <button onClick={actions.inc} className="pc-qty-btn pc-qty-btn--increase" disabled={product.stock !== undefined && itemCount >= product.stock}>
                    <Plus size={14} strokeWidth={3} />
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