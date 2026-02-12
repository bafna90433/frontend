import React, { useState, useEffect } from "react";
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
  Tag,
  Clock,
  Share2 
} from "lucide-react";
import "../styles/ProductCard.css";

// --- Types ---
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
  sale_end_time?: string; 
}

interface ProductCardProps {
  product: Product;
  userRole?: "admin" | "customer";
  index?: number;
}

// --- Helper: Get Optimized Image URL ---
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";
const FALLBACK_IMAGE = "/images/placeholder.webp"; // Ensure this file exists in public/images

const getOptimizedImageUrl = (url: string | undefined, width = 400) => {
  if (!url) return FALLBACK_IMAGE;

  try {
    // 1. Cloudinary Optimization
    if (url.includes("cloudinary.com")) {
      if (url.includes("/upload/w_") || url.includes("/upload/q_")) return url;
      // f_auto = WebP/AVIF, q_auto = Good Quality, c_limit = No stretch
      return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width},c_limit/`);
    }

    // 2. Localhost / Absolute URL Cleanup
    if (url.startsWith("http")) {
      const urlObj = new URL(url);
      if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1" || url.includes(IMAGE_BASE_URL)) {
         const relativePath = urlObj.pathname.replace(/^\/+/, "");
         return `${IMAGE_BASE_URL}/${relativePath}`;
      }
      return url;
    }

    // 3. Relative Path Handling
    const cleanPath = url.replace(/^\/+/, "");
    // If path doesn't start with 'uploads/' or 'images/', assume it needs 'uploads/'
    const finalPath = (cleanPath.startsWith("uploads/") || cleanPath.startsWith("images/")) 
      ? cleanPath 
      : `uploads/${cleanPath}`;

    return `${IMAGE_BASE_URL}/${finalPath}`;

  } catch (e) {
    return FALLBACK_IMAGE;
  }
};

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
   
  // --- Cart & Navigation Logic ---
  const cartItem = cartItems.find((item) => item._id === product._id);
  const itemCount = cartItem?.quantity ?? 0;
  const minQty = product.price < 60 ? 3 : 2; 

  const handleNavigate = () => navigate(product.slug ? `/product/${product.slug}` : `/product/${product._id}`);

  // --- Share Logic ---
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    const shareData = {
      title: product.name,
      text: `Hey! Check out this ${product.name} - ${product.tagline || ''}`,
      url: `${window.location.origin}${product.slug ? `/product/${product.slug}` : `/product/${product._id}`}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

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

  const discountPercent = product.mrp && product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

  const rating = product.rating || 4.5;

  // --- Countdown Timer Logic ---
  useEffect(() => {
    if (!product.sale_end_time) return;

    const calculateTimeLeft = () => {
      const difference = new Date(product.sale_end_time!).getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return `${days}D ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return null;
      }
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const timeLeftStr = calculateTimeLeft();
      setTimeLeft(timeLeftStr);
      if (!timeLeftStr) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [product.sale_end_time]);

  return (
    <div className="pc-wrapper">
      <div className="pc-card" onClick={handleNavigate}>
        
        {/* --- 1. Image Section --- */}
        <div className="pc-image-container">
          <div className="pc-image-wrapper">
            
            {/* Share Button */}
            <button className="pc-share-btn" onClick={handleShare} aria-label="Share">
              <Share2 size={16} strokeWidth={2.5} />
            </button>

            {/* Hot Deal Timer or Featured Badge */}
            {timeLeft ? (
               <div className="pc-hotdeal-timer">
                 <Clock size={12} strokeWidth={3} color="#fbbf24" /> 
                 <span>{timeLeft}</span>
               </div>
            ) : (
              product.featured && (
                <div className="pc-top-badges">
                  <span className="pc-badge pc-badge--featured">
                    <TrendingUp size={10} strokeWidth={3} /> Featured
                  </span>
                </div>
              )
            )}

            {/* Main Image */}
            {!imgLoaded && <div className="pc-skeleton" />}
            <img
              src={getOptimizedImageUrl(product.images?.[0] || "", 400)}
              alt={product.name}
              className={`pc-img ${imgLoaded ? "pc-img--loaded" : ""}`}
              loading={index < 4 ? "eager" : "lazy"}
              width="400"
              height="400"
              onLoad={() => setImgLoaded(true)}
            />
          </div>

          {/* Discount Ribbon */}
          {discountPercent > 0 && (
            <div className="pc-discount-ribbon">
              <Sparkles size={10} fill="currentColor" />
              <span>{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        {/* --- 2. Body Section --- */}
        <div className="pc-body">
          
          {/* Stock Status Row */}
          <div className="pc-meta-row">
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

          {/* Meta Chips */}
          <div className="pc-meta-chips">
            {product.tagline && (
              <span className="pc-chip pc-chip--tag">
                <Tag size={10} strokeWidth={2.5} /> 
                {product.tagline}
              </span>
            )}
            {product.packSize && (
              <span className="pc-chip pc-chip--box">
                <Box size={10} strokeWidth={2.5} /> 
                {product.packSize}
              </span>
            )}
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