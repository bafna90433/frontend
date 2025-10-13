import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; 
import { FiSmartphone, FiLock, FiUserPlus } from "react-icons/fi";
import "../styles/LoginOTP.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LoginOTP: React.FC = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
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
      confirmButtonColor: type === "success" ? "#16a34a" : type === "error" ? "#ef4444" : "#f59e0b",
      confirmButtonText: "OK",
    });
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
        showMessage("Not registered, please register first", "error");
        setTimeout(() => navigate("/register"), 2000);
        return;
      }
      if (!user.isApproved) {
        showMessage("Your account is pending approval", "warning");
        return;
      }
      const res = await axios.post(`${API_BASE}/otp/send`, { phone: mobile });
      if (res.data.success) {
        setOtpSent(true);
        setCountdown(30);
        showMessage("OTP sent to your mobile", "success");
        setTimeout(() => {
          const otpInput = document.getElementById("otp");
          otpInput?.focus();
        }, 500);
      } else {
        showMessage("Failed to send OTP", "error");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        showMessage("Not registered, please register first", "error");
        setTimeout(() => navigate("/register"), 2000);
      } else {
        showMessage("Failed to send OTP. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      showMessage("Please enter 6-digit OTP", "error");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/otp/verify`, { phone: mobile, otp });
      if (!res.data.success) {
        showMessage("Invalid OTP", "error");
        return;
      }
      const { data: user } = await axios.get(`${API_BASE}/registrations/phone/${mobile}`);
      if (!user) {
        showMessage("User not found", "error");
        return;
      }
      if (!user.isApproved) {
        showMessage("Your account is pending approval", "warning");
        return;
      }
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "otp");
      window.dispatchEvent(new Event("storage"));
      showMessage("Login successful! Redirecting...", "success");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      if (err.response?.status === 400) {
        showMessage("Invalid OTP", "error");
      } else {
        showMessage("OTP verification failed", "error");
      }
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
        showMessage("OTP resent successfully", "success");
      } else {
        showMessage("Failed to resend OTP", "error");
      }
    } catch {
      showMessage("Failed to resend OTP", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-otp-page">
      <div className="login-otp-container">
        <div className="login-header">
          <div className="logo">
            <FiSmartphone size={32} />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in with your mobile number</p>
        </div>

        {/* Mobile Input */}
        <div className="input-group">
          <label htmlFor="mobile">Mobile Number</label>
          <div className="input-with-icon">
            <FiSmartphone className="input-icon" />
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter 10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              disabled={otpSent || isLoading}
              maxLength={10}
              autoFocus
            />
          </div>
        </div>

        {/* OTP Input */}
        {otpSent && (
          <div className="input-group">
            <label htmlFor="otp">Enter OTP</label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                id="otp"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={isLoading}
                maxLength={6}
              />
            </div>
            <div className="otp-resend">
              <span>Didn't receive code? </span>
              {countdown > 0 ? (
                <span className="countdown">Resend in {countdown}s</span>
              ) : (
                <button className="resend-button" onClick={resendOTP} disabled={isLoading}>
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          {!otpSent ? (
            <button className="primary-button" onClick={sendOTP} disabled={mobile.length !== 10 || isLoading}>
              {isLoading ? "Sending..." : "Send OTP"}
            </button>
          ) : (
            <button className="primary-button" onClick={verifyOTP} disabled={otp.length !== 6 || isLoading}>
              {isLoading ? "Verifying..." : "Verify & Login"}
            </button>
          )}
        </div>

        {/* Register Link */}
        <Link to="/register" className="register-link">
          <FiUserPlus size={18} />
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default LoginOTP;
