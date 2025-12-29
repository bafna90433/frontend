import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { 
  ShoppingCart, 
  Lock, 
  Zap, 
  Tag, 
  Box, 
  Plus, 
  Minus,
  Info 
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
}

interface ProductCardProps {
  product: Product;
  userRole: "admin" | "customer";
  index?: number;
}

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const getOptimizedImageUrl = (url: string, width = 300) => {
  if (!url) return "";
  if (url.includes("res.cloudinary.com")) return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
  if (url.startsWith("http")) return url;
  return `${IMAGE_BASE_URL}/uploads/${encodeURIComponent(url)}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved;

  const cartItem = cartItems.find((item) => item._id === product._id);
  const itemCount = cartItem?.quantity ?? 0;

  // --- NEW LOGIC: Calculate Minimum Quantity ---
  const minQty = product.price < 60 ? 3 : 2;

  const handleNavigate = () => navigate(product.slug ? `/product/${product.slug}` : `/product/${product._id}`);

  const actions = {
    // Starts with the minimum quantity instead of 1
    add: (e: React.MouseEvent) => { 
      e.stopPropagation(); 
      setCartItemQuantity(product, minQty); 
    },
    inc: (e: React.MouseEvent) => { 
      e.stopPropagation(); 
      setCartItemQuantity(product, itemCount + 1); 
    },
    // If decrementing would go below minimum, remove from cart (set to 0)
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

  return (
    <div className="pc-wrapper">
      <div className="pc-card">
        <div className="pc-badge-container">
          {product.stock !== undefined && product.stock <= 10 && product.stock > 0 && (
            <span className="pc-badge pc-badge--low"><Zap size={10} /> Limited</span>
          )}
          {discountPercent > 0 && isApproved && (
            <span className="pc-badge pc-badge--discount">{discountPercent}% OFF</span>
          )}
        </div>

        <div className="pc-image-box" onClick={handleNavigate}>
          {!imgLoaded && <div className="pc-skeleton" />}
          <img
            src={getOptimizedImageUrl(product.images?.[0] || "", 300)}
            alt={product.name}
            className={`pc-img ${imgLoaded ? "pc-img--loaded" : ""}`}
            loading={index < 4 ? "eager" : "lazy"}
            onLoad={() => setImgLoaded(true)}
          />
        </div>

        <div className="pc-body">
          <div className="pc-meta">
            <span className="pc-cat">{categoryName || "Toys"}</span>
            {product.sku && <span className="pc-sku">#{product.sku.slice(0, 8)}</span>}
          </div>

          <h3 className="pc-title" onClick={handleNavigate} title={product.name}>
            {product.name}
          </h3>

          {(product.tagline || product.packSize) && (
            <div className="pc-specs">
              {product.tagline && <span className="pc-spec-item"><Tag size={10} /> {product.tagline}</span>}
              {product.packSize && <span className="pc-spec-item"><Box size={10} /> {product.packSize}</span>}
            </div>
          )}

          {/* Pricing Area */}
          <div className="pc-price-box">
            {isApproved ? (
              <div className="pc-pricing">
                <div className="pc-main-price">
                  <span className="pc-currency">₹</span>
                  <span className="pc-amount">{product.price.toLocaleString()}</span>
                  
                  {product.mrp && product.mrp > product.price && (
                    <span className="pc-mrp-wrapper">
                      <span className="pc-mrp-label">MRP: </span>
                      <span className="pc-mrp-value">₹{product.mrp.toLocaleString()}</span>
                    </span>
                  )}
                </div>
                
                {/* Visual hint for Minimum Order */}
                {itemCount === 0 && (
                   <div className="pc-min-qty-info">
                     <Info size={10} /> Min. Qty: {minQty}
                   </div>
                )}

                {itemCount > 0 && (
                  <div className="pc-total-tag">Total: ₹{(itemCount * product.price).toLocaleString()}</div>
                )}
              </div>
            ) : (
              <div className="pc-locked"><Lock size={12} /> Login for Price</div>
            )}
          </div>

          <div className="pc-footer">
            {!isApproved ? (
               <button className="pc-btn-locked" onClick={handleNavigate}>View Details</button>
            ) : itemCount === 0 ? (
              <button 
                className="pc-add-btn" 
                onClick={actions.add}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? "Out of Stock" : <><ShoppingCart size={16} /> Add (Min {minQty})</>}
              </button>
            ) : (
              <div className="pc-stepper">
                <button onClick={actions.dec} className="pc-step-btn">
                  {/* Show Trash icon or Minus depending on if it's at Min Qty */}
                  <Minus size={14} />
                </button>
                <span className="pc-step-count">{itemCount}</span>
                <button 
                  onClick={actions.inc} 
                  className="pc-step-btn"
                  disabled={product.stock !== undefined && itemCount >= product.stock}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;