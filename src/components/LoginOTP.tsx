import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Smartphone, ArrowRight, ShieldCheck, Lock, Truck, 
  Package, Zap, MapPin, Star
} from "lucide-react";
import "../styles/AuthStyles.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LoginOTP: React.FC = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const showMsg = (text: string, type: "success" | "error" | "warning") => {
    Swal.fire({
      icon: type,
      title: type === "success" ? "Success!" : "Oops!",
      text,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleOtpBoxChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val && e.target.value !== "") return;
    const arr = otp.split("");
    while (arr.length < 6) arr.push("");
    arr[index] = val;
    setOtp(arr.join("").slice(0, 6));
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const sendOTP = async () => {
    if (mobile.length !== 10) {
      showMsg("Enter a valid 10-digit number", "error");
      return;
    }
    setIsLoading(true);
    try {
      const { data: user } = await axios.get(
        `${API_BASE}/registrations/phone/${mobile}`
      );
      if (!user) {
        showMsg("Account not found. Redirecting...", "error");
        setTimeout(() => navigate("/register"), 2000);
        return;
      }
      const res = await axios.post(`${API_BASE}/otp/send`, { phone: mobile });
      if (res.data.success) {
        setOtpSent(true);
        setCountdown(30);
        showMsg("OTP sent to your mobile!", "success");
        setTimeout(() => otpRefs.current[0]?.focus(), 500);
      } else showMsg("Failed to send OTP", "error");
    } catch (err: any) {
      if (err.response?.status === 404) {
        showMsg("Account not found. Please Register.", "error");
        setTimeout(() => navigate("/register"), 2000);
      } else showMsg("Network Error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      showMsg("Enter complete 6-digit OTP", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/otp/verify`, {
        phone: mobile,
        otp,
      });
      if (!res.data.success) {
        showMsg("Invalid OTP", "error");
        return;
      }
      const { token, user } = res.data;
      if (!user || !token) {
        showMsg("User not found", "error");
        return;
      }
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      window.dispatchEvent(new Event("storage"));
      showMsg("Login Successful!", "success");
      setTimeout(() => navigate("/"), 1000);
    } catch {
      showMsg("Verification failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/otp/send`, { phone: mobile });
      if (res.data.success) {
        setCountdown(30);
        showMsg("OTP Resent!", "success");
      }
    } catch {
      showMsg("Failed to resend", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="au-page">
      {/* ── Left Panel (Hero) ── */}
      <div className="au-left">
        <div className="au-logo-wrap">
          <div className="au-logo-icon">🧸</div>
          <div className="au-logo-text">Bafna Toys</div>
        </div>

        <div className="au-left-content">
          <div className="au-badge">Direct from Manufacturer</div>
          <h1 className="au-left-title">
            <span>India's Leading</span>
            <span>Toys Manufacturers</span>
          </h1>
          <p className="au-left-sub">
            Premium Wholesale Toys for Toy Stores, Supermarket, Retail Stores and Resellers.
          </p>

          <div className="au-features-grid">
            <div className="au-feature-card">
              <div className="au-f-icon"><Truck size={20} /></div>
              <div className="au-f-text">
                <strong>Free Delivery</strong>
                <span>Orders ₹3000+</span>
              </div>
            </div>
            <div className="au-feature-card">
              <div className="au-f-icon"><ShieldCheck size={20} /></div>
              <div className="au-f-text">
                <strong>BIS Certified</strong>
                <span>All Products Tested</span>
              </div>
            </div>
            <div className="au-feature-card">
              <div className="au-f-icon"><Package size={20} /></div>
              <div className="au-f-text">
                <strong>400+ Products</strong>
                <span>Wide Range of Toys</span>
              </div>
            </div>
            <div className="au-feature-card">
              <div className="au-f-icon"><Zap size={20} /></div>
              <div className="au-f-text">
                <strong>COD Available</strong>
                <span>Cash on Delivery</span>
              </div>
            </div>
            <div className="au-feature-card">
              <div className="au-f-icon"><MapPin size={20} /></div>
              <div className="au-f-text">
                <strong>Factory & Dispatch</strong>
                <span>Coimbatore, Tamil Nadu</span>
              </div>
            </div>
          </div>

          <div className="au-trust-pill">
            <Star size={14} fill="currentColor" />
            Trusted by 4,900+ Verified Retailers
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="au-right">
        <div className="au-form-card">
          {isLoading && (
            <div className="au-loading-overlay">
              <div className="au-spinner" />
            </div>
          )}

          <div className="au-card-header">
            <h2>Sign In</h2>
            <p>Access your wholesale business dashboard</p>
          </div>

          <div className="au-field">
            <label className="au-label">Mobile Number</label>
            <div className="au-input-container">
              <Smartphone size={18} className="au-i-icon" />
              <input
                className="au-input"
                type="tel"
                placeholder="10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={otpSent || isLoading}
                maxLength={10}
              />
            </div>
          </div>

          {!otpSent ? (
            <button
              className="au-submit-btn"
              onClick={sendOTP}
              disabled={mobile.length !== 10 || isLoading}
            >
              Get OTP <ArrowRight size={18} />
            </button>
          ) : (
            <div className="au-otp-wrap">
              <div className="au-otp-label">
                <Lock size={14} />
                <span>OTP sent to <strong>+91 {mobile}</strong></span>
              </div>

              <div className="au-otp-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="tel"
                    maxLength={1}
                    className="au-otp-box"
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpBoxChange(i, e)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={isLoading}
                  />
                ))}
              </div>

              <button
                className="au-submit-btn"
                onClick={verifyOTP}
                disabled={otp.length !== 6 || isLoading}
              >
                Verify & Login <ArrowRight size={18} />
              </button>

              <div className="au-resend" style={{ textAlign: 'center', marginTop: '16px' }}>
                {countdown > 0 ? (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Resend OTP in <strong>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    className="au-secondary-btn"
                    style={{ marginTop: 0, padding: '8px' }}
                    onClick={resendOTP}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                className="au-change-num"
                style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                onClick={() => { setOtpSent(false); setOtp(""); }}
              >
                ← Change Number
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--au-border)' }} />
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>New User?</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--au-border)' }} />
          </div>

          <Link to="/register" className="au-secondary-btn" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Create Business Account
          </Link>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', opacity: 0.6 }}>
             <ShieldCheck size={14} />
             <Lock size={14} />
             <Star size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginOTP;