import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import "../styles/About.css";

/* ── Animated Counter ─────────────────────────────────── */
const Counter = ({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const step = Math.ceil(end / (duration / 16));
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + step, end);
            setCount(current);
            if (current >= end) clearInterval(timer);
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <div ref={ref} className="ab-stat-number">{count}{suffix}</div>;
};

/* ── Main Component ───────────────────────────────────── */
const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us | Bafna Toys — Leading Toy Manufacturer in Coimbatore, India</title>
        <meta name="description" content="Learn about Bafna Toys — a trusted wholesale toy manufacturer based in Coimbatore, Tamil Nadu. We supply 300+ toys at factory-direct prices across India." />
        <link rel="canonical" href="https://bafnatoys.com/about" />
        <meta property="og:title" content="About Bafna Toys — Wholesale Toy Manufacturer India" />
        <meta property="og:description" content="Trusted toy manufacturer in Coimbatore since 2015. Supplying pullback cars, PVC dolls, windup toys at wholesale prices pan-India." />
        <meta property="og:url" content="https://bafnatoys.com/about" />
        <meta property="og:image" content="https://bafnatoys.com/logo.webp" />
      </Helmet>

      <div className="ab-page">

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="ab-hero">
          <div className="ab-hero-overlay" />
          <div className="ab-hero-content">
            <div className="ab-hero-badge">🏭 Manufacturer &amp; Wholesale Supplier</div>
            <h1 className="ab-hero-title">
              Bringing Joy to Every Child<br />
              <span className="ab-hero-accent">Across India</span>
            </h1>
            <p className="ab-hero-sub">
              Bafna Toys is one of India's trusted wholesale toy manufacturers,<br className="ab-hero-br" />
              delivering factory-direct quality from Coimbatore to retailers nationwide.
            </p>
            <div className="ab-hero-btns">
              <a href="/products" className="ab-btn-primary">Browse Products</a>
              <a href="https://wa.me/919043347300" target="_blank" rel="noopener noreferrer" className="ab-btn-outline">
                📞 WhatsApp Us
              </a>
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────── */}
        <section className="ab-stats">
          <div className="ab-container">
            <div className="ab-stats-grid">
              {[
                { end: 300, suffix: "+", label: "Products in Catalogue" },
                { end: 9,   suffix: "+", label: "Years of Experience" },
                { end: 1000,suffix: "+", label: "Retailers Served" },
                { end: 28,  suffix: "",  label: "States We Deliver To" },
              ].map((s) => (
                <div className="ab-stat-card" key={s.label}>
                  <Counter end={s.end} suffix={s.suffix} />
                  <div className="ab-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── OUR STORY ────────────────────────────────────── */}
        <section className="ab-section ab-story">
          <div className="ab-container ab-story-grid">
            <div className="ab-story-img-wrap">
              <div className="ab-story-img-box">
                <img src="/logo.webp" alt="Bafna Toys Coimbatore" className="ab-story-logo" />
                <div className="ab-story-location-badge">
                  📍 Coimbatore, Tamil Nadu
                </div>
              </div>
            </div>
            <div className="ab-story-text">
              <div className="ab-section-tag">Our Story</div>
              <h2 className="ab-section-title">From Coimbatore to Every Corner of India</h2>
              <p>
                Bafna Toys started with a simple belief — every child deserves quality toys, and
                every retailer deserves honest, factory-direct pricing. Founded in Coimbatore's
                bustling trading district, we have grown from a small local supplier to a trusted
                name among toy retailers and distributors across India.
              </p>
              <p>
                With GST registration since November 2021 and over 9 years of market presence,
                we combine traditional business values — trust, quality, and timely delivery —
                with a modern B2B wholesale platform that lets you order anytime, anywhere.
              </p>
              <div className="ab-story-tags">
                <span className="ab-tag">✅ GST Registered</span>
                <span className="ab-tag">✅ Verified Manufacturer</span>
                <span className="ab-tag">✅ Pan-India Delivery</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHY CHOOSE US ────────────────────────────────── */}
        <section className="ab-section ab-why">
          <div className="ab-container">
            <div className="ab-section-tag" style={{ textAlign: "center" }}>Why Choose Us</div>
            <h2 className="ab-section-title" style={{ textAlign: "center" }}>The Bafna Toys Difference</h2>
            <div className="ab-why-grid">
              {[
                {
                  icon: "🏭",
                  title: "Direct from Factory",
                  desc: "No middlemen. Buy directly from the manufacturer and get the best wholesale price every time.",
                },
                {
                  icon: "🧸",
                  title: "300+ Unique Products",
                  desc: "Pullback cars, PVC dolls, windup toys, board games, squeezy toys and much more — all under one roof.",
                },
                {
                  icon: "🚚",
                  title: "Fast Pan-India Delivery",
                  desc: "We deliver to all 28 states. Orders dispatched within 24-48 hours via trusted courier partners.",
                },
                {
                  icon: "💳",
                  title: "Flexible Payment",
                  desc: "Pay online or choose Cash on Delivery with advance. We make ordering easy for every retailer.",
                },
                {
                  icon: "🛡️",
                  title: "Quality Assured",
                  desc: "All toys are made from child-safe, BIS-compliant materials. Your customers' safety is our priority.",
                },
                {
                  icon: "📦",
                  title: "Bulk Order Friendly",
                  desc: "Special pricing for bulk orders. The more you buy, the better the rate — perfect for distributors.",
                },
              ].map((item) => (
                <div className="ab-why-card" key={item.title}>
                  <div className="ab-why-icon">{item.icon}</div>
                  <h3 className="ab-why-title">{item.title}</h3>
                  <p className="ab-why-desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRODUCT CATEGORIES ───────────────────────────── */}
        <section className="ab-section ab-cats">
          <div className="ab-container">
            <div className="ab-section-tag" style={{ textAlign: "center" }}>What We Make</div>
            <h2 className="ab-section-title" style={{ textAlign: "center" }}>Our Product Categories</h2>
            <div className="ab-cats-grid">
              {[
                { icon: "🚗", name: "Pullback Cars & Vehicles", desc: "Die-cast & plastic pullback series" },
                { icon: "🪆", name: "PVC Dolls & Figures",     desc: "Soft PVC, non-toxic, BIS safe" },
                { icon: "🔑", name: "Windup Key Toys",          desc: "Classic & modern wind-up designs" },
                { icon: "🎲", name: "Board Games & Puzzles",    desc: "Educational & family fun games" },
                { icon: "🍼", name: "Baby Rattles & Teethers",  desc: "Safe, colourful infant toys" },
                { icon: "🦆", name: "Squeezy & Bath Toys",      desc: "Soft squeezy animal toys" },
                { icon: "✏️", name: "Educational Toys",         desc: "Learning through play" },
                { icon: "🏍️", name: "Bikes & Motorcycles",     desc: "Friction & pullback series" },
              ].map((cat) => (
                <a href="/products" className="ab-cat-card" key={cat.name}>
                  <div className="ab-cat-icon">{cat.icon}</div>
                  <div className="ab-cat-name">{cat.name}</div>
                  <div className="ab-cat-desc">{cat.desc}</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPANY INFO ─────────────────────────────────── */}
        <section className="ab-section ab-info">
          <div className="ab-container">
            <div className="ab-section-tag" style={{ textAlign: "center" }}>Company Details</div>
            <h2 className="ab-section-title" style={{ textAlign: "center" }}>Business Information</h2>
            <div className="ab-info-grid">
              {[
                { label: "Company Name",       value: "Bafna Toys" },
                { label: "Nature of Business", value: "Manufacturer & Wholesale Supplier" },
                { label: "Legal Status",       value: "Proprietorship" },
                { label: "GST Number",         value: "33**********1ZT (Verified)" },
                { label: "GST Since",          value: "November 2021" },
                { label: "Location",           value: "Coimbatore, Tamil Nadu — 641007" },
                { label: "Phone / WhatsApp",   value: "+91 90433 47300" },
                { label: "Delivery",           value: "Pan-India (All 28 States)" },
              ].map((row) => (
                <div className="ab-info-row" key={row.label}>
                  <span className="ab-info-label">{row.label}</span>
                  <span className="ab-info-value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="ab-cta">
          <div className="ab-container">
            <h2 className="ab-cta-title">Ready to Stock Up Your Store?</h2>
            <p className="ab-cta-sub">Browse our 300+ product catalogue and place your wholesale order today.</p>
            <div className="ab-cta-btns">
              <a href="/products" className="ab-btn-primary ab-btn-lg">🛍️ Shop Now</a>
              <a href="https://wa.me/919043347300?text=Hi%20Bafna%20Toys%2C%20I%20want%20to%20know%20more%20about%20wholesale%20orders."
                target="_blank" rel="noopener noreferrer" className="ab-btn-wha ab-btn-lg">
                💬 WhatsApp Order
              </a>
            </div>
            <div className="ab-cta-address">
              📍 1-12, Sundapalayam Rd, Kalikkanaicken Palayam, Coimbatore — 641007, Tamil Nadu
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default About;
