import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Smartphone, ArrowRight, ShieldCheck, LayoutDashboard } from "lucide-react";
import "../styles/AuthStyles.css"; // ✅ Connects to the shared CSS file

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LoginOTP: React.FC = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(""); // Stores full 6-digit string
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // ✅ Refs for 6-digit OTP boxes
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const showMessage = (text: string, type: "success" | "error" | "warning") => {
    Swal.fire({
      icon: type,
      title: type === "success" ? "Success!" : type === "error" ? "Error" : "Notice",
      text,
      timer: 2000,
      showConfirmButton: false
    });
  };

  // ✅ Handler for 6-Digit OTP Box
  const handleOtpBoxChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val && e.target.value !== "") return;

    // Current OTP string to Array
    const currentOtp = otp.split("");
    while (currentOtp.length < 6) currentOtp.push(""); // Ensure length
    
    currentOtp[index] = val; // Update specific index
    const newOtpStr = currentOtp.join("").slice(0, 6);
    setOtp(newOtpStr);

    // Auto Focus Next
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const sendOTP = async () => {
    if (mobile.length !== 10) {
      showMessage("Enter a valid 10-digit number", "error");
      return;
    }
    setIsLoading(true);
    try {
      const { data: user } = await axios.get(`${API_BASE}/registrations/phone/${mobile}`);
      
      if (!user) {
        showMessage("Account not found. Redirecting to Register...", "error");
        setTimeout(() => navigate("/register"), 2000);
        return;
      }

      const res = await axios.post(`${API_BASE}/otp/send`, { phone: mobile });
      if (res.data.success) {
        setOtpSent(true);
        setCountdown(30);
        showMessage("OTP sent successfully!", "success");
        // Focus first OTP box after slight delay
        setTimeout(() => otpRefs.current[0]?.focus(), 500);
      } else {
        showMessage("Failed to send OTP", "error");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        showMessage("Account not found. Please Register.", "error");
        setTimeout(() => navigate("/register"), 2000);
      } else {
        showMessage("Network Error. Try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      showMessage("Please enter complete 6-digit OTP", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/otp/verify`, { phone: mobile, otp });
      if (!res.data.success) {
        showMessage("Invalid OTP code", "error");
        return;
      }

      const { data: user } = await axios.get(`${API_BASE}/registrations/phone/${mobile}`);
      if (!user) {
        showMessage("User profile not found", "error");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "otp-session-token");
      window.dispatchEvent(new Event("storage"));
      
      showMessage("Login Successful! Redirecting...", "success");
      setTimeout(() => navigate("/"), 1500);

    } catch (err: any) {
      showMessage("Verification failed. Try again.", "error");
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
        showMessage("OTP Resent!", "success");
      }
    } catch {
      showMessage("Failed to resend OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* LEFT SIDE - BRANDING */}
      <div className="auth-brand">
        <div className="brand-content">
          <div className="brand-header">
            <LayoutDashboard size={32} color="#fff" />
            <h1>ShopPartner</h1>
          </div>
          <h2>Welcome Back!</h2>
          <p>Login to access your dashboard, manage inventory, and track your sales.</p>
          <div className="brand-badges">
            <span className="brand-badge"><ShieldCheck size={16}/> Secure Login</span>
          </div>
        </div>
        <div className="circle c1"></div>
        <div className="circle c2"></div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="auth-form-container">
        <div className="auth-card">
          <div className="form-head">
            <h3>Sign In</h3>
            <p>Enter your mobile number to continue.</p>
          </div>

          {/* Mobile Input */}
          <div className="form-group">
            <label>Mobile Number</label>
            <div className="input-wrapper">
              <Smartphone size={18} className="input-icon" />
              <input
                className="auth-input"
                type="tel"
                placeholder="10-digit Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={otpSent || isLoading}
                maxLength={10}
              />
            </div>
          </div>

          {/* OTP Input Section or Send Button */}
          {!otpSent ? (
             <button className="auth-btn" onClick={sendOTP} disabled={mobile.length !== 10 || isLoading}>
               {isLoading ? "Checking..." : "Get OTP"} <ArrowRight size={18} />
             </button>
          ) : (
            <div className="otp-area">
              <label>Enter 6-digit OTP</label>
              <div className="otp-inputs">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="tel"
                    maxLength={1}
                    className="otp-digit"
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpBoxChange(i, e)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={isLoading}
                  />
                ))}
              </div>
              
              <button className="auth-btn verify" onClick={verifyOTP} disabled={otp.length !== 6 || isLoading}>
                {isLoading ? "Verifying..." : "Verify & Login"}
              </button>

              <div className="auth-link" style={{ marginTop: "15px" }}>
                 {countdown > 0 ? (
                   <span style={{ color: "#6B7280" }}>Resend in {countdown}s</span>
                 ) : (
                   <button 
                     onClick={resendOTP} 
                     disabled={isLoading}
                     style={{ background: "none", border: "none", color: "#4F46E5", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                   >
                     Resend OTP
                   </button>
                 )}
              </div>
            </div>
          )}

          <div className="auth-link">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
      
      {/* Loader */}
      {isLoading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default LoginOTP;