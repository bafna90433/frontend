import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import api from "../utils/api";
import "../styles/MyAccount.css";
import {
  Store, MapPin, Phone, MessageCircle, CheckCircle, Clock,
  Mail, Package, Edit, LogOut, ChevronRight, Shield, CreditCard,
  Truck, MapPinned, HelpCircle, FileText, Star,
  ShoppingBag, ArrowUpRight, Copy, Award
} from "lucide-react";

// Media base for images
const MEDIA_BASE = "https://bafnatoys-backend-production.up.railway.app";
const getImageUrl = (url: string) => url?.startsWith("http") ? url : url ? `${MEDIA_BASE}${url}` : "";

type UserType = {
  _id: string;
  shopName?: string;
  city?: string;
  zip?: string | number;
  otpMobile?: string;
  whatsapp: string;
  visitingCardUrl: string;
  isApproved?: boolean;
  email?: string;
  createdAt?: string;
};

const MyAccount: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Sirf count check karne ke liye products ki list chahiye
  const [deliveredProducts, setDeliveredProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { 
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        fetchDeliveredItems(parsedUser._id);
      } catch {}
    }
  }, []);

  const fetchDeliveredItems = async (userId: string) => {
    try {
      const res = await api.get(`/orders?customerId=${userId}`);
      const orders = res.data || [];
      
      const deliveredOrders = orders.filter((o: any) => o.status === 'delivered');
      
      const productMap = new Map();
      deliveredOrders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          const prodId = item.productId?._id || item.productId;
          if (prodId && !productMap.has(prodId)) {
            productMap.set(prodId, {
              id: prodId,
              name: item.name,
              image: item.image
            });
          }
        });
      });
      setDeliveredProducts(Array.from(productMap.values()));
    } catch (err) {
      console.error("Error fetching delivered items:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCopyId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const daysSince = (d?: string) => {
    if (!d) return 0;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  };

  const getInitials = (name?: string) => {
    if (!name) return "BT";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarGradient = (name?: string) => {
    const gradients = [
      "linear-gradient(135deg, #6366f1, #8b5cf6)",
      "linear-gradient(135deg, #0891b2, #06b6d4)",
      "linear-gradient(135deg, #059669, #34d399)",
      "linear-gradient(135deg, #d97706, #fbbf24)",
      "linear-gradient(135deg, #dc2626, #f87171)",
      "linear-gradient(135deg, #7c3aed, #a78bfa)",
      "linear-gradient(135deg, #2563eb, #60a5fa)",
    ];
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = (name || "").charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="ma-loading">
          <div className="ma-spinner" />
          <p>Loading account...</p>
        </div>
      </MainLayout>
    );
  }

  const quickActions = [
    { icon: <ShoppingBag size={20} />, label: "Orders", sub: "Track purchases", path: "/orders", gradient: "linear-gradient(135deg,#4f46e5,#7c3aed)" },
    { icon: <MapPinned size={20} />, label: "Addresses", sub: "Delivery locations", path: "/addresses", gradient: "linear-gradient(135deg,#0891b2,#06b6d4)" },
    { icon: <Store size={20} />, label: "Products", sub: "Browse catalog", path: "/products", gradient: "linear-gradient(135deg,#059669,#34d399)" },
    { icon: <Edit size={20} />, label: "Edit Profile", sub: "Update info", path: "/edit-profile", gradient: "linear-gradient(135deg,#d97706,#fbbf24)" },
  ];

  const menuSections = [
    {
      title: "Account",
      items: [
        { icon: <Package size={20} />, label: "My Orders", sub: "Track & manage all orders", path: "/orders", color: "#4f46e5" },
        { icon: <MapPinned size={20} />, label: "Saved Addresses", sub: "Manage delivery addresses", path: "/addresses", color: "#0891b2" },
        { icon: <Edit size={20} />, label: "Edit Profile", sub: "Update business details", path: "/edit-profile", color: "#059669" },
        { icon: <FileText size={20} />, label: "Invoices", sub: "Download order invoices", path: "/orders", color: "#7c3aed" },
      ],
    },
    {
      title: "Support & Legal",
      items: [
        { icon: <HelpCircle size={20} />, label: "Help Center", sub: "FAQs & support", path: "/help", color: "#2563eb" },
        { icon: <Shield size={20} />, label: "Privacy Policy", sub: "Data protection info", path: "/privacy-policy", color: "#64748b" },
        { icon: <FileText size={20} />, label: "Terms of Service", sub: "Usage terms", path: "/terms-conditions", color: "#64748b" },
        { icon: <Truck size={20} />, label: "Shipping Policy", sub: "Delivery information", path: "/shipping-delivery", color: "#0891b2" },
      ],
    },
  ];

  return (
    <MainLayout>
      <div className="ma-page">
        {/* MOBILE HEADER */}
        <div className="ma-mob-head">
          <h1>My Account</h1>
        </div>

        {/* DESKTOP HERO SECTION */}
        <div className="ma-hero">
          <div className="ma-hero-bg" />
          <div className="ma-hero-content">
            <div className="ma-hero-left">
              <div className="ma-hero-avatar" style={{ background: getAvatarGradient(user.shopName) }}>
                {getInitials(user.shopName)}
              </div>
              <div className="ma-hero-info">
                <div className="ma-hero-name-row">
                  <h1>{user.shopName || "Retailer"}</h1>
                  <div className={`ma-hero-badge ${user.isApproved ? "ma-hero-badge--ok" : "ma-hero-badge--wait"}`}>
                    {user.isApproved ? <><CheckCircle size={13} /> Verified</> : <><Clock size={13} /> Pending</>}
                  </div>
                </div>
                <div className="ma-hero-meta">
                  {user.city && <span><MapPin size={13} /> {user.city}{user.zip ? ` — ${user.zip}` : ""}</span>}
                  {user.otpMobile && <span><Phone size={13} /> {user.otpMobile}</span>}
                  {user.email && <span><Mail size={13} /> {user.email}</span>}
                </div>
                <div className="ma-hero-id">
                  <span>ID: {user._id.slice(-8).toUpperCase()}</span>
                  <button className="ma-copy-btn" onClick={handleCopyId}>
                    {copied ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              </div>
            </div>
            <div className="ma-hero-right">
              <button className="ma-hero-edit" onClick={() => navigate("/edit-profile")}>
                <Edit size={16} /> Edit Profile
              </button>
              <button className="ma-hero-orders" onClick={() => navigate("/orders")}>
                <Package size={16} /> My Orders
              </button>
            </div>
          </div>
        </div>

        {/* ✅ NEW CLICKABLE BANNER FOR RATING */}
        {!loadingProducts && deliveredProducts.length > 0 && (
          <div 
            onClick={() => navigate("/pending-reviews")}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
              border: '1px solid #fde68a', marginTop: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: '#fef08a', padding: '10px', borderRadius: '50%' }}>
                <Star size={24} fill="#d97706" color="#d97706" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#92400e' }}>Rate Your Purchases</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#b45309' }}>
                  You have {deliveredProducts.length} delivered products to rate. Click here!
                </p>
              </div>
            </div>
            <ChevronRight size={20} color="#92400e" />
          </div>
        )}

        {/* STATS ROW */}
        <div className="ma-stats-row">
          <div className="ma-stat-card">
            <div className="ma-stat-icon" style={{ background: "rgba(79,70,229,.08)", color: "#4f46e5" }}>
              <Shield size={20} />
            </div>
            <div className="ma-stat-body">
              <span className="ma-stat-label">Account Status</span>
              <span className={`ma-stat-val ${user.isApproved ? "ma-stat-val--green" : "ma-stat-val--amber"}`}>
                {user.isApproved ? "Active & Verified" : "Pending Review"}
              </span>
            </div>
          </div>
          <div className="ma-stat-card">
            <div className="ma-stat-icon" style={{ background: "rgba(5,150,105,.08)", color: "#059669" }}>
              <CreditCard size={20} />
            </div>
            <div className="ma-stat-body">
              <span className="ma-stat-label">Payment Access</span>
              <span className="ma-stat-val">{user.isApproved ? "Online + COD" : "COD Only"}</span>
            </div>
          </div>
          <div className="ma-stat-card">
            <div className="ma-stat-icon" style={{ background: "rgba(8,145,178,.08)", color: "#0891b2" }}>
              <Truck size={20} />
            </div>
            <div className="ma-stat-body">
              <span className="ma-stat-label">Delivery Zone</span>
              <span className="ma-stat-val">All India Shipping</span>
            </div>
          </div>
          <div className="ma-stat-card">
            <div className="ma-stat-icon" style={{ background: "rgba(217,119,6,.08)", color: "#d97706" }}>
              <Award size={20} />
            </div>
            <div className="ma-stat-body">
              <span className="ma-stat-label">Member Since</span>
              <span className="ma-stat-val">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* APPROVAL ALERT */}
        {!user.isApproved && (
          <div className="ma-alert-banner">
            <div className="ma-alert-glow" />
            <Clock size={20} className="ma-alert-icon" />
            <div className="ma-alert-text">
              <strong>Account Under Review</strong>
              <p>Your account is being verified. Usually approved within 24-48 hours. You can browse products in the meantime.</p>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="ma-quick-grid">
          {quickActions.map((item, i) => (
            <button key={i} className="ma-quick-card" onClick={() => navigate(item.path)}>
              <div className="ma-quick-icon" style={{ background: item.gradient }}>
                {item.icon}
              </div>
              <div className="ma-quick-text">
                <strong>{item.label}</strong>
                <span>{item.sub}</span>
              </div>
              <ArrowUpRight size={16} className="ma-quick-arrow" />
            </button>
          ))}
        </div>

        {/* MAIN GRID (Business & Contact Info) */}
        <div className="ma-main-grid">
          {/* Business Info */}
          <div className="ma-card">
            <div className="ma-card-head">
              <div className="ma-card-icon ma-card-icon--blue"><Store size={16} /></div>
              <h3>Business Information</h3>
            </div>
            <div className="ma-info-list">
              {[
                { icon: <Store size={15} />, label: "Shop Name", value: user.shopName || "Not provided" },
                { icon: <MapPin size={15} />, label: "City", value: user.city || "Not specified" },
                { icon: <Mail size={15} />, label: "PIN Code", value: String(user.zip || "Not provided") },
                { icon: <Star size={15} />, label: "Member Days", value: `${daysSince(user.createdAt)} days` },
              ].map((item, i) => (
                <div key={i} className="ma-info-row">
                  <div className="ma-info-icon">{item.icon}</div>
                  <div className="ma-info-content">
                    <span className="ma-info-label">{item.label}</span>
                    <span className="ma-info-value">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="ma-card">
            <div className="ma-card-head">
              <div className="ma-card-icon ma-card-icon--cyan"><Phone size={16} /></div>
              <h3>Contact Details</h3>
            </div>
            <div className="ma-info-list">
              {[
                { icon: <Phone size={15} />, label: "Mobile", value: user.otpMobile || "Not provided" },
                { icon: <MessageCircle size={15} />, label: "WhatsApp", value: user.whatsapp || "Not provided" },
                { icon: <Mail size={15} />, label: "Email", value: user.email || "Not provided" },
                { icon: <CheckCircle size={15} />, label: "Verified On", value: formatDate(user.createdAt) },
              ].map((item, i) => (
                <div key={i} className="ma-info-row">
                  <div className="ma-info-icon">{item.icon}</div>
                  <div className="ma-info-content">
                    <span className="ma-info-label">{item.label}</span>
                    <span className="ma-info-value">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MENU SECTIONS */}
        {menuSections.map((section, si) => (
          <div key={si} className="ma-menu-section">
            <div className="ma-menu-head">
              <h3>{section.title}</h3>
            </div>
            <div className="ma-menu-grid">
              {section.items.map((item, i) => (
                <button key={i} className="ma-menu-item" onClick={() => navigate(item.path)}>
                  <div className="ma-menu-icon" style={{ background: `${item.color}0D`, color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="ma-menu-text">
                    <strong>{item.label}</strong>
                    <span>{item.sub}</span>
                  </div>
                  <ChevronRight size={16} className="ma-menu-arrow" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* LOGOUT */}
        <div className="ma-logout-wrap">
          <button className="ma-logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="ma-footer">
          <p>Bafna Toys · v2.0</p>
          <p>Made with ❤️ in Coimbatore</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default MyAccount;