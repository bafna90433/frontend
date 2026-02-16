import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiArrowRight } from "react-icons/fi";
import { useShop } from "../context/ShopContext";
import "../styles/HomeTriplePromoSection.css";

type Product = {
  _id: string;
  name: string;
  price: number;
  mrp?: number;
  images?: string[];
  image?: string;
  slug?: string;
  sale_end_time?: string;
};

type PromoCfg = {
  sideBanners?: { image: string; link: string }[];
  bestSellingProducts?: Product[];
  onSaleProducts?: Product[];
  bestSellingProductIds?: string[];
  onSaleProductIds?: string[];
};

type HomeCfg = {
  bannerImage?: string;
  bannerLink?: string;
  promo?: PromoCfg;
};

const getImg = (p: Product) => p?.images?.[0] || p?.image || "";
const toSlugLink = (p: Product) => (p.slug ? `/product/${p.slug}` : `/product/${p._id}`);

const HomeTriplePromoSection: React.FC<{ allProducts: Product[]; cfg: HomeCfg }> = ({ allProducts, cfg }) => {
  const { addToCart } = useShop() as any;

  const sideBanners = useMemo(() => {
    const sb = Array.isArray(cfg?.promo?.sideBanners) ? cfg.promo!.sideBanners!.slice(0, 2) : [];
    // fallback: old bannerImage if promo empty
    if (sb.length === 0 && cfg.bannerImage) {
      return [
        { image: cfg.bannerImage, link: cfg.bannerLink || "" },
        { image: "", link: "" },
      ];
    }
    while (sb.length < 2) sb.push({ image: "", link: "" });
    return sb;
  }, [cfg]);

  const bestSelling = useMemo(() => {
    // 1) backend resolved objects (best)
    if (cfg?.promo?.bestSellingProducts?.length) return cfg.promo.bestSellingProducts.slice(0, 4);

    // 2) fallback ids -> map from allProducts
    const ids = Array.isArray(cfg?.promo?.bestSellingProductIds) ? cfg.promo.bestSellingProductIds : [];
    if (ids.length) {
      const map = new Map(allProducts.map((p) => [String(p._id), p]));
      return ids.map((id) => map.get(String(id))).filter(Boolean).slice(0, 4) as Product[];
    }

    return allProducts.slice(0, 4);
  }, [cfg, allProducts]);

  const onSale = useMemo(() => {
    // 1) backend resolved objects (best)
    if (cfg?.promo?.onSaleProducts?.length) return cfg.promo.onSaleProducts.slice(0, 4);

    // 2) fallback ids -> map
    const ids = Array.isArray(cfg?.promo?.onSaleProductIds) ? cfg.promo.onSaleProductIds : [];
    if (ids.length) {
      const map = new Map(allProducts.map((p) => [String(p._id), p]));
      return ids.map((id) => map.get(String(id))).filter(Boolean).slice(0, 4) as Product[];
    }

    // 3) auto detect sale
    const sale = allProducts.filter((p) => (p.mrp && p.mrp > p.price) || (p as any).sale_end_time).slice(0, 4);
    if (sale.length) return sale;

    return allProducts.slice(4, 8);
  }, [cfg, allProducts]);

  const renderRow = (p: Product, cta: string = "Add to Cart") => {
    const img = getImg(p);
    const hasMrp = !!p.mrp && p.mrp > p.price;

    return (
      <div key={p._id} className="htps-row">
        <Link to={toSlugLink(p)} className="htps-thumb">
          {img ? <img src={img} alt={p.name} loading="lazy" /> : <div className="htps-thumb-ph" />}
        </Link>

        <div className="htps-info">
          <Link to={toSlugLink(p)} className="htps-name">
            {p.name}
          </Link>

          <div className="htps-price">
            <span className="htps-price-now">₹{p.price}</span>
            {hasMrp && <span className="htps-price-mrp">₹{p.mrp}</span>}
          </div>
        </div>

        <div className="htps-actions">
          <button className="htps-wish" type="button" title="Wishlist" onClick={() => alert("Wishlist connect karna ho to batao")}>
            <FiHeart />
          </button>

          <button
            className="htps-cart"
            type="button"
            onClick={() => {
              if (typeof addToCart === "function") addToCart(p, 1);
              else alert("addToCart function missing in ShopContext");
            }}
          >
            {cta}
          </button>
        </div>
      </div>
    );
  };

  const renderBanner = (b: { image: string; link: string }, idx: number) => {
    const content = b.image ? <img src={b.image} alt={`Promo ${idx + 1}`} /> : <div className="htps-banner-ph">316×351</div>;
    if (b.link) return <a className="htps-banner" href={b.link}>{content}</a>;
    return <div className="htps-banner">{content}</div>;
  };

  return (
    <section className="htps">
      <div className="htps-grid">
        <div className="htps-left">
          {renderBanner(sideBanners[0], 0)}
          {renderBanner(sideBanners[1], 1)}
        </div>

        <div className="htps-card">
          <div className="htps-head">
            <h3>Best Selling Product</h3>
            <Link to="/products" className="htps-explore">
              Explore all <FiArrowRight />
            </Link>
          </div>
          <div className="htps-list">{bestSelling.map((p) => renderRow(p, "Add To Cart"))}</div>
        </div>

        <div className="htps-card">
          <div className="htps-head">
            <h3>On Sale Product</h3>
            <Link to="/products" className="htps-explore">
              Explore all <FiArrowRight />
            </Link>
          </div>
          <div className="htps-list">{onSale.map((p) => renderRow(p, "Add To Cart"))}</div>
        </div>
      </div>
    </section>
  );
};

export default HomeTriplePromoSection;
