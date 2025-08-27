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

  const sendOTP = async () => {
    try {
      if (mobile.length !== 10) return alert("Enter valid 10-digit number");
      const res = await axios.post(`${API_BASE}/otp/send`, { phone: mobile });
      if (res.data.success) {
        setOtpSent(true);
        alert("✅ OTP sent!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send OTP");
    }
  };

  const verifyOTP = async () => {
    try {
      const res = await axios.post(`${API_BASE}/otp/verify`, { phone: mobile, otp });
      if (!res.data.success) {
        alert("❌ Invalid OTP");
        return;
      }

      // fetch user details
      const { data: user } = await axios.get(`${API_BASE}/registrations/phone/${mobile}`);
      if (!user) {
        alert("Not registered, please register first.");
        navigate("/register");
        return;
      }
      if (!user.isApproved) {
        alert("Your account is pending approval.");
        return;
      }

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

      <input type="text" placeholder="Enter Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />

      {!otpSent ? (
        <button onClick={sendOTP}>Send OTP</button>
      ) : (
        <>
          <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button onClick={verifyOTP}>Verify & Login</button>
        </>
      )}

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <span>New here? </span>
        <Link to="/register" style={{ textDecoration: "underline", color: "#007bff" }}>Register</Link>
      </div>
    </div>
  );
};

export default LoginOTP;
