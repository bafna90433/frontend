// src/components/Register.tsx
import React, { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Register.css";

// Ensure API_BASE always points to the backend /api root (no double slashes)
const rawBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = rawBase.replace(/\/$/, "") + "/api";

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
  const navigate = useNavigate();

  // Normalize phone to last 10 digits
  const normalizePhone = (s = "") => String(s).replace(/\D/g, "").slice(-10);

  // input handle
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "visitingCard" && files) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // helper: check if phone already registered (uses normalized phone)
  const checkExisting = async (phone: string) => {
    try {
      const res = await axios.get(`${API_BASE}/registrations/phone/${encodeURIComponent(phone)}`);
      return { exists: true, user: res.data };
    } catch (err: any) {
      if (err.response?.status === 404) return { exists: false };
      // bubble up other errors
      throw err;
    }
  };

  // Send OTP (first check if already registered)
  const sendOtp = async () => {
    try {
      const phone = normalizePhone(form.otpMobile);
      if (phone.length !== 10) {
        alert("⚠️ Enter valid 10-digit mobile number");
        return;
      }

      // Check existing registration
      try {
        const check = await checkExisting(phone);
        if (check.exists) {
          const doLogin = confirm("This mobile number is already registered. Do you want to go to Login?");
          if (doLogin) navigate("/login");
          return;
        }
      } catch (err: any) {
        // Non-404 error from checkExisting → show & stop
        console.error("Check existing user error:", err.response?.data || err.message);
        alert("Failed to check existing registration. Try again.");
        return;
      }

      // Not registered -> send OTP
      const res = await axios.post(`${API_BASE}/otp/send`, { phone });
      console.log("OTP send response:", res.data);
      if (res.data?.success) {
        setOtpSent(true);
        // dev helper: log otp if backend returns it (only enable in dev)
        if (res.data.otp) console.log("DEV OTP:", res.data.otp);
        alert("✅ OTP sent successfully!");
      } else {
        alert(res.data?.message || "✅ OTP request sent (check logs).");
        setOtpSent(true);
      }
    } catch (err: any) {
      console.error("OTP Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "❌ Failed to send OTP. Please try again or contact support.");
    }
  };

  // Verify OTP + Register
  const verifyAndRegister = async () => {
    try {
      const phone = normalizePhone(form.otpMobile);
      if (phone.length !== 10) {
        alert("⚠️ Invalid phone number");
        return;
      }

      // verify OTP first
      const verifyRes = await axios.post(`${API_BASE}/otp/verify`, { phone, otp });
      console.log("OTP verify response:", verifyRes.data);
      if (!verifyRes.data?.success) {
        alert(verifyRes.data?.message || "❌ Invalid OTP");
        return;
      }

      // Build FormData for registration (file upload)
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "visitingCard" && value instanceof File) {
          formData.append("visitingCard", value);
        } else {
          // normalize phone fields before submitting
          if (key === "otpMobile") formData.append("otpMobile", phone);
          else if (key === "whatsapp") formData.append("whatsapp", normalizePhone(value as string));
          else formData.append(key, value as string);
        }
      });

      // call register endpoint
      const res = await axios.post(`${API_BASE}/registrations/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Register response:", res.data);
      alert(res.data?.message || "🎉 Registration successful!");
      navigate("/login");
    } catch (err: any) {
      console.error("Verify/Register Error:", err.response?.data || err.message);

      // If backend returns 409 (duplicate), show a specific message
      if (err.response?.status === 409) {
        alert(err.response.data?.message || "This mobile is already registered.");
        const goLogin = confirm("Mobile already registered. Go to Login?");
        if (goLogin) navigate("/login");
        return;
      }

      // OTP verify endpoint might return 400 for invalid/expired OTP
      if (err.response?.status === 400 && err.response.data?.message) {
        alert(err.response.data.message);
        return;
      }

      // generic fallback
      alert("❌ Something went wrong during registration. Please try again.");
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
          <input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="otp" type="text" />
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

export default Register;
