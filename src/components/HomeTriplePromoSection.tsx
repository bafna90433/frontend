import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FiHeart } from "react-icons/fi";
import "../styles/HomePromoSection.css";

type Product = {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images?: string[];
  image?: string;
  slug?: string;
  rating?: number;
  ratingCount?: number;
};

type PromoBanner = { image: string; link?: string };

type Props = {
  sideBanners: PromoBanner[];
  bestSelling: Product[];
  onSale: Product[];
};

const getImg = (p: Product) => p?.images?.[0] || p?.image || "";
const toLink = (p: Product) => (p.slug ? `/product/${p.slug}` : `/product/${p._id}`);

const optimizeCloudinary = (url: string, w: number, h: number) => {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  const TRANSFORM = `f_auto,q_auto,w_${w},h_${h},c_fill,g_auto`;
  return url.replace("/image/upload/", `/image/upload/${TRANSFORM}/`);
};

const RatingStars: React.FC<{ value?: number }> = ({ value = 5 }) => {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.round(v);
  return (
    <div className="hp-stars" aria-label={`Rating ${v}`}>
      {"★★★★★".split("").map((_, i) => (
        <span key={i} className={i < full ? "on" : ""}>
          ★
        </span>
      ))}
    </div>
  );
};

const Row: React.FC<{ p: Product; cta?: string }> = ({ p, cta = "Add To Cart" }) => {
  const rawImg = getImg(p);
  const img = optimizeCloudinary(rawImg, 160, 120);
  const hasMrp = !!p.mrp && p.mrp > p.price;

  return (
    <div className="hp-row">
      <Link to={toLink(p)} className="hp-thumb">
        {img ? <img src={img} alt={p.name} loading="lazy" /> : <div className="hp-thumb-ph" />}
      </Link>

      <div className="hp-mid">
        <div className="hp-rating">
          <RatingStars value={p.rating ?? 5} />
          <span className="hp-rating-count">({p.ratingCount ?? 5.0})</span>
        </div>

        <Link to={toLink(p)} className="hp-name">
          {p.name}
        </Link>

        <div className="hp-price">
          <span className="hp-price-now">₹{p.price}</span>
          {hasMrp && <span className="hp-price-mrp">₹{p.mrp}</span>}
        </div>
      </div>

      <div className="hp-right">
        <button className="hp-wish" type="button" title="Wishlist">
          <FiHeart />
        </button>

        <button className="hp-cart" type="button">
          {cta}
        </button>
      </div>
    </div>
  );
};

const HomePromoSection: React.FC<Props> = ({ sideBanners, bestSelling, onSale }) => {
  const sb = useMemo(() => {
    const arr = Array.isArray(sideBanners) ? sideBanners.slice(0, 2) : [];
    while (arr.length < 2) arr.push({ image: "", link: "" });
    return arr;
  }, [sideBanners]);

  const renderBanner = (b: PromoBanner, idx: number) => {
    const img = optimizeCloudinary(b.image, 400, 520);
    const content = b.image ? (
      <img src={img} className="hp-banner-img" alt={`Promo ${idx + 1}`} loading="lazy" />
    ) : (
      <div className="hp-banner-ph">316×351</div>
    );

    // link optional (internal)
    return b.link ? (
      <Link to={b.link} className="hp-banner" key={idx}>
        {content}
      </Link>
    ) : (
      <div className="hp-banner" key={idx}>
        {content}
      </div>
    );
  };

  return (
    <section className="hp-wrap">
      <div className="hp-grid">
        <div className="hp-banners">
          {renderBanner(sb[0], 0)}
          {renderBanner(sb[1], 1)}
        </div>

        <div className="hp-card">
          <div className="hp-card-head">
            <h3>Best Selling Product</h3>
            <Link to="/products" className="hp-explore">
              Explore all →
            </Link>
          </div>
          <div className="hp-list">
            {bestSelling.slice(0, 4).map((p) => (
              <Row key={p._id} p={p} cta="Add To Cart" />
            ))}
          </div>
        </div>

        <div className="hp-card">
          <div className="hp-card-head">
            <h3>On Sale Product</h3>
            <Link to="/products" className="hp-explore">
              Explore all →
            </Link>
          </div>
          <div className="hp-list">
            {onSale.slice(0, 4).map((p) => (
              <Row key={p._id} p={p} cta="Add To Cart" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePromoSection;
