// src/components/MyAccount.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import "../styles/MyAccount.css";
import { 
  Store, 
  MapPin, 
  Phone, 
  MessageCircle, 
  CheckCircle,
  Clock,
  Mail,
  Package,
  Edit,
  LogOut
} from "lucide-react";

const API_BASE = "http://localhost:5000";

type User = {
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
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="account-loading">
          <div className="loading-spinner"></div>
          <p>Loading your account information...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="account-container">
        {/* Header */}
        <div className="account-header">
          <div>
            <h1 className="account-title">My Account</h1>
            <p className="account-subtitle">Manage your business profile</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate("/edit-profile")}
            >
              <Edit size={18} />
              Edit Profile
            </button>
            <button 
              className="btn-outline"
              onClick={() => navigate("/orders")}
            >
              <Package size={18} />
              View Orders
            </button>
          </div>
        </div>

        {/* Account Status Banner */}
        <div className={`status-banner ${user.isApproved ? 'approved' : 'pending'}`}>
          <div className="status-content">
            {user.isApproved ? (
              <>
                <CheckCircle size={20} />
                <div>
                  <h4>Account Approved</h4>
                  <p>Your account is fully active. You can place orders and make payments.</p>
                </div>
              </>
            ) : (
              <>
                <Clock size={20} />
                <div>
                  <h4>Pending Approval</h4>
                  <p>Your account is under review. You can browse products but cannot place orders yet.</p>
                </div>
              </>
            )}
          </div>
          {!user.isApproved && (
            <div className="status-note">
              ⏳ Usually approved within 24-48 hours
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="account-grid">
          {/* Business Information */}
          <div className="info-section">
            <div className="section-header">
              <Store size={20} className="section-icon" />
              <h3>Business Information</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Shop Name</span>
                <span className="info-value">{user.shopName || "Not provided"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">City</span>
                <span className="info-value">{user.city || "Not specified"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">PIN Code</span>
                <span className="info-value">{user.zip || "Not provided"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since</span>
                <span className="info-value">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="info-section">
            <div className="section-header">
              <Phone size={20} className="section-icon" />
              <h3>Contact Information</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <div className="info-icon">
                  <Phone size={16} />
                </div>
                <div>
                  <span className="info-label">Mobile</span>
                  <span className="info-value">{user.otpMobile || "Not provided"}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <span className="info-label">WhatsApp</span>
                  <span className="info-value">{user.whatsapp}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email || "Not provided"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-section">
          <h3 className="stats-title">Account Overview</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Account Status</div>
              <div className={`stat-value ${user.isApproved ? 'success' : 'warning'}`}>
                {user.isApproved ? "Approved" : "Pending"}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Order Access</div>
              <div className="stat-value">
                {user.isApproved ? "Full Access" : "Limited"}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Payment Access</div>
              <div className="stat-value">
                {user.isApproved ? "Online + COD" : "COD Only"}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <h3 className="action-title">Quick Actions</h3>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => navigate("/products")}
            >
              <Package size={18} />
              Browse Products
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => navigate("/orders")}
            >
              View Order History
            </button>
            <button 
              className="action-btn outline"
              onClick={() => navigate("/addresses")}
            >
              Manage Addresses
            </button>
            <button 
              className="action-btn danger"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MyAccount;