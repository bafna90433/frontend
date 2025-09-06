import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/LoginOTP.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const LoginOTP: React.FC = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  // 🔹 Step 1: Check registration & send OTP only if valid user
  const sendOTP = async () => {
    try {
      if (mobile.length !== 10) {
        alert("Enter valid 10-digit number");
        return;
      }

      // Check if user exists
      const { data: user } = await axios.get(`${API_BASE}/registrations/phone/${mobile}`);
      if (!user) {
        alert("❌ Not registered, please register first.");
        navigate("/register");
        return;
      }

      if (!user.isApproved) {
        alert("⚠️ Your account is pending approval.");
        return;
      }

      // If registered & approved → send OTP
      const res = await axios.post(`${API_BASE}/otp/send`, { phone: mobile });
      if (res.data.success) {
        setOtpSent(true);
        alert("✅ OTP sent!");
      } else {
        alert("❌ Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Not registered, please register first");
    }
  };

  // 🔹 Step 2: Verify OTP
  const verifyOTP = async () => {
    try {
      const res = await axios.post(`${API_BASE}/otp/verify`, { phone: mobile, otp });
      if (!res.data.success) {
        alert("❌ Invalid OTP");
        return;
      }

      // Fetch user details (already confirmed registered in sendOTP, but double-check)
      const { data: user } = await axios.get(`${API_BASE}/registrations/phone/${mobile}`);
      if (!user) {
        alert("❌ Not registered, please register first.");
        navigate("/register");
        return;
      }
      if (!user.isApproved) {
        alert("⚠️ Your account is pending approval.");
        return;
      }

      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "otp");
      window.dispatchEvent(new Event("storage"));

      navigate("/my-account");
    } catch (err) {
      console.error(err);
      alert("❌ OTP verification failed");
    }
  };

  return (
    <div className="login-otp-container">
      <h2>Login with OTP</h2>

      <input
        type="text"
        placeholder="Enter Mobile"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      {!otpSent ? (
        <button onClick={sendOTP}>Send OTP</button>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOTP}>Verify & Login</button>
        </>
      )}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <span>New here? </span>
        <Link to="/register" style={{ textDecoration: "underline", color: "#007bff" }}>
          Register
        </Link>
      </div>
    </div>
  );
};

export default LoginOTP;
