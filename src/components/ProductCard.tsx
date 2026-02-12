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
  Share2 // Share icon added
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
  sale_end_time?: string;
}

interface ProductCardProps {
  product: Product;
  userRole?: "admin" | "customer";
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
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  const cartItem = cartItems.find((item) => item._id === product._id);
  const itemCount = cartItem?.quantity ?? 0;
  const minQty = product.price < 60 ? 3 : 2; 

  const handleNavigate = () => navigate(product.slug ? `/product/${product.slug}` : `/product/${product._id}`);

  // --- Share Logic ---
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Card click se bachne ke liye
    
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
    add: (e: React.MouseEvent) => { e.stopPropagation(); setCartItemQuantity(product, minQty); },
    inc: (e: React.MouseEvent) => { e.stopPropagation(); setCartItemQuantity(product, itemCount + 1); },
    dec: (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextQty = itemCount <= minQty ? 0 : itemCount - 1;
      setCartItemQuantity(product, nextQty);
    }
  };

  const discountPercent = product.mrp && product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
    : 0;

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
      }
      return null;
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [product.sale_end_time]);

  return (
    <div className="pc-wrapper">
      <div className="pc-card" onClick={handleNavigate}>
        
        <div className="pc-image-container">
          <div className="pc-image-wrapper">
            
            {/* Share Button Overlay */}
            <button className="pc-share-btn" onClick={handleShare} aria-label="Share">
              <Share2 size={16} strokeWidth={2.5} />
            </button>

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

            {!imgLoaded && <div className="pc-skeleton" />}
            <img
              src={getOptimizedImageUrl(product.images?.[0] || "", 400)}
              alt={product.name}
              className={`pc-img ${imgLoaded ? "pc-img--loaded" : ""}`}
              loading={index < 4 ? "eager" : "lazy"}
              onLoad={() => setImgLoaded(true)}
            />
          </div>

          {discountPercent > 0 && (
            <div className="pc-discount-ribbon">
              <Sparkles size={10} fill="currentColor" />
              <span>{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        <div className="pc-body">
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

          <h3 className="pc-title">{product.name}</h3>

          <div className="pc-meta-chips">
            {product.tagline && (
              <span className="pc-chip pc-chip--tag">
                <Tag size={10} strokeWidth={2.5} /> {product.tagline}
              </span>
            )}
            {product.packSize && (
              <span className="pc-chip pc-chip--box">
                <Box size={10} strokeWidth={2.5} /> {product.packSize}
              </span>
            )}
            {(product.rating || product.reviews) && (
               <span className="pc-chip pc-chip--rating">
                 <Star size={10} fill="#FBC02D" stroke="none" /> {(product.rating || 4.5).toFixed(1)}
               </span>
            )}
          </div>

          <div className="pc-price-section">
            <div className="pc-price-main">
              <div className="pc-current-price">
                <span className="pc-currency">₹</span>
                <span className="pc-amount">{product.price.toLocaleString()}</span>
                {product.mrp && product.mrp > product.price && (
                  <span className="pc-mrp">MRP ₹{product.mrp.toLocaleString()}</span>
                )}
              </div>
            </div>
            {itemCount === 0 && (
              <div className="pc-min-qty">
                <Info size={10} /> Min Order: {minQty}
              </div>
            )}
          </div>

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