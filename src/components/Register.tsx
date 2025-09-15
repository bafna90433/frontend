import React, { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Register.css";

const RAW = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = RAW.endsWith("/api") ? RAW : `${RAW}/api`;

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
  const [loading, setLoading] = useState(false); // ✅ loader state
  const navigate = useNavigate();

  const normalizeTo10 = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "visitingCard" && files && files.length > 0) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const sendOtp = async () => {
    try {
      const phone = normalizeTo10(form.otpMobile);
      if (phone.length !== 10) {
        alert("⚠️ Enter a valid 10-digit mobile number.");
        return;
      }

      const res = await axios.post(`${API_BASE}/otp/send`, { phone });
      if (res.data && res.data.success) {
        setOtpSent(true);
        alert("✅ OTP sent successfully! Check your SMS.");
      } else {
        alert("❌ Failed to send OTP: " + (res.data?.message || "unknown error"));
      }
    } catch (err: any) {
      console.error("OTP Error:", err.response?.data || err.message);
      alert("❌ Failed to send OTP. Try again.");
    }
  };

  const verifyAndRegister = async () => {
    try {
      const phone = normalizeTo10(form.otpMobile);
      setLoading(true); // ✅ show loader

      // Verify OTP
      const verifyRes = await axios.post(`${API_BASE}/otp/verify`, { phone, otp });
      if (!verifyRes.data?.success) {
        setLoading(false);
        alert("❌ Invalid OTP");
        return;
      }

      // Build formData
      const formData = new FormData();
      (Object.entries(form) as [string, any][]).forEach(([key, value]) => {
        if (key === "visitingCard" && value instanceof File) {
          formData.append("visitingCard", value);
        } else {
          if (key === "otpMobile") formData.append("otpMobile", phone);
          else formData.append(key, value as string);
        }
      });

      const res = await axios.post(`${API_BASE}/registrations/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLoading(false); // ✅ hide loader

      if (
        res.data?.alreadyRegistered ||
        res.data?.message?.includes("already exists")
      ) {
        alert("⚠️ This mobile number is already registered. Please login.");
        navigate("/login");
        return;
      }

      alert("🎉 Registration submitted! Your account will be approved by admin within 24 hours.");
      navigate("/login");
    } catch (err: any) {
      setLoading(false); // ✅ hide loader
      console.error("Verify/Register Error:", err.response?.data || err.message);

      if (
        err.response?.data?.message?.includes("already exists") ||
        err.response?.data?.message?.includes("already registered")
      ) {
        alert("⚠️ This mobile number is already registered. Please login.");
        navigate("/login");
        return;
      }

      alert("❌ Registration failed. Please try again later.");
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
      <input
        name="otpMobile"
        placeholder="Enter Mobile (10 digits)"
        value={form.otpMobile}
        onChange={handleChange}
        type="tel"
      />
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

      {/* ✅ Loader Overlay */}
      {loading && (
        <div className="loader-overlay">
          <div className="loader"></div>
          <p>⏳ Please wait, verifying & submitting registration...</p>
        </div>
      )}
    </div>
  );
};

export default Register;