import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import "../styles/Contact.css";

const PHONE = "+919043347300";
const PHONE_DISPLAY = "+91 90433 47300";
const EMAIL = "info@bafnatoys.com";
const MAPS_URL = "https://www.google.com/maps/dir/?api=1&destination=11.0168,76.9558";
const MAPS_EMBED = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.265!2d76.9532!3d11.0168!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDAxJzAwLjUiTiA3NsKwNTcnMjAuOSJF!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin";

const PRODUCTS = [
  "Pullback Cars",
  "PVC Dolls",
  "Windup Toys",
  "Board Games",
  "Baby Rattles",
  "Squeezy Toys",
  "Educational Toys",
  "All Products",
];

const ORDER_SIZES = [
  "Below ₹10,000",
  "₹10,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "Above ₹1,00,000",
];

const FAQS = [
  {
    q: "What is the minimum order quantity (MOQ)?",
    a: "Our minimum order value is ₹10,000 for wholesale. We accept smaller trial orders for new retailers so you can test the quality before committing to a larger order.",
  },
  {
    q: "Do you deliver across India?",
    a: "Yes, we deliver to all 28 states across India via trusted courier and transport partners. Cash on Delivery (COD) is available along with online payment options.",
  },
  {
    q: "How can I get a product catalogue?",
    a: "WhatsApp us at +91 90433 47300 to receive our complete digital catalogue with wholesale prices and product details instantly.",
  },
  {
    q: "Are your toys safe for children?",
    a: "Absolutely. All our toys are BIS-compliant and manufactured with child-safe, non-toxic materials. We follow Indian safety standards strictly.",
  },
  {
    q: "Do you offer customized packaging?",
    a: "Yes, we offer customized branding and packaging for bulk orders above ₹1,00,000. Contact us with your requirements and we will share a custom quote.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery takes 3–7 working days depending on your location within India. Metro cities are usually faster at 2–4 working days.",
  },
];

/* ── FAQ Item ──────────────────────────────────────── */
const FAQItem = ({ q, a, idx }: { q: string; a: string; idx: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ct-faq-item${open ? " ct-faq-open" : ""}`}>
      <button
        className="ct-faq-q"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span className="ct-faq-icon">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="ct-faq-a">{a}</div>}
    </div>
  );
};

/* ── Main Component ────────────────────────────────── */
const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    shop: "",
    phone: "",
    email: "",
    city: "",
    gstin: "",
    orderSize: "",
    message: "",
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: "" }));
  };

  const toggleProduct = (p: string) => {
    setSelectedProducts((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.shop.trim()) e.shop = "Shop name is required";
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10)))
      e.phone = "Enter a valid 10-digit phone number";
    if (!form.city.trim()) e.city = "City & State is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const prods = selectedProducts.length ? selectedProducts.join(", ") : "Not specified";
    const msg = [
      `*New Wholesale Inquiry — Bafna Toys*`,
      ``,
      `👤 *Name:* ${form.name}`,
      `🏪 *Shop:* ${form.shop}`,
      `📞 *Phone:* ${form.phone}`,
      form.email ? `📧 *Email:* ${form.email}` : "",
      `📍 *City:* ${form.city}`,
      form.gstin ? `🧾 *GSTIN:* ${form.gstin}` : "",
      `📦 *Products:* ${prods}`,
      form.orderSize ? `💰 *Order Size:* ${form.orderSize}` : "",
      form.message ? `💬 *Message:* ${form.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSubmitted(true);
  };

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "name": "Bafna Toys",
        "image": "https://bafnatoys.com/logo.webp",
        "telephone": "+91-90433-47300",
        "email": EMAIL,
        "url": "https://bafnatoys.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "1-12, Sundapalayam Rd, Kalikkanaicken Palayam",
          "addressLocality": "Coimbatore",
          "addressRegion": "Tamil Nadu",
          "postalCode": "641007",
          "addressCountry": "IN",
        },
        "geo": { "@type": "GeoCoordinates", "latitude": "11.0168", "longitude": "76.9558" },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
          "opens": "09:00",
          "closes": "19:00",
        },
        "priceRange": "₹₹",
      },
      {
        "@type": "FAQPage",
        "mainEntity": FAQS.map(({ q, a }) => ({
          "@type": "Question",
          "name": q,
          "acceptedAnswer": { "@type": "Answer", "text": a },
        })),
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Contact Bafna Toys — Wholesale Toy Manufacturer Coimbatore | +91 90433 47300</title>
        <meta name="description" content="Contact Bafna Toys for wholesale toy orders. Factory-direct prices on pullback cars, PVC dolls, windup toys. Call +91 90433 47300 or visit our Coimbatore factory." />
        <meta name="keywords" content="contact bafna toys, toy manufacturer coimbatore contact, wholesale toy supplier india phone, bafna toys address" />
        <link rel="canonical" href="https://bafnatoys.com/contact" />
        <meta property="og:title" content="Contact Bafna Toys — Wholesale Toy Manufacturer Coimbatore" />
        <meta property="og:description" content="Get factory-direct wholesale prices on 300+ toys. Call or WhatsApp +91 90433 47300. Located in Coimbatore, Tamil Nadu." />
        <meta property="og:url" content="https://bafnatoys.com/contact" />
        <meta property="og:image" content="https://bafnatoys.com/logo.webp" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <div className="ct-page">

        {/* ── HERO ────────────────────────────────────────── */}
        <section className="ct-hero">
          <div className="ct-hero-overlay" />
          <div className="ct-hero-content">
            <div className="ct-hero-badge">📍 Coimbatore, Tamil Nadu</div>
            <h1 className="ct-hero-title">
              Contact Bafna Toys —<br />
              <span className="ct-hero-accent">Leading Toy Manufacturer</span>
            </h1>
            <p className="ct-hero-sub">
              Get factory-direct wholesale prices on 300+ toy products.
              Whether you're a retailer, distributor, or new to the toy business —
              we're here to help you grow. Reach us Monday to Saturday, 9 AM to 7 PM.
            </p>
            <div className="ct-hero-btns">
              <a href={`tel:${PHONE}`} className="ct-btn-call">📞 Call Now</a>
              <a
                href={`https://wa.me/${PHONE}?text=${encodeURIComponent("Hi, I'm interested in Bafna Toys wholesale products.")}`}
                target="_blank" rel="noopener noreferrer"
                className="ct-btn-wha"
              >
                💬 WhatsApp Now
              </a>
            </div>
          </div>
        </section>

        {/* ── CONTACT CARDS ────────────────────────────────── */}
        <section className="ct-section ct-cards-section">
          <div className="ct-container">
            <div className="ct-cards-grid">

              {/* Phone */}
              <div className="ct-card">
                <div className="ct-card-icon" style={{ background: "#eff6ff" }}>📞</div>
                <h3 className="ct-card-title">Phone & WhatsApp</h3>
                <p className="ct-card-val">{PHONE_DISPLAY}</p>
                <p className="ct-card-sub">Mon–Sat, 9:00 AM – 7:00 PM</p>
                <div className="ct-card-btns">
                  <a href={`tel:${PHONE}`} className="ct-cbtn ct-cbtn--blue">📞 Call</a>
                  <a
                    href={`https://wa.me/${PHONE}?text=${encodeURIComponent("Hi, I'm interested in Bafna Toys wholesale products.")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="ct-cbtn ct-cbtn--green"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="ct-card">
                <div className="ct-card-icon" style={{ background: "#fef9c3" }}>✉️</div>
                <h3 className="ct-card-title">Email</h3>
                <p className="ct-card-val">{EMAIL}</p>
                <p className="ct-card-sub">We reply within 24 hours</p>
                <div className="ct-card-btns">
                  <a
                    href={`mailto:${EMAIL}?subject=Wholesale%20Inquiry%20-%20Bafna%20Toys`}
                    className="ct-cbtn ct-cbtn--blue"
                  >
                    ✉️ Send Email
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="ct-card">
                <div className="ct-card-icon" style={{ background: "#fef2f2" }}>📍</div>
                <h3 className="ct-card-title">Factory Address</h3>
                <address className="ct-card-val ct-address" style={{ fontStyle: "normal" }}>
                  1-12, Sundapalayam Rd,<br />
                  Kalikkanaicken Palayam,<br />
                  Coimbatore – 641007,<br />
                  Tamil Nadu, India
                </address>
                <div className="ct-card-btns">
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="ct-cbtn ct-cbtn--blue">
                    🗺️ Get Directions
                  </a>
                </div>
              </div>

              {/* Hours */}
              <div className="ct-card">
                <div className="ct-card-icon" style={{ background: "#f0fdf4" }}>🕘</div>
                <h3 className="ct-card-title">Business Hours</h3>
                <div className="ct-hours">
                  <div className="ct-hours-row">
                    <span>Monday – Saturday</span>
                    <span className="ct-hours-open">9:00 AM – 7:00 PM</span>
                  </div>
                  <div className="ct-hours-row">
                    <span>Sunday</span>
                    <span className="ct-hours-closed">Closed</span>
                  </div>
                </div>
                <p className="ct-card-sub" style={{ marginTop: 12 }}>
                  WhatsApp available after hours
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── INQUIRY FORM ─────────────────────────────────── */}
        <section className="ct-section ct-form-section">
          <div className="ct-container ct-form-grid">

            {/* Left — why contact */}
            <div className="ct-form-left">
              <div className="ct-section-tag">Get In Touch</div>
              <h2 className="ct-section-title">Send Us Your<br />Wholesale Inquiry</h2>
              <p className="ct-form-desc">
                Fill in the form and we'll get back to you on WhatsApp within a few hours.
                Tell us what you need and we'll give you the best wholesale price.
              </p>
              <div className="ct-why-list">
                {[
                  { icon: "🏭", text: "Factory-direct prices — save 30–40%" },
                  { icon: "🧸", text: "300+ products under one roof" },
                  { icon: "🚚", text: "Pan-India delivery, COD available" },
                  { icon: "🛡️", text: "GST registered, 100% genuine" },
                ].map((item) => (
                  <div className="ct-why-item" key={item.text}>
                    <span className="ct-why-ico">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="ct-quick-contact">
                <a href={`tel:${PHONE}`} className="ct-qlink">📞 {PHONE_DISPLAY}</a>
                <a href={`mailto:${EMAIL}`} className="ct-qlink">✉️ {EMAIL}</a>
              </div>
            </div>

            {/* Right — form */}
            <div className="ct-form-right">
              {submitted ? (
                <div className="ct-success">
                  <div className="ct-success-icon">✅</div>
                  <h3>Inquiry Sent on WhatsApp!</h3>
                  <p>Your inquiry has been sent. We'll reply within a few hours.</p>
                  <button className="ct-btn-primary" onClick={() => { setSubmitted(false); setForm({ name:"",shop:"",phone:"",email:"",city:"",gstin:"",orderSize:"",message:"" }); setSelectedProducts([]); }}>
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form className="ct-form" onSubmit={handleSubmit} noValidate>
                  <div className="ct-form-row">
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-name">Full Name *</label>
                      <input id="ct-name" name="name" className={`ct-input${errors.name ? " ct-input-err" : ""}`} placeholder="Your full name" value={form.name} onChange={handleChange} autoComplete="name" />
                      {errors.name && <span className="ct-err">{errors.name}</span>}
                    </div>
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-shop">Shop / Business Name *</label>
                      <input id="ct-shop" name="shop" className={`ct-input${errors.shop ? " ct-input-err" : ""}`} placeholder="Your shop or business name" value={form.shop} onChange={handleChange} />
                      {errors.shop && <span className="ct-err">{errors.shop}</span>}
                    </div>
                  </div>

                  <div className="ct-form-row">
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-phone">Phone Number *</label>
                      <input id="ct-phone" name="phone" type="tel" className={`ct-input${errors.phone ? " ct-input-err" : ""}`} placeholder="10-digit mobile number" value={form.phone} onChange={handleChange} autoComplete="tel" inputMode="numeric" maxLength={13} />
                      {errors.phone && <span className="ct-err">{errors.phone}</span>}
                    </div>
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-email">Email Address</label>
                      <input id="ct-email" name="email" type="email" className="ct-input" placeholder="Optional" value={form.email} onChange={handleChange} autoComplete="email" />
                    </div>
                  </div>

                  <div className="ct-form-row">
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-city">City &amp; State *</label>
                      <input id="ct-city" name="city" className={`ct-input${errors.city ? " ct-input-err" : ""}`} placeholder="e.g. Mumbai, Maharashtra" value={form.city} onChange={handleChange} />
                      {errors.city && <span className="ct-err">{errors.city}</span>}
                    </div>
                    <div className="ct-field">
                      <label className="ct-label" htmlFor="ct-gstin">GSTIN (Optional)</label>
                      <input id="ct-gstin" name="gstin" className="ct-input" placeholder="Your GST number" value={form.gstin} onChange={handleChange} maxLength={15} style={{ fontFamily: "monospace", letterSpacing: 1 }} />
                    </div>
                  </div>

                  {/* Products */}
                  <div className="ct-field ct-field-full">
                    <label className="ct-label">Interested Products</label>
                    <div className="ct-checkboxes">
                      {PRODUCTS.map((p) => (
                        <label key={p} className={`ct-checkbox${selectedProducts.includes(p) ? " ct-checkbox-on" : ""}`}>
                          <input type="checkbox" checked={selectedProducts.includes(p)} onChange={() => toggleProduct(p)} style={{ display: "none" }} />
                          {selectedProducts.includes(p) ? "✓ " : ""}{p}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Order Size */}
                  <div className="ct-field ct-field-full">
                    <label className="ct-label" htmlFor="ct-order">Estimated Order Value</label>
                    <select id="ct-order" name="orderSize" className="ct-input ct-select" value={form.orderSize} onChange={handleChange}>
                      <option value="">Select approximate order size</option>
                      {ORDER_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Message */}
                  <div className="ct-field ct-field-full">
                    <label className="ct-label" htmlFor="ct-msg">Message / Requirements</label>
                    <textarea id="ct-msg" name="message" className="ct-input ct-textarea" placeholder="Tell us more about your requirements, specific products, or any questions..." value={form.message} onChange={handleChange} rows={4} />
                  </div>

                  <button type="submit" className="ct-submit">
                    💬 Send Inquiry via WhatsApp
                  </button>
                  <p className="ct-form-note">
                    * Your inquiry will open WhatsApp with details pre-filled. No account needed.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ── GOOGLE MAP ───────────────────────────────────── */}
        <section className="ct-section ct-map-section">
          <div className="ct-container">
            <div className="ct-section-tag" style={{ textAlign: "center" }}>Find Us</div>
            <h2 className="ct-section-title" style={{ textAlign: "center" }}>Visit Our Factory in Coimbatore</h2>
            <div className="ct-map-wrap">
              <iframe
                title="Bafna Toys Factory Location — Coimbatore"
                src={MAPS_EMBED}
                width="100%"
                height="380"
                style={{ border: 0, borderRadius: 16 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="ct-map-footer">
              <div className="ct-map-address">
                📍 1-12, Sundapalayam Rd, Kalikkanaicken Palayam, Coimbatore – 641007, Tamil Nadu
              </div>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="ct-btn-primary">
                🗺️ Get Directions
              </a>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section className="ct-section ct-faq-section">
          <div className="ct-container">
            <div className="ct-section-tag" style={{ textAlign: "center" }}>FAQs</div>
            <h2 className="ct-section-title" style={{ textAlign: "center" }}>Frequently Asked Questions</h2>
            <div className="ct-faq-list">
              {FAQS.map((f, i) => <FAQItem key={i} idx={i} q={f.q} a={f.a} />)}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="ct-cta">
          <div className="ct-container">
            <h2 className="ct-cta-title">Ready to Start Wholesale Business with Us?</h2>
            <p className="ct-cta-sub">Join 1000+ retailers who trust Bafna Toys for quality &amp; price.</p>
            <div className="ct-cta-btns">
              <a href={`tel:${PHONE}`} className="ct-btn-call ct-btn-lg">📞 Call Now</a>
              <a
                href={`https://wa.me/${PHONE}?text=${encodeURIComponent("Hi, I'm interested in Bafna Toys wholesale products.")}`}
                target="_blank" rel="noopener noreferrer"
                className="ct-btn-wha ct-btn-lg"
              >
                💬 WhatsApp Now
              </a>
            </div>
            <div className="ct-cta-links">
              <a href="/">🏠 Home</a>
              <a href="/products">🛍️ Products</a>
              <a href="/about">ℹ️ About Us</a>
              <a href="/hot-deals">🔥 Hot Deals</a>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default Contact;
