import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import { ShoppingCart, Plus, Minus, Shield, Zap, CheckCircle } from "lucide-react";
import "../styles/HotdealProductCard.css";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  images?: string[];
  price: number;
  mrp?: number;
  stock?: number;
}

const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_BASE_URL || "http://localhost:5000";

const getOptimizedImageUrl = (url: string, width = 520) => {
  if (!url) return "";
  if (url.includes("res.cloudinary.com"))
    return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
  if (url.startsWith("http")) return url;
  return `${IMAGE_BASE_URL}/uploads/${encodeURIComponent(url)}`;
};

const TrendingProductCard: React.FC<{ product?: Product }> = ({ product }) => {
  if (!product) return null;

  const { cartItems, setCartItemQuantity } = useShop();
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);

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

  const out = product.stock === 0;
  const low = product.stock !== undefined && product.stock > 0 && product.stock <= 10;

  const offPct =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div className="kid-card" onClick={handleNavigate} role="button" tabIndex={0}>
      {/* Sticker Row */}
      <div className="kid-stickers">
        <span className={`kid-pill ${out ? "danger" : low ? "warn" : "ok"}`}>
          {out ? (
            <>
              <Shield size={14} /> Out
            </>
          ) : low ? (
            <>
              <Zap size={14} /> {product.stock} left
            </>
          ) : (
            <>
              <CheckCircle size={14} /> In stock
            </>
          )}
        </span>

        {offPct > 0 ? <span className="kid-pill off">{offPct}% OFF</span> : <span />}
      </div>

      {/* Image Bubble */}
      <div className="kid-imgWrap">
        <div className="kid-confetti" aria-hidden="true" />
        {!imgLoaded && <div className="kid-img-skel" />}
        <img
          src={getOptimizedImageUrl(product.images?.[0] || "", 520)}
          alt={product.name}
          className={`kid-img ${imgLoaded ? "loaded" : ""}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {/* Title */}
      <div className="kid-title" title={product.name}>
        {product.name}
      </div>

      {/* Price */}
      <div className="kid-priceRow">
        <div className="kid-price">₹{product.price.toLocaleString()}</div>
        {product.mrp && product.mrp > product.price ? (
          <div className="kid-mrp">₹{product.mrp.toLocaleString()}</div>
        ) : (
          <div className="kid-mrp kid-mrp--empty"> </div>
        )}
      </div>

      {/* Mini info */}
      <div className="kid-miniRow">
        <span className="kid-min">Min: {minQty}</span>
        {itemCount > 0 ? (
          <span className="kid-total">
            Total: ₹{(itemCount * product.price).toLocaleString()}
          </span>
        ) : (
          <span className="kid-quick">Quick add</span>
        )}
      </div>

      {/* Bottom Action */}
      <div className="kid-action" onClick={(e) => e.stopPropagation()}>
        {itemCount === 0 ? (
          <button className="kid-addBtn" type="button" onClick={actions.add} disabled={out}>
            {out ? (
              <>
                <Shield size={18} /> Notify
              </>
            ) : (
              <>
                <ShoppingCart size={18} /> Add {minQty}
              </>
            )}
          </button>
        ) : (
          <div className="kid-qty">
            <button className="kid-qbtn" type="button" onClick={actions.dec}>
              {itemCount === minQty ? "Del" : <Minus size={18} strokeWidth={3} />}
            </button>

            <div className="kid-qval">{itemCount}</div>

            <button
              className="kid-qbtn"
              type="button"
              onClick={actions.inc}
              disabled={product.stock !== undefined && itemCount >= product.stock}
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingProductCard;
