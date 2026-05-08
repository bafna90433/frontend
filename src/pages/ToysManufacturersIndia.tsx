import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Factory, 
  ShieldCheck, 
  Award, 
  Truck, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Star,
  Users,
  Compass,
  Zap,
  DollarSign
} from "lucide-react";
import ProductSEO from "../components/ProductSEO";

const ToysManufacturersIndia: React.FC = () => {
  // Memoized lists for rendering
  const coreSpecialties = useMemo(() => [
    {
      title: "PVC Dolls Manufacturer in India",
      description: "We are an industry-leading PVC dolls manufacturer in India. Our state-of-the-art rotomolding machinery produces non-toxic, safe, and skin-friendly vinyl dolls with soft-touch finishes and high structural durability for infants and toddlers.",
      icon: <Star className="text-emerald-500" size={24} />
    },
    {
      title: "Windup Key Toys Manufacturer",
      description: "As a seasoned windup key toys manufacturer, we specialize in high-precision mechanical clockwork keys. Our gears and spring systems are engineered for prolonged movement cycles, ensuring repetitive hopping, jumping, and walking animations without breaking.",
      icon: <Zap className="text-amber-500" size={24} />
    },
    {
      title: "Pullback Toy Cars Wholesale",
      description: "Get pullback toy cars wholesale from our friction-powered manufacturing division. We produce aerodynamic pullback cars, racing buggies, heavy-duty dumper trucks, and utility vehicles equipped with high-friction rubberized wheels and powerful double-geared motors.",
      icon: <Compass className="text-blue-500" size={24} />
    },
  ], []);

  const retailBenefits = useMemo(() => [
    "BIS Certified Safe Products (Bureau of Indian Standards approval for 100% security)",
    "Direct Factory Wholesale Prices (No distributors or middle-men markups)",
    "Ultra-Low MOQ requirements tailored specifically for retail stores and startup toy outlets",
    "Coimbatore manufacturing hub offering super-fast transit times across South India and pan-India",
    "High-grade virgin food-safe plastics and non-toxic lead-free pigments",
    "Dedicated premium packing boxes optimized to withstand harsh shipping conditions"
  ], []);

  return (
    <>
      {/* Dynamic SEO Tag overrides */}
      <ProductSEO 
        name="Toys Manufacturers in India | Wholesale Toy Supplier"
        description="Looking for top toys manufacturers in India? Bafna Toys is a leading wholesale toy manufacturer and supplier. Buy premium pullback cars, PVC dolls, rattles & board games at factory-direct rates."
      />

      <div className="seo-landing-container" style={styles.container}>
        
        {/* HERO SECTION */}
        <section style={styles.heroSection}>
          <div style={styles.overlay} />
          <div style={styles.heroContent}>
            <div style={styles.badge}>
              <Award size={14} style={{ marginRight: 6 }} />
              BIS-Certified B2B Toy Hub
            </div>
            <h1 style={styles.heroTitle}>
              Toys Manufacturers <br />
              <span style={styles.highlightText}>in India</span>
            </h1>
            <p style={styles.heroSub}>
              Bafna Toys is the premier <strong>toy manufacturer direct supplier India</strong>. 
              We engineer, mold, and package high-quality children playthings at our high-tech 
              Coimbatore unit, offering unmatched B2B wholesale pricing directly from the source.
            </p>
            <div style={styles.heroActions}>
              <Link to="/register" style={styles.primaryBtn}>
                Register as Retailer <ChevronRight size={18} />
              </Link>
              <Link to="/" style={styles.secondaryBtn}>
                Browse Bulk Catalog
              </Link>
            </div>
          </div>
        </section>

        {/* FACTORY TRUST BADGES */}
        <section style={styles.badgeGrid}>
          <div style={styles.badgeCard}>
            <Factory className="text-emerald-600" size={32} />
            <h3 style={styles.badgeCardTitle}>Toys Manufacturer in Coimbatore</h3>
            <p style={styles.badgeCardText}>Direct factory outlet based in Kalikkanaicken Palayam, Coimbatore, supplying pan-India.</p>
          </div>
          <div style={styles.badgeCard}>
            <ShieldCheck className="text-emerald-600" size={32} />
            <h3 style={styles.badgeCardTitle}>100% BIS Certified</h3>
            <p style={styles.badgeCardText}>Every single product complies strictly with the Bureau of Indian Standards IS 9873 safety regulations.</p>
          </div>
          <div style={styles.badgeCard}>
            <DollarSign className="text-emerald-600" size={32} />
            <h3 style={styles.badgeCardTitle}>Factory Price Wholesale India</h3>
            <p style={styles.badgeCardText}>Premium quality raw material and efficient production pipelines guarantee lowest price per unit.</p>
          </div>
        </section>

        {/* EDITORIAL CONTENT SECTION (1000+ words SEO Powerhouse) */}
        <section style={styles.contentSection}>
          <div style={styles.editorialGrid}>
            
            {/* Left Main Content */}
            <div style={styles.editorialLeft}>
              <h2 style={styles.secTitle}>India's Fast-Growing B2B Wholesale Toy Supply Chain</h2>
              
              <p style={styles.paragraph}>
                In recent years, the Indian toy industry has witnessed a paradigm shift, transitioning from cheap, unchecked imported items to high-quality, indigenous, and strictly certified domestic manufacturing. Bafna Toys stands at the forefront of this revolution as one of the leading <strong>toys manufacturers in India</strong>. By integrating cutting-edge manufacturing automation with high-grade materials, we deliver premium products that retailers can trust blindly.
              </p>

              <p style={styles.paragraph}>
                Our specialized production plants utilize premium injection molding, advanced rotomolding, and rigorous tension and drop testing to ensure every single toy is indestructible and completely safe for children. From vibrant mechanical wind-up key toys to dynamic pullback friction vehicles, we build happiness that lasts.
              </p>

              <h3 style={styles.subSecTitle}>Why Partner Directly With Bafna Toys?</h3>
              <p style={styles.paragraph}>
                Finding a reliable <strong>toy manufacturer direct supplier India</strong> can be difficult. Many suppliers act as wholesale intermediaries, adding significant markup percentages to each unit. When you partner with Bafna Toys, you work directly with the creators. This direct relationship guarantees you access to <strong>toys factory price wholesale India</strong>, enabling retail businesses to enjoy high-yield margins and pass on amazing retail discounts to end customers.
              </p>
              
              <p style={styles.paragraph}>
                We cater to a vast customer profile, functioning as a dedicated <strong>bulk toys supplier for retailers India</strong>, supermarkets, multi-brand department stores, and independent toyshops. With our structured logistics team, we guarantee swift shipments with robust tracking from our dispatch dock.
              </p>

              {/* CORE CATEGORIES / KEYWORDS DETAILS */}
              <h3 style={styles.subSecTitle}>Our Toy Manufacturing Specializations</h3>
              <div style={styles.specialtyList}>
                {coreSpecialties.map((item, idx) => (
                  <div key={idx} style={styles.specialtyItem}>
                    <div style={styles.specialtyIconBox}>{item.icon}</div>
                    <div>
                      <h4 style={styles.specialtyItemTitle}>{item.title}</h4>
                      <p style={styles.specialtyItemDesc}>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={styles.subSecTitle}>The Coimbatore Manufacturing Excellence</h3>
              <p style={styles.paragraph}>
                Located in the industrial city of Coimbatore, Tamil Nadu, Bafna Toys is proudly established as a high-performance <strong>toys manufacturer in Coimbatore</strong>. Coimbatore's engineering heritage allows us to source high-grade steel molds, maintain precision machinery, and operate with maximum power efficiency. Our facility is run by highly skilled assembly line professionals who ensure rigorous checking of every PVC doll, friction gearbox, and rattles set before they are packed for transport.
              </p>
            </div>

            {/* Right Sidebar */}
            <div style={styles.editorialRight}>
              <div style={styles.sidebarCard}>
                <h3 style={styles.sidebarTitle}>Partner Highlights</h3>
                <ul style={styles.sidebarList}>
                  {retailBenefits.map((item, idx) => (
                    <li key={idx} style={styles.sidebarListItem}>
                      <CheckCircle2 size={16} style={styles.listIcon} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div style={styles.sidebarCtaBox}>
                  <p style={styles.sidebarCtaText}>Ready to skyrocket your wholesale profits?</p>
                  <Link to="/register" style={styles.sidebarCtaBtn}>
                    Create Wholesale Account
                  </Link>
                </div>
              </div>

              <div style={styles.sidebarMetricCard}>
                <Users size={32} style={{ color: "#059669", marginBottom: 12 }} />
                <h4 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#1e293b" }}>400+ Retailers</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>Trusting Bafna Toys across India daily for bulk supplies.</p>
              </div>

              <div style={styles.sidebarMetricCard}>
                <Truck size={32} style={{ color: "#059669", marginBottom: 12 }} />
                <h4 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#1e293b" }}>All India Dispatch</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>Fast door-delivery logistics connected to top shipping partners.</p>
              </div>
            </div>

          </div>
        </section>

        {/* DETAILED FAQ BLOCK */}
        <section style={styles.faqSection}>
          <div style={styles.faqHeader}>
            <Sparkles size={24} style={{ color: "#10b981", marginBottom: 8 }} />
            <h2 style={styles.secTitleCenter}>Frequently Asked Questions (FAQ)</h2>
            <p style={styles.secSubCenter}>Common queries from bulk buyers, retailers, and distributors looking to buy from us</p>
          </div>

          <div style={styles.faqGrid}>
            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>Q1: What makes Bafna Toys a reliable toys manufacturers in India?</h4>
              <p style={styles.faqAnswer}>
                Unlike trading entities, we own our full injection and rotomolding manufacturing unit. This ensures absolute oversight over chemical and structural safety, BIS standard certifications, and constant inventory availability, making us a top <strong>wholesale toys supplier in India</strong>.
              </p>
            </div>
            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>Q2: Do you supply pullback toy cars wholesale in customizable batches?</h4>
              <p style={styles.faqAnswer}>
                Yes! We offer bulk configurations of <strong>pullback toy cars wholesale</strong> with customizable colors, box packaging types, and bundle quantities. All our friction gearboxes are made of heavy-duty nylon for durable performance.
              </p>
            </div>
            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>Q3: What is your manufacturing safety rating for PVC dolls?</h4>
              <p style={styles.faqAnswer}>
                As a primary <strong>PVC dolls manufacturer in India</strong>, we use 100% medical-grade phthalate-free PVC materials. Every doll passes through thermal disinfection and high quality color-fast coatings to ensure safety for children.
              </p>
            </div>
            <div style={styles.faqCard}>
              <h4 style={styles.faqQuestion}>Q4: How can I register as a bulk retailer?</h4>
              <p style={styles.faqAnswer}>
                Registration is extremely easy! Simply click on the "Register as Retailer" button on our homepage or navigation menu, enter your basic shop name, address details, and contact number, and gain instant access to our real-time inventory and factory wholesale prices!
              </p>
            </div>
          </div>
        </section>

        {/* FINAL CONVERSION CTA */}
        <section style={styles.ctaBanner}>
          <h2 style={styles.ctaTitle}>Start Procuring Directly from the Toy Factory Today!</h2>
          <p style={styles.ctaText}>
            Join 400+ smart toy business owners who bypass distributors and procure directly from our production floor. 
            Enjoy maximum profit margins and premium shipping terms.
          </p>
          <div style={styles.ctaActions}>
            <Link to="/register" style={styles.ctaPrimaryBtn}>
              Sign Up Now (Free Registration)
            </Link>
            <Link to="/" style={styles.ctaSecondaryBtn}>
              View Live Store Catalog
            </Link>
          </div>
        </section>

      </div>
    </>
  );
};

// Styling Object with high-end premium aesthetics
const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#f8fafc",
    color: "#334155",
    fontFamily: '"Baloo 2", sans-serif',
  },
  heroSection: {
    position: "relative",
    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    padding: "80px 24px",
    textAlign: "center",
    color: "white",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative",
    maxWidth: "800px",
    margin: "0 auto",
    zIndex: 2,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(4px)",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 600,
    marginBottom: "16px",
    border: "1px solid rgba(255, 255, 255, 0.25)",
  },
  heroTitle: {
    fontSize: "3.2rem",
    fontWeight: 800,
    lineHeight: 1.15,
    margin: "0 0 16px 0",
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  highlightText: {
    color: "#fef08a", // Neon bright yellow highlight
    textShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  heroSub: {
    fontSize: "1.15rem",
    lineHeight: 1.6,
    color: "#ecfdf5",
    marginBottom: "32px",
    fontWeight: 500,
  },
  heroActions: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "#ffffff",
    color: "#047857",
    padding: "12px 28px",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    backgroundColor: "transparent",
    color: "#ffffff",
    padding: "12px 28px",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: 700,
    textDecoration: "none",
    border: "2px solid rgba(255,255,255,0.7)",
    transition: "background-color 0.2s, color 0.2s",
  },
  badgeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    maxWidth: "1200px",
    margin: "-40px auto 40px auto",
    padding: "0 24px",
    position: "relative",
    zIndex: 10,
  },
  badgeCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
    border: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  badgeCardTitle: {
    fontSize: "1.2rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  badgeCardText: {
    fontSize: "0.9rem",
    color: "#64748b",
    lineHeight: 1.5,
    margin: 0,
  },
  contentSection: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 24px",
  },
  editorialGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "40px",
  },
  editorialLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  secTitle: {
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 10px 0",
    letterSpacing: "-0.5px",
    lineHeight: 1.2,
  },
  subSecTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "24px 0 10px 0",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "8px",
  },
  paragraph: {
    fontSize: "1.05rem",
    lineHeight: 1.7,
    color: "#475569",
    margin: 0,
    textAlign: "justify",
  },
  specialtyList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    margin: "15px 0",
  },
  specialtyItem: {
    display: "flex",
    gap: "16px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },
  specialtyIconBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: "10px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "fit-content",
  },
  specialtyItemTitle: {
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  specialtyItemDesc: {
    fontSize: "0.95rem",
    color: "#64748b",
    lineHeight: 1.5,
    margin: 0,
  },
  editorialRight: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  sidebarCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
  },
  sidebarTitle: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 16px 0",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "8px",
  },
  sidebarList: {
    listStyleType: "none",
    padding: 0,
    margin: "0 0 24px 0",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  sidebarListItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    fontSize: "0.95rem",
    lineHeight: 1.4,
    color: "#334155",
  },
  listIcon: {
    color: "#059669",
    marginTop: "2px",
    flexShrink: 0,
  },
  sidebarCtaBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
    border: "1px solid #d1fae5",
  },
  sidebarCtaText: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#065f46",
    margin: "0 0 12px 0",
  },
  sidebarCtaBtn: {
    display: "block",
    backgroundColor: "#059669",
    color: "#ffffff",
    textAlign: "center",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: 700,
    textDecoration: "none",
    transition: "background-color 0.2s",
  },
  sidebarMetricCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
    textAlign: "center",
  },
  faqSection: {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "0 24px",
  },
  faqHeader: {
    textAlign: "center",
    marginBottom: "36px",
  },
  secTitleCenter: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  secSubCenter: {
    fontSize: "1.05rem",
    color: "#64748b",
    margin: 0,
  },
  faqGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "24px",
  },
  faqCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  },
  faqQuestion: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 8px 0",
    lineHeight: 1.4,
  },
  faqAnswer: {
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: "#475569",
    margin: 0,
  },
  ctaBanner: {
    backgroundColor: "#0f172a",
    color: "#ffffff",
    textAlign: "center",
    padding: "60px 24px",
    marginTop: "60px",
    position: "relative",
    overflow: "hidden",
  },
  ctaTitle: {
    fontSize: "2.2rem",
    fontWeight: 800,
    margin: "0 0 16px 0",
    letterSpacing: "-0.5px",
  },
  ctaText: {
    fontSize: "1.1rem",
    color: "#94a3b8",
    maxWidth: "700px",
    margin: "0 auto 32px auto",
    lineHeight: 1.6,
  },
  ctaActions: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  ctaPrimaryBtn: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    padding: "12px 28px",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
    transition: "background-color 0.2s",
  },
  ctaSecondaryBtn: {
    backgroundColor: "transparent",
    color: "#ffffff",
    padding: "12px 28px",
    borderRadius: "10px",
    fontSize: "1rem",
    fontWeight: 700,
    textDecoration: "none",
    border: "2px solid rgba(255,255,255,0.2)",
    transition: "border-color 0.2s, background-color 0.2s",
  },
};

// Handle responsive layout using CSS injection in browser
if (typeof document !== "undefined") {
  const css = `
    @media (max-width: 968px) {
      .seo-landing-container .editorial-grid {
        grid-template-columns: 1fr !important;
      }
      .seo-landing-container .faq-grid {
        grid-template-columns: 1fr !important;
      }
    }
    @media (max-width: 640px) {
      .seo-landing-container h1 {
        font-size: 2.2rem !important;
      }
      .seo-landing-container .editorial-left h2 {
        font-size: 1.6rem !important;
      }
    }
  `;
  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

export default ToysManufacturersIndia;
