import React, { useState, useEffect } from "react";
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
  Trash2,  // Premium icon for delete/remove
  Tag,     // ✅ Naya icon added
  Package  // ✅ Naya icon added
} from "lucide-react";
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
  packSize?: string;        // ✅ Added
  piecesPerPacket?: number; // ✅ Added
}

const MEDIA_BASE_URL =
  (import.meta.env.VITE_MEDIA_URL as string)?.replace(/\/+$/, "") ||
  (import.meta.env.VITE_IMAGE_BASE_URL as string)?.replace(/\/+$/, "") ||
  "https://bafnatoys-backend-production.up.railway.app";

const getOptimizedImageUrl = (url: string, width = 260) => {
  if (!url) return "";

  if (url.includes("res.cloudinary.com")) {
    return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
  }

  if (url.startsWith("http")) return url;

  const clean = url.replace(/^\/+/, "");
  if (clean.startsWith("uploads/")) {
    return `${MEDIA_BASE_URL}/${clean}`;
  }

  return `${MEDIA_BASE_URL}/uploads/${encodeURIComponent(clean)}`;
};

const TrendingProductCard: React.FC<{ product?: Product }> = ({ product }) => {
  if (!product) return null;

  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const cartItem = cartItems.find((item: any) => item._id === product._id);
  const itemCount = cartItem?.quantity ?? 0;

  const minQty = product.price < 60 ? 3 : 2;

  const handleNavigate = () =>
    navigate(product.slug ? `/product/${product.slug}` : `/product/${product._id}`);

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

  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  // ✅ Precision Timer Logic
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
      {/* =========================================
          LEFT: IMAGE & BADGES (Fixed Size via CSS)
      ========================================= */}
      <div className="t-imgbox">
        
        {/* Badges Container */}
        <div className="t-badges">
          {timeLeft ? (
            <span className="t-badge t-badge--timer">
              <Clock size={10} strokeWidth={3} style={{ marginRight: 4 }} /> {timeLeft}
            </span>
          ) : product.featured ? (
            <span className="t-badge t-badge--featured">
              <TrendingUp size={10} strokeWidth={3} style={{ marginRight: 4 }} /> Featured
            </span>
          ) : null}
        </div>

        {/* Image Skeleton for smooth loading */}
        {!imgLoaded && <div className="t-img-skel" />}

        <img
          src={getOptimizedImageUrl(product.images?.[0] || "", 260)}
          alt={product.name}
          className={`t-img ${imgLoaded ? "loaded" : ""}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />

        {/* Discount Ribbon (Bottom Right) */}
        {discountPercent > 0 && (
          <div className="t-discount">
            <Sparkles size={10} fill="currentColor" style={{ marginRight: 3 }} />
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* =========================================
          RIGHT: INFO & CONTROLS
      ========================================= */}
      <div className="t-info">
        
        {/* Top Row: Stock Status */}
        <div className="t-toprow">
          <div className="t-spacer" />
          <div className="t-stock-mini">
            {product.stock === 0 ? (
              <span style={{ color: "#FF2A75" }}> {/* Brand Pink */}
                <Shield size={12} strokeWidth={2.5} /> Out of Stock
              </span>
            ) : product.stock && product.stock <= 10 ? (
              <span style={{ color: "#FFC000" }}> {/* Brand Yellow */}
                <Zap size={12} strokeWidth={2.5} /> Only {product.stock} left
              </span>
            ) : (
              <span style={{ color: "#00E5B5" }}> {/* Brand Mint */}
                <CheckCircle size={12} strokeWidth={2.5} /> In Stock
              </span>
            )}
          </div>
        </div>

        {/* Title (Truncated to 20 characters) */}
        <h3 className="t-name" title={product.name}>
          {product.name.length > 20 ? product.name.substring(0, 20) + "..." : product.name}
        </h3>

        {/* ✅ Naye Per Packet Badges */}
        <div className="t-packet-badges">
          <span className="t-badge-yellow">
            <Tag size={10} style={{ marginRight: 4 }} /> Per Packet Price
          </span>
          <span className="t-badge-blue">
            <Package size={10} style={{ marginRight: 4 }} /> Per Packet {product.piecesPerPacket || product.packSize || 1} pieces
          </span>
        </div>

        {/* Price & Actions Row */}
        <div className="t-priceRow">
          <div className="t-price">
            ₹{product.price.toLocaleString()}
            {product.mrp && product.mrp > product.price && (
              <span className="t-mrp">₹{product.mrp.toLocaleString()}</span>
            )}
          </div>

          {/* Cart Buttons */}
          {itemCount === 0 ? (
            <button
              className="t-btn"
              type="button"
              onClick={actions.add}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? (
                <>
                  <Shield size={14} /> Notify
                </>
              ) : (
                <>
                  <ShoppingCart size={14} /> Add
                </>
              )}
            </button>
          ) : (
            <div className="t-qty-controls" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={actions.dec} className="t-qty-btn">
                {/* Premium Trash icon when at min quantity */}
                {itemCount === minQty ? <Trash2 size={14} strokeWidth={2.5} color="#FF2A75"/> : <Minus size={14} strokeWidth={3} />}
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

        {/* Bottom Row: Min Order Info & Total */}
        <div className="t-actions-row">
          {itemCount === 0 ? (
            <div className="t-min-qty">
              <Info size={12} color="#00B4FF" /> Min Order: {minQty}
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