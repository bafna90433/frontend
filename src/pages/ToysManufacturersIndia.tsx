import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const FAQ_DATA = [
  {
    q: "Is Bafna Toys a manufacturer or a trader?",
    a: "Bafna Toys is a direct toy manufacturer based in Coimbatore, Tamil Nadu. We own our manufacturing unit and do not source from third-party traders. This lets us offer factory-direct wholesale prices to retailers across India."
  },
  {
    q: "What types of toys does Bafna Toys manufacture?",
    a: "We manufacture PVC dolls, pullback friction cars, windup key toys, rattle sets, soft toys, and kids' educational toys. All products are BIS certified and made from non-toxic, food-grade materials."
  },
  {
    q: "What is the minimum order quantity (MOQ)?",
    a: "We have a very low MOQ designed for small retailers and toy shops. You can order as low as 1 inner box (typically 6–12 pieces). Bulk orders get additional factory-price discounts."
  },
  {
    q: "Do you deliver across India?",
    a: "Yes. We ship PAN India via Delhivery, DTDC, and other logistics partners. Orders are dispatched within 24–48 hours. Most cities in South India receive delivery within 2–3 days."
  },
  {
    q: "Are Bafna Toys products BIS certified?",
    a: "Yes. All our toys comply with Bureau of Indian Standards (BIS) IS 9873 safety regulations. We use non-toxic pigments, phthalate-free PVC, and pass rigorous drop and tension tests before shipment."
  },
  {
    q: "How can I register as a wholesale buyer?",
    a: "Click on 'Register as Retailer' on our website. Fill in your shop name, GST number, and contact details. Once approved, you get instant access to our wholesale catalog and factory pricing."
  },
  {
    q: "Do you offer custom packaging or private label?",
    a: "Yes, for bulk orders we can provide custom box packaging with your brand name or retailer label. Contact us via WhatsApp or the website for custom branding inquiries."
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept UPI, NEFT/RTGS, debit/credit cards via Razorpay, and Cash on Delivery (COD) for eligible orders. GST invoice is provided for every order."
  }
];

const SCHEMA_ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Bafna Toys",
  "url": "https://bafnatoys.com",
  "logo": "https://bafnatoys.com/logo.webp",
  "description": "Bafna Toys is a leading toy manufacturer and wholesale supplier in Coimbatore, Tamil Nadu, India. We manufacture BIS-certified PVC dolls, pullback cars, windup toys and kids toys.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Kalikkanaicken Palayam",
    "addressLocality": "Coimbatore",
    "addressRegion": "Tamil Nadu",
    "postalCode": "641019",
    "addressCountry": "IN"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "availableLanguage": ["English", "Hindi", "Tamil"]
  },
  "sameAs": [
    "https://www.facebook.com/bafnatoys",
    "https://www.instagram.com/bafnatoys"
  ]
};

const SCHEMA_LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Bafna Toys",
  "image": "https://bafnatoys.com/logo.webp",
  "url": "https://bafnatoys.com",
  "telephone": "+91-9999999999",
  "priceRange": "₹₹",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Kalikkanaicken Palayam",
    "addressLocality": "Coimbatore",
    "addressRegion": "Tamil Nadu",
    "postalCode": "641019",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 11.0168,
    "longitude": 76.9558
  },
  "openingHours": "Mo-Sa 09:00-18:00",
  "description": "Bafna Toys – Toy manufacturer and wholesale supplier in Coimbatore. Buy PVC dolls, pullback cars, windup toys, and kids toys in bulk at factory prices with PAN India delivery."
};

const SCHEMA_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_DATA.map(item => ({
    "@type": "Question",
    "name": item.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.a
    }
  }))
};

const ToysManufacturersIndia: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Helmet>
        <title>Toys Manufacturers in India | Bafna Toys Wholesale Supplier – Coimbatore</title>
        <meta
          name="description"
          content="Bafna Toys is a trusted toy manufacturer and wholesale supplier in Coimbatore, Tamil Nadu. Buy PVC dolls, pullback cars, windup toys and kids toys in bulk with PAN India delivery."
        />
        <meta name="keywords" content="toys manufacturers in India, toy manufacturer in India, wholesale toys India, bulk toys supplier India, toys for retail shops, PVC dolls manufacturer, pullback cars wholesale, windup toys supplier, factory price toys wholesale, toy supplier for retailers" />
        <link rel="canonical" href="https://bafnatoys.com/toys-manufacturers-in-india" />
        <meta property="og:title" content="Toys Manufacturers in India | Bafna Toys Wholesale Supplier" />
        <meta property="og:description" content="Bafna Toys – Direct toy manufacturer in Coimbatore. BIS certified PVC dolls, pullback cars, windup toys at factory wholesale prices. PAN India delivery." />
        <meta property="og:url" content="https://bafnatoys.com/toys-manufacturers-in-india" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://bafnatoys.com/logo.webp" />
        <script type="application/ld+json">{JSON.stringify(SCHEMA_ORGANIZATION)}</script>
        <script type="application/ld+json">{JSON.stringify(SCHEMA_LOCAL_BUSINESS)}</script>
        <script type="application/ld+json">{JSON.stringify(SCHEMA_FAQ)}</script>
      </Helmet>

      <div style={{ background: "#f8fafc", color: "#1e293b", fontFamily: "'Baloo 2', sans-serif" }}>

        {/* ── HERO ── */}
        <section style={{
          background: "linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%)",
          padding: "72px 20px 100px",
          textAlign: "center",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 820, margin: "0 auto", position: "relative" }}>
            <span style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "5px 16px", fontSize: "0.82rem", fontWeight: 600, marginBottom: 18, backdropFilter: "blur(4px)" }}>
              🏭 BIS Certified · Factory Direct · PAN India
            </span>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 18px", letterSpacing: "-0.5px" }}>
              Toys Manufacturers in India<br />
              <span style={{ color: "#fef08a" }}>– Bafna Toys, Coimbatore</span>
            </h1>
            <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.18rem)", lineHeight: 1.65, color: "#d1fae5", maxWidth: 700, margin: "0 auto 32px" }}>
              Bafna Toys is a trusted <strong style={{ color: "#fff" }}>toy manufacturer and wholesale toy supplier</strong> in India. We manufacture and supply PVC dolls, pullback cars, windup toys, key toys and kids toys for retailers, toy shops, supermarkets and resellers across India — at direct factory prices.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/register" style={{ background: "#fff", color: "#065f46", padding: "12px 28px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: "1rem", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                Register as Retailer →
              </Link>
              <Link to="/" style={{ background: "transparent", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: "1rem", border: "2px solid rgba(255,255,255,0.5)" }}>
                Browse Wholesale Catalog
              </Link>
            </div>
          </div>
        </section>

        {/* ── TRUST BADGES ── */}
        <div style={{ maxWidth: 1100, margin: "-48px auto 0", padding: "0 20px", position: "relative", zIndex: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {[
            { emoji: "🏭", title: "Factory Direct", text: "Coimbatore manufacturing unit — no middlemen" },
            { emoji: "✅", title: "BIS Certified", text: "IS 9873 compliant. 100% safe for children" },
            { emoji: "📦", title: "Low MOQ", text: "Order from 1 inner box — ideal for small retailers" },
            { emoji: "🚚", title: "PAN India Delivery", text: "Delhivery & DTDC — 24–48 hr dispatch" },
          ].map((b, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "22px 18px", boxShadow: "0 8px 24px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>{b.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a", marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.45 }}>{b.text}</div>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT ── */}
        <section style={{ maxWidth: 1100, margin: "60px auto", padding: "0 20px", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 40 }}>

          {/* Left */}
          <div>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
              About Bafna Toys – Toy Manufacturing in India
            </h2>
            <p style={pStyle}>
              Bafna Toys is one of India's leading <strong>toys manufacturers in India</strong>, headquartered in Coimbatore, Tamil Nadu. With years of hands-on manufacturing experience, we produce a wide range of children's toys including PVC dolls, pullback friction cars, windup key toys, rattle sets, and educational toys — all at <strong>factory price wholesale</strong> rates.
            </p>
            <p style={pStyle}>
              Unlike distributors and traders, we own our full manufacturing plant. This means we control quality end-to-end, and can offer unbeatable <strong>wholesale toys India</strong> pricing directly to retailers without any middlemen markup.
            </p>

            <h3 style={h3Style}>Wholesale Toys for Retail Shops Across India</h3>
            <p style={pStyle}>
              We are a dedicated <strong>bulk toys supplier India</strong> for toy shops, supermarkets, kirana stores, baby shops, and online resellers. Our low MOQ policy means even small retailers can buy directly at factory rates and enjoy the same margins as large distributors. We supply to retailers in Tamil Nadu, Maharashtra, Rajasthan, UP, Gujarat, Delhi, Telangana, Karnataka and all other states.
            </p>

            <h3 style={h3Style}>Product Categories</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, margin: "16px 0 24px" }}>
              {[
                { cat: "PVC Dolls", desc: "Non-toxic, skin-safe vinyl dolls for infants & toddlers", link: "/?search=doll" },
                { cat: "Pullback Cars", desc: "Friction-powered cars, trucks & racing vehicles", link: "/?search=pullback" },
                { cat: "Windup Key Toys", desc: "Mechanical clockwork animals & character toys", link: "/?search=windup" },
                { cat: "Rattle Sets", desc: "BIS-certified rattles for babies 0–12 months", link: "/?search=rattle" },
                { cat: "Soft Toys", desc: "Plush animals and stuffed toys for all ages", link: "/?search=soft" },
                { cat: "Kids Toys", desc: "Educational & play toys for toddlers & kids", link: "/" },
              ].map((c, i) => (
                <Link key={i} to={c.link} style={{ display: "block", background: "#fff", borderRadius: 12, padding: "14px", border: "1px solid #e2e8f0", textDecoration: "none", transition: "box-shadow 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div style={{ fontWeight: 700, color: "#059669", fontSize: "0.95rem", marginBottom: 4 }}>{c.cat}</div>
                  <div style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4 }}>{c.desc}</div>
                </Link>
              ))}
            </div>

            <h3 style={h3Style}>Why Retailers Choose Bafna Toys</h3>
            <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Factory price wholesale toys — no distributor markup",
                "BIS IS 9873 certified — 100% safe for children",
                "Low MOQ — perfect for small toy shops and kirana stores",
                "400+ SKUs across categories — one supplier, full range",
                "Fast PAN India delivery — 24–48 hr dispatch",
                "GST invoice provided — business-ready purchasing",
                "COD available — zero risk for first-time buyers",
                "Dedicated WhatsApp support for order tracking",
              ].map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.97rem", color: "#334155", lineHeight: 1.5 }}>
                  <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓</span> {item}
                </li>
              ))}
            </ul>

            <h3 style={h3Style}>Toys Manufacturing in Coimbatore, Tamil Nadu</h3>
            <p style={pStyle}>
              Our manufacturing plant is located in Kalikkanaicken Palayam, Coimbatore — one of India's leading industrial cities. Coimbatore's strong engineering ecosystem allows us to source precision steel molds, run injection molding and rotomolding lines, and maintain quality at scale. Being a Coimbatore-based <strong>toy manufacturer in India</strong>, we can dispatch orders quickly to all major cities — Mumbai, Delhi, Bangalore, Hyderabad, Ahmedabad, Chennai, Kolkata and more.
            </p>

            <h3 style={h3Style}>PAN India Delivery & Bulk Order Benefits</h3>
            <p style={pStyle}>
              All orders are dispatched from our Coimbatore warehouse via Delhivery, DTDC and Blue Dart for reliable nationwide coverage. Bulk orders above ₹5,000 may qualify for free shipping. We also offer custom packaging, private label options, and dedicated account managers for large retailers and chains. Contact us for <strong>bulk toys supplier India</strong> pricing and volume discounts.
            </p>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                Quick Stats
              </h3>
              {[
                { label: "Products", value: "400+" },
                { label: "Retailers", value: "400+" },
                { label: "States Served", value: "28+" },
                { label: "Years in Business", value: "15+" },
                { label: "BIS Certified", value: "100%" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none" }}>
                  <span style={{ fontSize: "0.9rem", color: "#64748b" }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: "#059669" }}>{s.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 20, background: "#f0fdf4", borderRadius: 10, padding: 14, textAlign: "center", border: "1px solid #d1fae5" }}>
                <p style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: 600, color: "#065f46" }}>Start buying at factory price</p>
                <Link to="/register" style={{ display: "block", background: "#059669", color: "#fff", padding: "9px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
                  Register Free →
                </Link>
              </div>
            </div>

            <div style={{ background: "#0f172a", borderRadius: 16, padding: 24, color: "#fff" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 12px", color: "#10b981" }}>Keywords We Rank For</h3>
              {[
                "toys manufacturers in India",
                "toy manufacturer in India",
                "wholesale toys India",
                "bulk toys supplier India",
                "PVC dolls manufacturer",
                "pullback cars wholesale",
                "windup toys supplier",
                "factory price toys wholesale",
                "toy supplier for retailers",
                "toys manufacturer Coimbatore",
              ].map((kw, i) => (
                <div key={i} style={{ fontSize: "0.8rem", color: "#94a3b8", padding: "4px 0", borderBottom: "1px solid #1e293b" }}>
                  🔍 {kw}
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 12px" }}>Internal Links</h3>
              {[
                { label: "Browse All Toys", to: "/" },
                { label: "PVC Dolls", to: "/?search=doll" },
                { label: "Pullback Cars", to: "/?search=pullback" },
                { label: "Windup Toys", to: "/?search=windup" },
                { label: "Hot Deals", to: "/hot-deals" },
                { label: "FAQ", to: "/faq" },
                { label: "Register as Retailer", to: "/register" },
              ].map((l, i) => (
                <Link key={i} to={l.to} style={{ display: "block", padding: "7px 0", color: "#059669", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none", borderBottom: i < 6 ? "1px solid #f1f5f9" : "none" }}>
                  → {l.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <section style={{ maxWidth: 860, margin: "0 auto 60px", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: "#64748b", margin: 0 }}>Common questions from retailers and bulk buyers</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ_DATA.map((item, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", textAlign: "left", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                >
                  <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.97rem", lineHeight: 1.4 }}>{item.q}</span>
                  <span style={{ color: "#059669", fontWeight: 700, fontSize: "1.2rem", flexShrink: 0 }}>{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 16px", color: "#475569", fontSize: "0.95rem", lineHeight: 1.65 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff", textAlign: "center", padding: "60px 20px" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.5px" }}>
            Start Buying Direct from the Toy Factory
          </h2>
          <p style={{ color: "#94a3b8", maxWidth: 640, margin: "0 auto 28px", fontSize: "1.05rem", lineHeight: 1.6 }}>
            Join 400+ retailers who buy wholesale toys at factory price from Bafna Toys. Low MOQ · BIS Certified · PAN India Delivery.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/register" style={{ background: "#059669", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none", boxShadow: "0 4px 14px rgba(5,150,105,0.3)" }}>
              Register Free as Retailer
            </Link>
            <Link to="/" style={{ background: "transparent", color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: "1rem", textDecoration: "none", border: "2px solid rgba(255,255,255,0.25)" }}>
              View Live Catalog
            </Link>
          </div>
        </section>

      </div>
    </>
  );
};

const pStyle: React.CSSProperties = {
  fontSize: "0.97rem",
  lineHeight: 1.7,
  color: "#475569",
  marginBottom: 16,
};

const h3Style: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "#0f172a",
  margin: "28px 0 10px",
  borderBottom: "2px solid #e2e8f0",
  paddingBottom: 6,
};

export default ToysManufacturersIndia;
