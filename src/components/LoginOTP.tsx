import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Smartphone, ArrowRight, ShieldCheck, Lock, CheckCircle,
  Zap, Truck, Award, Star, Package,
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
      const { data: user } = await axios.get(
        `${API_BASE}/registrations/phone/${mobile}`
      );
      if (!user) {
        showMsg("User not found", "error");
        return;
      }
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "otp-session-token");
      window.dispatchEvent(new Event("storage"));
      showMsg("Login Successful!", "success");
      setTimeout(() => navigate("/"), 1500);
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
      {/* ── Left Panel (Sticky) ── */}
      <div className="au-left">
        <div className="au-left-inner">
          <div className="au-logo">🧸 Bafna Toys</div>
          <h1 className="au-left-title">
            Welcome <span>Back!</span>
          </h1>
          <p className="au-left-sub">
            Login to access your wholesale dashboard, manage orders, and track
            shipments in real-time.
          </p>

          <div className="au-features">
            <div className="au-feature">
              <div className="au-feature-icon">
                <Zap size={18} />
              </div>
              <div>
                <strong>Instant Access</strong>
                <span>OTP-based secure login</span>
              </div>
            </div>
            <div className="au-feature">
              <div className="au-feature-icon">
                <Package size={18} />
              </div>
              <div>
                <strong>400+ Products</strong>
                <span>Huge toy catalog</span>
              </div>
            </div>
            <div className="au-feature">
              <div className="au-feature-icon">
                <Truck size={18} />
              </div>
              <div>
                <strong>All India Delivery</strong>
                <span>Fast & reliable shipping</span>
              </div>
            </div>
            <div className="au-feature">
              <div className="au-feature-icon">
                <Award size={18} />
              </div>
              <div>
                <strong>Best Prices</strong>
                <span>Direct from manufacturer</span>
              </div>
            </div>
          </div>

          <div className="au-left-trust">
            <ShieldCheck size={14} /> Trusted by 4,900+ Retailers
          </div>
        </div>
        <div className="au-left-deco au-left-deco--1" />
        <div className="au-left-deco au-left-deco--2" />
      </div>

      {/* ── Right Panel ── */}
      <div className="au-right">
        <div className="au-card">
          <div className="au-card-head">
            <h2>Sign In</h2>
            <p>Enter your registered mobile number to continue</p>
          </div>

          {/* Mobile Input */}
          <div className="au-field">
            <label>Mobile Number</label>
            <div className="au-input-wrap">
              <Smartphone size={18} className="au-input-icon" />
              <input
                className="au-input"
                type="tel"
                placeholder="Enter 10-digit mobile"
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                disabled={otpSent || isLoading}
                maxLength={10}
              />
              {mobile.length === 10 && !otpSent && (
                <CheckCircle size={16} className="au-input-check" />
              )}
            </div>
          </div>

          {!otpSent ? (
            <button
              className="au-btn au-btn--primary"
              onClick={sendOTP}
              disabled={mobile.length !== 10 || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="au-spin" /> Sending...
                </>
              ) : (
                <>
                  Get OTP <ArrowRight size={16} />
                </>
              )}
            </button>
          ) : (
            <div className="au-otp-section">
              <div className="au-otp-label">
                <Lock size={14} />
                <span>
                  Enter 6-digit OTP sent to <strong>+91 {mobile}</strong>
                </span>
              </div>

              <div className="au-otp-boxes">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="tel"
                    maxLength={1}
                    className={`au-otp-digit ${
                      otp[i] ? "au-otp-digit--filled" : ""
                    }`}
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpBoxChange(i, e)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={isLoading}
                  />
                ))}
              </div>

              <button
                className="au-btn au-btn--success"
                onClick={verifyOTP}
                disabled={otp.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="au-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Verify & Login <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="au-resend">
                {countdown > 0 ? (
                  <span className="au-resend-timer">
                    Resend OTP in <strong>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    className="au-resend-btn"
                    onClick={resendOTP}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                className="au-change-num"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                }}
              >
                ← Change Number
              </button>
            </div>
          )}

          <div className="au-divider">
            <span>New to Bafna Toys?</span>
          </div>

          <Link to="/register" className="au-btn au-btn--outline">
            Create Business Account <ArrowRight size={16} />
          </Link>

          <div className="au-footer-trust">
            <span>
              <ShieldCheck size={12} /> 256-bit Secure
            </span>
            <span>
              <Lock size={12} /> OTP Verified
            </span>
            <span>
              <Star size={12} /> 4.8★ Rated
            </span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="au-loader">
          <div className="au-spin-lg" />
        </div>
      )}
    </div>
  );
};

export default LoginOTP;