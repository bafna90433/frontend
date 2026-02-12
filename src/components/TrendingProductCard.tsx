import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import {
  ShoppingCart,
  Plus,
  Minus,
  Info,
  Shield,
  CheckCircle,
  Zap,
  Clock,
  Sparkles,
  TrendingUp,
  Share2 // ✅ Added Share Icon
} from "lucide-react";
import { getImageUrl } from "../utils/image"; // ✅ Import the optimized helper
import "../styles/TrendingSection.css";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  images?: string[];
  price: number;
  mrp?: number;
  stock?: number;
  rating?: number;
  reviews?: number;
  sale_end_time?: string;
  featured?: boolean;
  tagline?: string; // Added for share text
}

const TrendingProductCard: React.FC<{ product?: Product }> = ({ product }) => {
  if (!product) return null;

  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // ✅ Memoize heavy derived state
  const { itemCount, minQty, discountPercent, imageUrl } = useMemo(() => {
    const cartItem = cartItems.find((item: any) => item._id === product._id);
    const count = cartItem?.quantity ?? 0;
    const min = product.price < 60 ? 3 : 2;
    
    const discount = product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

    // Optimize image for this card size (260px width)
    const imgUrl = getImageUrl(product.images?.[0], 260);

    return { itemCount: count, minQty: min, discountPercent: discount, imageUrl: imgUrl };
  }, [product, cartItems]);

  const handleNavigate = () =>
    navigate(product.slug ? `/product/${product.slug}` : `/product/${product._id}`);

  // ✅ Share Logic
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ${product.tagline || 'Best Wholesale Toy'}`,
      url: `${window.location.origin}${product.slug ? `/product/${product.slug}` : `/product/${product._id}`}`,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copied!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const actions = {
    add: (e: React.MouseEvent) => {
      e.stopPropagation();
      setCartItemQuantity(product as any, minQty);
    },
    inc: (e: React.MouseEvent) => {
      e.stopPropagation();
      setCartItemQuantity(product as any, itemCount + 1);
    },
    dec: (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextQty = itemCount <= minQty ? 0 : itemCount - 1;
      setCartItemQuantity(product as any, nextQty);
    },
  };

  // ✅ Timer Logic
  useEffect(() => {
    if (!product.sale_end_time) return;

    const calculateTimeLeft = () => {
      const difference = new Date(product.sale_end_time!).getTime() - Date.now();
      if (difference <= 0) return null;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      return `${days}D ${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const t = calculateTimeLeft();
      setTimeLeft(t);
      if (!t) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [product.sale_end_time]);

  return (
    <div className="t-card" onClick={handleNavigate} role="button" tabIndex={0}>
      {/* Left Image */}
      <div className="t-imgbox">
        
        {/* ✅ Share Button */}
        <button className="t-share-btn" onClick={handleShare} aria-label="Share">
           <Share2 size={14} strokeWidth={2.5} />
        </button>

        {/* Badges */}
        <div className="t-badges">
          {timeLeft ? (
            <span className="t-badge t-badge--timer">
              <Clock size={9} strokeWidth={3} style={{ marginRight: 3 }} /> {timeLeft}
            </span>
          ) : product.featured ? (
            <span className="t-badge t-badge--featured">
              <TrendingUp size={9} strokeWidth={3} style={{ marginRight: 3 }} /> Featured
            </span>
          ) : null}
        </div>

        {/* Skeleton & Image */}
        {!imgLoaded && <div className="t-img-skel" />}
        <img
          src={imageUrl}
          alt={product.name}
          className={`t-img ${imgLoaded ? "loaded" : ""}`}
          loading="lazy"
          width="260" // ✅ Fix CLS
          height="260"
          onLoad={() => setImgLoaded(true)}
        />

        {/* Discount Ribbon */}
        {discountPercent > 0 && (
          <div className="t-discount">
            <Sparkles size={9} fill="currentColor" style={{ marginRight: 2 }} />
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Right Info */}
      <div className="t-info">
        <div className="t-toprow">
          <div className="t-spacer" />
          <div className="t-stock-mini">
            {product.stock === 0 ? (
              <span><Shield size={12} /> Out</span>
            ) : product.stock && product.stock <= 10 ? (
              <span><Zap size={12} /> {product.stock} left</span>
            ) : (
              <span><CheckCircle size={12} /> In</span>
            )}
          </div>
        </div>

        <h3 className="t-name">{product.name}</h3>

        <div className="t-priceRow">
          <div className="t-price">
            ₹{product.price.toLocaleString()}
            {product.mrp && product.mrp > product.price ? (
              <span className="t-mrp">₹{product.mrp.toLocaleString()}</span>
            ) : null}
          </div>

          {itemCount === 0 ? (
            <button
              className="t-btn"
              type="button"
              onClick={actions.add}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? (
                <> <Shield size={14} /> Notify </>
              ) : (
                <> <ShoppingCart size={14} /> Add </>
              )}
            </button>
          ) : (
            <div className="t-qty-controls" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={actions.dec} className="t-qty-btn">
                {itemCount === minQty ? "Del" : <Minus size={14} strokeWidth={3} />}
              </button>
              <span className="t-qty-val">{itemCount}</span>
              <button
                type="button"
                onClick={actions.inc}
                className="t-qty-btn"
                disabled={product.stock !== undefined && itemCount >= product.stock}
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>

        <div className="t-actions-row">
          {itemCount === 0 ? (
            <div className="t-min-qty">
              <Info size={12} /> Min Order: {minQty}
            </div>
          ) : (
            <div className="t-total">Total: ₹{(itemCount * product.price).toLocaleString()}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendingProductCard;