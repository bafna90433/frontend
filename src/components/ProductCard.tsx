import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom"; 
import { useShop } from "../context/ShopContext";
import {
  ShoppingCart,
  Box,
  Plus,
  Minus,
  Info,
  Star,
  TrendingUp,
  Shield,
  Sparkles,
  Tag,
  Clock,
} from "lucide-react";
import "../styles/ProductCard.css";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  category?: string | { _id?: string; name?: string };
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
  unit?: string;
  piecesPerUnit?: number;
  isBulkOnly?: boolean;
  minOrderQty?: number; // ✅
}

export type Deal = {
  discountType: "NONE" | "PERCENT" | "FLAT";
  discountValue: number;
  endsAt?: string | null;
};

interface ProductCardProps {
  product: Product;
  deal?: Deal;
  userRole?: "admin" | "customer";
  index?: number;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const FALLBACK_IMAGE = "/images/placeholder.webp";
// ✅ CHANGED: Increased dimensions to 400x400 to fix blur issue
const IMG_W = 400; 
const IMG_H = 400;

const safeNum = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const toAbsUrl = (raw: string): string => {
  if (!raw) return "";
  if (raw.startsWith("http")) return raw;

  if (raw.includes("/uploads/")) return `${API_BASE}${raw}`;
  const clean = raw.replace(/^\/+/, "");
  const finalPath =
    clean.startsWith("uploads/") || clean.startsWith("images/")
      ? clean
      : `uploads/${clean}`;
  return `${IMAGE_BASE_URL}/${finalPath}`;
};

const getOptimizedImageUrl = (
  rawUrl: string | undefined,
  width = IMG_W,
  height = IMG_H
): string => {
  if (!rawUrl) return FALLBACK_IMAGE;

  try {
    if (rawUrl.includes("ik.imagekit.io")) {
      const separator = rawUrl.includes('?') ? '&' : '?';
      // ✅ CHANGED: Increased quality to 80 (q-80) for sharpness
      return `${rawUrl}${separator}tr=w-${width},h-${height},cm-pad_resize,f-auto,q-80`;
    }

    if (!rawUrl.startsWith("http") && CLOUD_NAME) {
      const publicId = rawUrl.replace(/^\/+/, "");
      // ✅ CHANGED: Reverted to standard q_auto for better clarity
      return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width},h_${height},c_fill/${publicId}`;
    }

    const abs = toAbsUrl(rawUrl);

    if (abs.includes("res.cloudinary.com") && abs.includes("/image/upload/")) {
      if (
        abs.includes("/image/upload/f_auto") ||
        abs.includes("/image/upload/q_") ||
        abs.includes("/image/upload/w_")
      ) {
        return abs;
      }
      return abs.replace(
        "/image/upload/",
        `/image/upload/f_auto,q_auto,w_${width},h_${height},c_fill/`
      );
    }

    return abs || FALLBACK_IMAGE;
  } catch (error) {
    console.error("Image Optimization Error:", error);
    return FALLBACK_IMAGE;
  }
};

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ product, deal, index = 0 }) => {
    const { cartItems, setCartItemQuantity } = useShop();
    const [imgLoaded, setImgLoaded] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    const cartItem = cartItems.find((item) => item._id === product._id);
    const itemCount = cartItem?.quantity ?? 0;

    const productUrl = product.slug ? `/product/${product.slug}` : `/product/${product._id}`;

    const { stepQty, minQty, parsedUnit, isBulk } = useMemo(() => {
      const dbPieces = Number(product.piecesPerUnit) || 1;
      const dbUnit = product.unit || "Piece";
      const strictBulk = product.isBulkOnly || false;
      const dbMQ = Number(product.minOrderQty) || 0; // ✅ Manual MQ field

      if (strictBulk && dbPieces > 1) {
        return { stepQty: dbPieces, minQty: Math.max(dbMQ, dbPieces), parsedUnit: dbUnit, isBulk: true };
      } else {
        let finalMinQty = 1;
        if (dbMQ > 0) {
          finalMinQty = dbMQ;
        } else {
          const fallbackMin = (Number(product.price) || 0) < 60 ? 3 : 2;
          finalMinQty = dbPieces > 1 ? dbPieces : fallbackMin;
        }
        return { stepQty: 1, minQty: finalMinQty, parsedUnit: dbUnit, isBulk: dbPieces > 1 };
      }
    }, [product.piecesPerUnit, product.unit, product.price, product.isBulkOnly, product.minOrderQty]);

    const showTagline = useMemo(() => {
      if (!product.tagline) return false;
      const lower = product.tagline.toLowerCase();
      if (lower.includes("per ") || lower.includes("price")) return false;
      return true;
    }, [product.tagline]);

    const displayCategory = useMemo(() => {
      if (!product.category) return "";
      if (typeof product.category === "object") return product.category.name || "";
      return product.category;
    }, [product.category]);

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
    }, [product.price, deal]);

    const handleAdd = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCartItemQuantity(product, minQty);

        if (typeof window !== "undefined" && (window as any).fbq) {
          (window as any).fbq('track', 'AddToCart', {
            content_name: product.name,
            content_ids: [product._id],
            content_type: 'product',
            value: finalPrice * minQty,
            currency: 'INR'
          });
        }
      },
      [product, minQty, setCartItemQuantity, finalPrice]
    );

    const handleInc = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCartItemQuantity(product, itemCount + stepQty);
      },
      [product, itemCount, stepQty, setCartItemQuantity]
    );

    const handleDec = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const nextQty = itemCount <= minQty ? 0 : itemCount - stepQty;
        setCartItemQuantity(product, nextQty);
      },
      [product, itemCount, minQty, stepQty, setCartItemQuantity]
    );

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
    }, [deal, product.mrp, finalPrice]);

    const rating = useMemo(() => safeNum(product.rating, 0), [product.rating]);
    const totalReviews = useMemo(
      () => safeNum(product.reviews, 0),
      [product.reviews]
    );

    const imgSrc = useMemo(
      () => getOptimizedImageUrl(product.images?.[0], IMG_W, IMG_H),
      [product.images]
    );

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

    const eager = index < 4;

    return (
      <div className="pc-wrapper">
        <article className="pc-card">
          
          <Link to={productUrl} className="pc-image-container" style={{ display: 'block', textDecoration: 'none' }}>
            <div className="pc-image-wrapper">
              {timeLeft ? (
                <div className="pc-hotdeal-timer" aria-live="polite">
                  <Clock size={12} strokeWidth={2.5} />
                  <span>{timeLeft}</span>
                </div>
              ) : (
                product.featured && (
                  <div className="pc-top-badges">
                    <span className="pc-badge pc-badge--featured">
                      <TrendingUp size={10} strokeWidth={2.5} />
                      Featured
                    </span>
                  </div>
                )
              )}

              {!imgLoaded && <div className="pc-skeleton" aria-hidden="true" />}

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
                  const target = e.currentTarget;
                  if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
                }}
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            {product.mrp && product.mrp > finalPrice && (
              <div className="pc-mrp-circle" aria-label={`MRP ₹${product.mrp}`}>
                <span className="pc-mrp-text">MRP</span>
                <span className="pc-mrp-price">
                  ₹{product.mrp.toLocaleString()}
                </span>
              </div>
            )}

            {discountPercent > 0 && (
              <div
                className="pc-discount-ribbon"
                aria-label={`${discountPercent}% discount`}
              >
                <Sparkles size={10} fill="currentColor" />
                <span>{discountPercent}% OFF</span>
              </div>
            )}
          </Link>

          <div className="pc-body">
            <div className="pc-toprow">
              <div className="pc-topleft">
                <div className="pc-min-qty">
                  <Info size={10} strokeWidth={2.5} />
                  Min: {minQty} {isBulk && !product.isBulkOnly ? "Pcs" : ""}
                </div>
              </div>

              <div className="pc-topright">
                <div className="pc-stock-status">
                  {displayCategory && (
                    <span className="pc-stock pc-stock--in">
                      {displayCategory.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link to={productUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3 className="pc-title">
                {product.name.length > 50
                  ? product.name.slice(0, 50) + "…"
                  : product.name}
              </h3>
            </Link>

            {(rating > 0 || totalReviews > 0) && (
              <div className="pc-rating-container">
                <div className="pc-rating-badge">
                  {rating > 0 ? rating.toFixed(1) : "New"}
                  <Star size={10} fill="currentColor" strokeWidth={0} />
                </div>
                <span className="pc-review-count">
                  ({totalReviews} {totalReviews === 1 ? "Review" : "Reviews"})
                </span>
              </div>
            )}

            <div className="pc-meta-chips">
              {showTagline && (
                <span className="pc-chip pc-chip--tag">
                  <Tag size={10} strokeWidth={2.5} />
                  {product.tagline}
                </span>
              )}

              <span className="pc-chip pc-chip--tag" style={{ background: "#f3e8ff", color: "#7e22ce" }}>
                <Tag size={10} strokeWidth={2.5} />
                Per piece Price
              </span>

              {isBulk ? (
                <span className="pc-chip pc-chip--box" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                  <Box size={10} strokeWidth={2.5} />
                  Per {parsedUnit} {product.piecesPerUnit} Pieces
                </span>
              ) : (
                product.packSize && (
                  <span className="pc-chip pc-chip--box">
                    <Box size={10} strokeWidth={2.5} />
                    {product.packSize}
                  </span>
                )
              )}
            </div>

            <div className="pc-price-section">
              <div className="pc-current-price">
                <span className="pc-currency">₹</span>
                <span className="pc-amount">{finalPrice.toLocaleString()}</span>
              </div>
              
              <div className="pc-total-wrapper">
                {itemCount > 0 && (
                  <div className="pc-bottom-total">
                    <span className="pc-bottom-total-label">Total:</span>
                    <span className="pc-bottom-total-val">₹{(itemCount * finalPrice).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pc-actions">
              {itemCount === 0 ? (
                <button
                  className="pc-add-to-cart"
                  onClick={handleAdd}
                  disabled={product.stock === 0}
                  aria-label={
                    product.stock === 0
                      ? "Notify me when available"
                      : "Add to cart"
                  }
                >
                  {product.stock === 0 ? (
                    <>
                      <Shield size={16} strokeWidth={2} />
                      Notify Me
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} strokeWidth={2.5} />
                      Add to Cart
                    </>
                  )}
                </button>
              ) : (
                <div className="pc-inline-qty-container">
                  <button
                    onClick={handleDec}
                    className="pc-inline-qty-btn"
                    aria-label={
                      itemCount === minQty
                        ? "Remove from cart"
                        : "Decrease quantity"
                    }
                  >
                    {itemCount === minQty ? (
                      "Del"
                    ) : (
                      <Minus size={18} strokeWidth={2.5} />
                    )}
                  </button>

                  <span className="pc-inline-qty-val" aria-label={`Quantity: ${itemCount}`}>
                    {itemCount}
                  </span>

                  <button
                    onClick={handleInc}
                    className="pc-inline-qty-btn"
                    disabled={
                      product.stock !== undefined && product.stock > 0 && itemCount + stepQty > product.stock
                    }
                    aria-label="Increase quantity"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    );
  }
);

ProductCard.displayName = "ProductCard";

export default ProductCard;