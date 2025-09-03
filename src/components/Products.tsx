// src/components/ProductCard.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProductCard.css";
import { useShop } from "../context/ShopContext";
import { API_ROOT, MEDIA_URL } from "../utils/api";

interface BulkTier {
  inner: number;
  qty: number;
  price: number;
}

interface Product {
  _id: string;
  name: string;
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
}

const resolveImageSrc = (imageFile?: string | null) => {
  if (!imageFile) return null;

  // already absolute
  if (/^https?:\/\//i.test(imageFile)) return imageFile;

  // If Cloudinary MEDIA_URL is configured and imageFile appears to be a cloud public id or path
  if (MEDIA_URL) {
    const base = MEDIA_URL.replace(/\/+$/, "");
    // If imageFile already contains '/image/upload/' (rare), just prefix MEDIA_URL anyway
    if (imageFile.includes("/image/upload/")) {
      return `${base}/${imageFile.replace(/^\/+/, "")}`;
    }
    // public_id style e.g. 'bafnatoys/abc.png' or 'folder/name.png'
    return `${base}/${imageFile.replace(/^\/+/, "")}`;
  }

  // If backend stored '/uploads/...' return API_ROOT + path
  if (imageFile.startsWith("/uploads/") || imageFile.includes("/uploads/")) {
    return `${API_ROOT.replace(/\/+$/, "")}${imageFile.startsWith("/") ? "" : "/"}${imageFile.replace(/^\/+/, "")}`;
  }

  // fallback to API uploads path
  return `${API_ROOT.replace(/\/+$/, "")}/uploads/${encodeURIComponent(imageFile)}`;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, userRole }) => {
  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();

  const cartItem = cartItems.find((item: any) => item._id === product._id);
  const innerCount = cartItem?.quantity ?? 0;

  const sortedTiers = (product.bulkPricing || []).slice().sort((a, b) => a.inner - b.inner);

  const activeTier: BulkTier | undefined =
    sortedTiers.length > 0
      ? sortedTiers.reduce((prev, tier) => (innerCount >= tier.inner ? tier : prev), sortedTiers[0])
      : undefined;

  const piecesPerInner =
    product.innerQty && product.innerQty > 0
      ? product.innerQty
      : sortedTiers.length > 0 && sortedTiers[0].qty > 0
      ? sortedTiers[0].qty / sortedTiers[0].inner
      : 1;

  const totalPieces = innerCount * piecesPerInner;
  const totalPrice = totalPieces * (activeTier ? activeTier.price : product.price);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItemQuantity(product as any, 1);
  };
  const increase = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItemQuantity(product as any, innerCount + 1);
  };
  const decrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartItemQuantity(product as any, Math.max(0, innerCount - 1));
  };

  const imageFile = product.images?.[0] ?? null;
  const imageSrc = resolveImageSrc(imageFile);

  return (
    <div className="product-card-item">
      <div className="product-image-container" onClick={() => navigate(`/product/${product._id}`)}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              // fallback to generic placeholder data URI (prevents 404 fetch to /placeholder-product.png)
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml;utf8," +
                encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#f6f7f8'/><text x='50%' y='50%' fill='#ccc' font-size='24' text-anchor='middle' dy='.3em'>No image</text></svg>`
                );
            }}
          />
        ) : (
          <div className="no-image">No Image</div>
        )}
      </div>

      <div className="product-details">
        <h3 className="product-name">{product.name}</h3>

        <div className="product-meta">
          {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
          {product.category && (
            <span className="product-category">
              {typeof product.category === "string" ? product.category : product.category?.name}
            </span>
          )}
        </div>

        {product.taxFields && product.taxFields.length > 0 && (
          <div className="product-tax-fields">
            {product.taxFields.map((tax, idx) => (
              <span key={idx} className="tax-field">
                {tax}
              </span>
            ))}
          </div>
        )}

        <div className="packing-section">
          <h4 className="packing-title">
            <span className="packing-icon">P</span> Packing & Pricing
          </h4>
          <ul className="pricing-list">
            {sortedTiers.map((tier) => (
              <li key={tier.inner} className={activeTier && tier.inner === activeTier.inner ? "active-tier-row" : ""}>
                {tier.inner} inner ({tier.qty} pcs) ₹{tier.price}/pc
              </li>
            ))}
          </ul>
        </div>

        <div className="cart-controls">
          {innerCount === 0 ? (
            <button onClick={handleAdd} className="add-to-cart-btn">
              ADD TO CART
            </button>
          ) : (
            <div className="quantity-selector-wrapper">
              <div className="quantity-selector">
                <button onClick={decrease} className="qty-btn">
                  -
                </button>
                <span className="qty-count">{innerCount}</span>
                <button onClick={increase} className="qty-btn">
                  +
                </button>
              </div>
              {userRole === "admin" && <div className="admin-total-price">Total: ₹{totalPrice.toLocaleString()}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
