import React, { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Register.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const Register: React.FC = () => {
  const [form, setForm] = useState({
    firmName: "",
    shopName: "",
    state: "",
    city: "",
    zip: "",
    otpMobile: "",
    whatsapp: "",
    visitingCard: null as File | null,
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate(); // ✅ for redirect

  // input handle
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "visitingCard" && files) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Send OTP
  const sendOtp = async () => {
    try {
      if (form.otpMobile.length !== 10) {
        alert("⚠️ Enter valid 10-digit mobile number");
        return;
      }
      const res = await axios.post(`${API_BASE}/otp/send`, { phone: form.otpMobile });
      if (res.data.success) {
        setOtpSent(true);
        alert("✅ OTP sent successfully!");
      }
    } catch (err: any) {
      console.error("OTP Error:", err.response?.data || err.message);
      alert("❌ Failed to send OTP");
    }
  };

  // Verify OTP + Register
  const verifyAndRegister = async () => {
    try {
      const verifyRes = await axios.post(`${API_BASE}/otp/verify`, {
        phone: form.otpMobile,
        otp,
      });

      if (!verifyRes.data.success) {
        alert("❌ Invalid OTP");
        return;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "visitingCard" && value instanceof File) {
          formData.append("visitingCard", value);
        } else {
          formData.append(key, value as string);
        }
      });

      const res = await axios.post(`${API_BASE}/registrations/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.message || "🎉 Registration successful!");

      // ✅ redirect to login page after successful registration
      navigate("/login");

    } catch (err: any) {
      console.error("Verify/Register Error:", err.response?.data || err.message);
      alert("❌ Something went wrong during registration");
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>

      <input name="firmName" placeholder="Firm Name" value={form.firmName} onChange={handleChange} />
      <input name="shopName" placeholder="Shop Name" value={form.shopName} onChange={handleChange} />
      <input name="state" placeholder="State" value={form.state} onChange={handleChange} />
      <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
      <input name="zip" placeholder="Zip Code" value={form.zip} onChange={handleChange} />
      <input name="otpMobile" placeholder="Enter Mobile (10 digits)" value={form.otpMobile} onChange={handleChange} type="tel" />
      <input name="whatsapp" placeholder="WhatsApp Number" value={form.whatsapp} onChange={handleChange} type="tel" />
      <input name="visitingCard" type="file" onChange={handleChange} />

      {!otpSent ? (
        <button onClick={sendOtp}>Send OTP</button>
      ) : (
        <>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="otp"
            type="text"
          />
          <button onClick={verifyAndRegister}>Verify & Register</button>
        </>
      )}

      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <span>Already registered? </span>
        <Link to="/login" style={{ textDecoration: "underline", color: "#007bff" }}>
          Login
        </Link>
      </div>
    </div>
  );
};
