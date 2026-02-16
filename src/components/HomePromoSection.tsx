import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import {
  Plus,
  Minus,
  Info,
  Heart,
  ArrowRight,
  Tag,
  Package,
  Clock,
  Zap,
} from "lucide-react";
import "../styles/HomePromoSection.css";

interface Product {
  _id: string;
  name: string;
  slug?: string;
  images?: string[];
  image?: string;
  price: number;
  mrp?: number;
  tagline?: string;
  packSize?: string;
  stock?: number;
  sale_end_time?: string;
}

type Props = {
  sideBanners: { image: string; link?: string }[];
  bestSelling: Product[];
  onSale: Product[];
};

const Row: React.FC<{ p: Product }> = ({ p }) => {
  const navigate = useNavigate();
  const { cartItems, setCartItemQuantity } = useShop();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const cartItem = cartItems.find((item) => item._id === p._id);
  const itemCount = cartItem?.quantity ?? 0;
  const minQty = useMemo(() => (p.price < 60 ? 3 : 2), [p.price]);

  useEffect(() => {
    if (!p.sale_end_time) return;

    const calculate = () => {
      const diff = new Date(p.sale_end_time!).getTime() - Date.now();
      if (diff <= 0) return null;
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      return `${d > 0 ? d + "D " : ""}${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    setTimeLeft(calculate());
    const interval = setInterval(() => {
      const t = calculate();
      setTimeLeft(t);
      if (!t) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [p.sale_end_time]);

  const discountPercent = useMemo(() => {
    if (!p.mrp || p.mrp <= p.price) return 0;
    return Math.round(((p.mrp - p.price) / p.mrp) * 100);
  }, [p.mrp, p.price]);

  const productLink = p.slug ? `/product/${p.slug}` : `/product/${p._id}`;

  return (
    <div
      className="hp-row"
      onClick={() => navigate(productLink)}
      role="button"
      tabIndex={0}
    >
      <div className="hp-thumb-container">
        <div className="hp-thumb">
          <img
            src={p.images?.[0] || p.image || "/images/placeholder.webp"}
            alt={p.name}
            loading="lazy"
          />
        </div>

        {discountPercent > 0 && (
          <div className="hp-discount-tag">
            <Zap size={10} fill="currentColor" /> {discountPercent}% OFF
          </div>
        )}

        <button
          className="hp-wish-overlay"
          onClick={(e) => e.stopPropagation()}
          aria-label="wishlist"
        >
          <Heart size={15} />
        </button>
      </div>

      <div className="hp-mid">
        <div className="hp-top-meta">
          {timeLeft && (
            <div className="hp-row-timer">
              <Clock size={10} /> <span>{timeLeft}</span>
            </div>
          )}
          <span className="hp-min-tag">
            <Info size={10} /> Min: {minQty}
          </span>
        </div>

        <Link
          to={productLink}
          className="hp-name"
          onClick={(e) => e.stopPropagation()}
        >
          {p.name}
        </Link>

        <div className="hp-meta-badges">
          <span className="hp-badge hp-badge--yellow">
            <Tag size={10} /> Per Packet Price
          </span>
          {p.packSize && (
            <span className="hp-badge hp-badge--blue">
              <Package size={10} /> {p.packSize}
            </span>
          )}
        </div>

        <div className="hp-price">
          <span className="hp-price-now">₹{p.price.toLocaleString()}</span>
          {p.mrp && p.mrp > p.price && (
            <span className="hp-price-mrp">₹{p.mrp.toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="hp-right" onClick={(e) => e.stopPropagation()}>
        {itemCount === 0 ? (
          <button
            className="hp-cart-btn"
            onClick={() => setCartItemQuantity(p, minQty)}
            disabled={p.stock === 0}
          >
            {p.stock === 0 ? "Out" : "Add"}
          </button>
        ) : (
          <div className="hp-qty-wrapper">
            <div className="hp-total-label">
              ₹{(itemCount * p.price).toLocaleString()}
            </div>

            <div className="hp-qty-controls">
              <button
                onClick={() =>
                  setCartItemQuantity(p, itemCount <= minQty ? 0 : itemCount - 1)
                }
                className="qty-btn del"
              >
                {itemCount === minQty ? "Del" : <Minus size={14} />}
              </button>

              <span className="qty-num">{itemCount}</span>

              <button
                onClick={() => setCartItemQuantity(p, itemCount + 1)}
                className="qty-btn add"
                disabled={itemCount >= (p.stock || 99)}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HomePromoSection: React.FC<Props> = ({ sideBanners, bestSelling, onSale }) => {
  return (
    <section className="hp-container">
      <div className="hp-inner">
        <div className="hp-banners-col">
          {sideBanners.slice(0, 2).map((b, i) => (
            <Link key={i} to={b.link || "#"} className="hp-promo-card">
              <img src={b.image} alt="Banner" />
            </Link>
          ))}
        </div>

        <div className="hp-list-card">
          <div className="hp-card-header">
            <h3>Best Selling Product</h3>
            <Link to="/shop" className="hp-explore-btn">
              Explore all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="hp-list-content">
            {bestSelling.slice(0, 4).map((p) => (
              <Row key={p._id} p={p} />
            ))}
          </div>
        </div>

        <div className="hp-list-card">
          <div className="hp-card-header">
            <h3>On Sale Product</h3>
            <Link to="/shop" className="hp-explore-btn">
              Explore all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="hp-list-content">
            {onSale.slice(0, 4).map((p) => (
              <Row key={p._id} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePromoSection;
