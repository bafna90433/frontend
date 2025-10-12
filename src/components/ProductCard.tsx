// src/components/ProductCard.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProductCard.css";
import { useShop } from "../context/ShopContext";

interface BulkTier {
  inner: number;
  qty: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  slug?: string;
  sku?: string;
  images?: string[];
  price: number;
  innerQty?: number;
  bulkPricing: BulkTier[];
  category?: { _id: string; name: string } | string;
  taxFields?: string[];
}

interface ProductCardProps {
  product: Product;
  userRole: "admin" | "customer";
  index?: number;
}

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8080";
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const getOptimizedImageUrl = (url: string, width = 400) => {
  if (!url) return "";

  if (url.includes("res.cloudinary.com")) {
    return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
  }

  if (url.startsWith("http")) return url;
  if (url.includes("/uploads/")) return `${API_BASE}${url}`;

  return `${IMAGE_BASE_URL}/uploads/${encodeURIComponent(url)}`;
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  userRole,
  index = 0,
}) => {
  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved;

  const cartItem = cartItems.find((item) => item._id === product._id);
  const innerCount = cartItem?.quantity ?? 0;

  const sortedTiers = [...product.bulkPricing].sort((a, b) => a.inner - b.inner);
  const activeTier: BulkTier | undefined = sortedTiers.length > 0
    ? sortedTiers.reduce(
        (prev, tier) => (innerCount >= tier.inner ? tier : prev),
        sortedTiers[0]
      )
    : undefined;

  const piecesPerInner = product.innerQty && product.innerQty > 0
    ? product.innerQty
    : sortedTiers.length > 0 && sortedTiers[0].qty > 0
    ? sortedTiers[0].qty / sortedTiers[0].inner
    : 1;

  const totalPieces = innerCount * piecesPerInner;
  const totalPrice = totalPieces * (activeTier ? activeTier.price : product.price);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItemQuantity(product, 1);
  };

  const increase = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItemQuantity(product, innerCount + 1);
  };

  const decrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItemQuantity(product, Math.max(0, innerCount - 1));
  };

  const imageFile = product.images?.[0] ?? null;
  const imageSrc = imageFile && !imageError ? getOptimizedImageUrl(imageFile, 400) : null;

  const handleNavigate = () => {
    const path = product.slug ? `/product/${product.slug}` : `/product/${product._id}`;
    navigate(path);
  };

  const handleImageError = () => {
    setImageError(true);
    setImgLoaded(true);
  };

  return (
    <div className="product-card">
      {/* Image Section */}
      <div className="product-card__image-container" onClick={handleNavigate}>
        {imageSrc ? (
          <>
            {!imgLoaded && (
              <div className="product-card__skeleton" />
            )}
            <img
              src={imageSrc}
              alt={product.name}
              className={`product-card__image ${imgLoaded ? "product-card__image--loaded" : ""}`}
              width="400"
              height="400"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className="product-card__no-image">
            <span className="product-card__no-image-icon">📷</span>
            No Image Available
          </div>
        )}
        
        {/* Quick Action Overlay */}
        <div className="product-card__overlay">
          <button className="product-card__quick-view" onClick={handleNavigate}>
            Quick View
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="product-card__content">
        <div className="product-card__header" onClick={handleNavigate}>
          <h3 className="product-card__title">{product.name}</h3>
          
          <div className="product-card__meta">
            {product.sku && (
              <span className="product-card__sku">SKU: {product.sku}</span>
            )}
            {product.category && (
              <span className="product-card__category">
                {typeof product.category === "string" 
                  ? product.category 
                  : product.category?.name}
              </span>
            )}
          </div>

          {product.taxFields && product.taxFields.length > 0 && (
            <div className="product-card__tax-badges">
              {product.taxFields.map((tax, idx) => (
                <span key={idx} className="product-card__tax-badge">
                  {tax}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Bulk Information */}
        {isApproved ? (
          <div className="product-card__pricing">
            <div className="product-card__pricing-header">
              <span className="product-card__pricing-icon">📦</span>
              <span>Bulk Pricing</span>
            </div>
            
            <div className="product-card__tiers">
              {sortedTiers.map((tier) => (
                <div
                  key={tier.inner}
                  className={`product-card__tier ${
                    activeTier && tier.inner === activeTier.inner 
                      ? "product-card__tier--active" 
                      : ""
                  }`}
                >
                  <span className="product-card__tier-info">
                    {tier.inner} inner ({tier.qty} pcs)
                  </span>
                  <span className="product-card__tier-price">
                    ₹{tier.price}/pc
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="product-card__approval-message">
            <span className="product-card__lock-icon">🔒</span>
            Prices visible after admin approval
          </div>
        )}

        {/* Cart Controls */}
        <div className="product-card__actions">
          {innerCount === 0 ? (
            <button 
              onClick={handleAdd} 
              className="product-card__add-btn"
              disabled={!isApproved}
            >
              ADD TO CART
            </button>
          ) : (
            <div className="product-card__quantity-controls">
              <div className="product-card__quantity-selector">
                <button 
                  onClick={decrease} 
                  className="product-card__quantity-btn"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="product-card__quantity-count">
                  {innerCount}
                </span>
                <button 
                  onClick={increase} 
                  className="product-card__quantity-btn"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              {userRole === "admin" && isApproved && (
                <div className="product-card__total-price">
                  Total: ₹{totalPrice.toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;   