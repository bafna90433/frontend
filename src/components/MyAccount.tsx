import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import "../styles/MyAccount.css";

const API_BASE = "http://localhost:5000";

type User = {
  _id: string;
  firmName?: string;
  shopName?: string;
  state?: string;
  city?: string;
  zip?: string | number;
  otpMobile?: string;
  whatsapp?: string;
  visitingCardUrl?: string;
  isApproved?: boolean;
};

const resolveImage = (img?: string) => {
  if (!img) return "";
  if (img.startsWith("http")) return img;
  if (img.startsWith("/uploads") || img.startsWith("/images"))
    return `${API_BASE}${img}`;
  if (img.startsWith("uploads/") || img.startsWith("images/"))
    return `${API_BASE}/${img}`;
  return `${API_BASE}/uploads/${encodeURIComponent(img)}`;
};

const MyAccount: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const imgSrc = resolveImage(user?.visitingCardUrl);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  return (
    <MainLayout>
      <div className="account-container">
        {/* 🔹 Mobile Tabs */}
        <div className="account-tabs mobile-only">
          <button
            className={activeTab === "details" ? "active" : ""}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={activeTab === "contact" ? "active" : ""}
            onClick={() => setActiveTab("contact")}
          >
            Contact
          </button>
          <button
            className={activeTab === "status" ? "active" : ""}
            onClick={() => setActiveTab("status")}
          >
            Status
          </button>
          <button
            className={activeTab === "card" ? "active" : ""}
            onClick={() => setActiveTab("card")}
          >
            Card
          </button>
          <button className="logout-tab" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* 🔹 Mobile actions */}
        <div className="account-actions mobile-only">
          <button className="btn-primary" onClick={() => navigate("/orders")}>
            My Orders
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate("/edit-profile")}
          >
            Edit Profile
          </button>
        </div>

        <h1 className="account-title">My Account</h1>

        {user ? (
          <>
            {/* ✅ Desktop Grid */}
            <div className="account-grid desktop-only">
              <div className="account-card account-info">
                <h2>Business Details</h2>
                <div className="account-row">
                  <span className="account-label">Firm Name</span>
                  <span className="account-value">{user.firmName || "Not provided"}</span>
                </div>
                <div className="account-row">
                  <span className="account-label">Shop Name</span>
                  <span className="account-value">{user.shopName || "Not provided"}</span>
                </div>
                <div className="account-row">
                  <span className="account-label">Location</span>
                  <span className="account-value">
                    {user.city || "City not specified"},{" "}
                    {user.state || "State not specified"}{" "}
                    {user.zip ? `- ${user.zip}` : ""}
                  </span>
                </div>
              </div>

              <div className="account-card account-contact">
                <h2>Contact Information</h2>
                <div className="account-row">
                  <span className="account-label">Mobile</span>
                  <span className="account-value">{user.otpMobile || "Not provided"}</span>
                </div>
                <div className="account-row">
                  <span className="account-label">WhatsApp</span>
                  <span className="account-value">{user.whatsapp || "Not provided"}</span>
                </div>
              </div>

              <div className="account-card account-status">
                <h2>Account Status</h2>
                <div className="account-row">
                  <span className="account-label">Status</span>
                  <span className={`account-badge ${user.isApproved ? "approved" : "pending"}`}>
                    {user.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>

              {imgSrc && (
                <div className="account-card account-visiting">
                  <h2>Visiting Card</h2>
                  <img
                    className="account-img"
                    src={imgSrc}
                    alt="Visiting Card"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = "/placeholder.png")
                    }
                  />
                </div>
              )}
            </div>

            {/* ✅ Mobile content */}
            <div className="mobile-only">
              {activeTab === "details" && (
                <div className="account-card">
                  <h2>Business Details</h2>
                  <div className="account-row">
                    <span className="account-label">Firm Name</span>
                    <span className="account-value">{user.firmName || "Not provided"}</span>
                  </div>
                  <div className="account-row">
                    <span className="account-label">Shop Name</span>
                    <span className="account-value">{user.shopName || "Not provided"}</span>
                  </div>
                  <div className="account-row">
                    <span className="account-label">Location</span>
                    <span className="account-value">
                      {user.city || "City not specified"},{" "}
                      {user.state || "State not specified"}{" "}
                      {user.zip ? `- ${user.zip}` : ""}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "contact" && (
                <div className="account-card">
                  <h2>Contact Information</h2>
                  <div className="account-row">
                    <span className="account-label">Mobile</span>
                    <span className="account-value">{user.otpMobile || "Not provided"}</span>
                  </div>
                  <div className="account-row">
                    <span className="account-label">WhatsApp</span>
                    <span className="account-value">{user.whatsapp || "Not provided"}</span>
                  </div>
                </div>
              )}

              {activeTab === "status" && (
                <div className="account-card">
                  <h2>Account Status</h2>
                  <div className="account-row">
                    <span className="account-label">Status</span>
                    <span className={`account-badge ${user.isApproved ? "approved" : "pending"}`}>
                      {user.isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "card" && imgSrc && (
                <div className="account-card">
                  <h2>Visiting Card</h2>
                  <img
                    className="account-img"
                    src={imgSrc}
                    alt="Visiting Card"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = "/placeholder.png")
                    }
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="account-loading">Loading your account information…</p>
        )}
      </div>
    </MainLayout>
  );
};

export default MyAccount;
