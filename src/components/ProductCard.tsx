// src/components/ProductCard.tsx
import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import "../styles/ProductCard.css";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  images?: string[];
  price: number;
  mrp?: number;
  tagline?: string;
  packSize?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  featured?: boolean;
  sale_end_time?: string;
}

export type Deal = {
  discountType: "NONE" | "PERCENT" | "FLAT";
  discountValue: number;
  endsAt?: string | null;
};

interface ProductCardProps {
  product: Product;
  deal?: Deal; // ✅ NEW
  userRole?: "admin" | "customer";
  index?: number;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const FALLBACK_IMAGE = "/images/placeholder.webp";

// ✅ Match PageSpeed suggestion (display ~282x282) -> serve 300x300
const IMG_W = 300;
const IMG_H = 300;

const safeNum = (v: any, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toAbsUrl = (raw: string) => {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;

  // /uploads/xxx or uploads/xxx
  if (raw.includes("/uploads/")) return `${API_BASE}${raw}`;
  const clean = raw.replace(/^\/+/, "");
  const finalPath =
    clean.startsWith("uploads/") || clean.startsWith("images/")
      ? clean
      : `uploads/${clean}`;
  return `${IMAGE_BASE_URL}/${finalPath}`;
};

/**
 * ✅ Optimized URL builder:
 * - Cloudinary full URL -> inject transforms
 * - Cloudinary public_id (no http) -> build URL
 * - local/backend URL -> keep absolute
 */
const getOptimizedImageUrl = (
  rawUrl: string | undefined,
  width = IMG_W,
  height = IMG_H
) => {
  if (!rawUrl) return FALLBACK_IMAGE;

  try {
    // If public_id stored (no http) and cloudName exists
    if (!rawUrl.startsWith("http") && CLOUD_NAME) {
      const publicId = rawUrl.replace(/^\/+/, "");
      return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width},h_${height},c_fill/${publicId}`;
    }

    const abs = toAbsUrl(rawUrl);

    // Cloudinary full URL -> inject transforms (avoid double-inject)
    if (abs.includes("res.cloudinary.com") && abs.includes("/image/upload/")) {
      if (
        abs.includes("/image/upload/f_auto") ||
        abs.includes("/image/upload/q_") ||
        abs.includes("/image/upload/w_")
      )
        return abs;

      return abs.replace(
        "/image/upload/",
        `/image/upload/f_auto,q_auto,w_${width},h_${height},c_fill/`
      );
    }

    return abs || FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  deal,
  index = 0,
}) => {
  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const cartItem = cartItems.find((item) => item._id === product._id);
  const itemCount = cartItem?.quantity ?? 0;

  const minQty = useMemo(() => (product.price < 60 ? 3 : 2), [product.price]);

  const handleNavigate = () =>
    navigate(
      product.slug ? `/product/${product.slug}` : `/product/${product._id}`
    );

  // ✅ FINAL PRICE (deal apply)
  const finalPrice = useMemo(() => {
    const price = Number(product.price) || 0;

    if (!deal || deal.discountType === "NONE" || !deal.discountValue)
      return price;

    if (deal.discountType === "PERCENT") {
      const pct = Math.min(100, Math.max(0, Number(deal.discountValue) || 0));
      return Math.max(0, Math.round(price * (1 - pct / 100)));
    }

    if (deal.discountType === "FLAT") {
      const flat = Math.max(0, Number(deal.discountValue) || 0);
      return Math.max(0, price - flat);
    }

    return price;
  }, [product.price, deal?.discountType, deal?.discountValue]);

  const actions = {
    add: (e: React.MouseEvent) => {
      e.stopPropagation();
      // ✅ cart me original product hi jaaye (backend price same)
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
  };

  // ✅ Ribbon % (prefer deal percent; else fallback to mrp vs finalPrice)
  const discountPercent = useMemo(() => {
    if (deal?.discountType === "PERCENT") {
      return Math.min(
        99,
        Math.max(0, Math.round(Number(deal.discountValue) || 0))
      );
    }
    if (product.mrp && product.mrp > finalPrice) {
      return Math.round(((product.mrp - finalPrice) / product.mrp) * 100);
    }
    return 0;
  }, [deal?.discountType, deal?.discountValue, product.mrp, finalPrice]);

  const rating = useMemo(() => safeNum(product.rating, 4.5), [product.rating]);

  const imgSrc = useMemo(
    () => getOptimizedImageUrl(product.images?.[0], IMG_W, IMG_H),
    [product.images?.[0]]
  );

  // ✅ Timer: prefer deal.endsAt; else product.sale_end_time
  const endsAt = deal?.endsAt || product.sale_end_time || null;

  useEffect(() => {
    if (!endsAt) return;

    const calculate = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) return null;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return `${days}D ${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculate());
    const timer = window.setInterval(() => {
      const t = calculate();
      setTimeLeft(t);
      if (!t) window.clearInterval(timer);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [endsAt]);

  const eager = index < 2;

  return (
    <div className="pc-wrapper">
      <div
        className="pc-card"
        onClick={handleNavigate}
        role="button"
        tabIndex={0}
      >
        {/* Image */}
        <div className="pc-image-container">
          <div className="pc-image-wrapper">
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
              src={imgSrc}
              alt={product.name}
              className={`pc-img ${imgLoaded ? "pc-img--loaded" : ""}`}
              loading={eager ? "eager" : "lazy"}
              fetchPriority={eager ? "high" : "auto"}
              decoding="async"
              width={IMG_W}
              height={IMG_H}
              onLoad={() => setImgLoaded(true)}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          {discountPercent > 0 && (
            <div className="pc-discount-ribbon">
              <Sparkles size={10} fill="currentColor" />
              <span>{discountPercent}% OFF</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="pc-body">
          {/* TOP ROW */}
          <div className="pc-toprow">
            <div className="pc-topleft">
              <div className="pc-min-qty">
                <Info size={10} /> Min Order: {minQty}
              </div>
            </div>

            <div className="pc-topright">
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
          </div>

          <h3 className="pc-title">{product.name}</h3>

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

          {/* ✅ Price */}
          <div className="pc-price-section">
            <div className="pc-current-price">
              <span className="pc-currency">₹</span>
              <span className="pc-amount">{finalPrice.toLocaleString()}</span>

              {product.mrp && product.mrp > finalPrice && (
                <span className="pc-mrp">
                  MRP ₹{product.mrp.toLocaleString()}
                </span>
              )}
            </div>
          </div>

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
                    <ShoppingCart size={18} strokeWidth={2.5} /> Add to Cart
                  </>
                )}
              </button>
            ) : (
              <div className="pc-quantity-controls">
                <div className="pc-qty-info">
                  <span className="pc-qty-label">Total:</span>
                  {/* ✅ Total uses finalPrice */}
                  <span className="pc-qty-total">
                    ₹{(itemCount * finalPrice).toLocaleString()}
                  </span>
                </div>

                <div className="pc-quantity-buttons">
                  <button
                    onClick={actions.dec}
                    className="pc-qty-btn pc-qty-btn--decrease"
                  >
                    {itemCount === minQty ? (
                      "Del"
                    ) : (
                      <Minus size={14} strokeWidth={3} />
                    )}
                  </button>

                  <span className="pc-qty-val">{itemCount}</span>

                  <button
                    onClick={actions.inc}
                    className="pc-qty-btn pc-qty-btn--increase"
                    disabled={
                      product.stock !== undefined && itemCount >= product.stock
                    }
                  >
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
