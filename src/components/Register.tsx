// src/components/Register.tsx
import React, { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Register.css";

// API base that works whether VITE_API_URL has /api or not
const rawBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
const cleaned = rawBase.replace(/\/+$/, "");
const API_BASE = cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;

const normalizePhone = (s = "") => String(s).replace(/\D/g, "").slice(-10);

const Register: React.FC = () => {
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "visitingCard" && files) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const checkExisting = async (phone: string) => {
    try {
      const res = await axios.get(`${API_BASE}/registrations/phone/${encodeURIComponent(phone)}`);
      return { exists: true, user: res.data };
    } catch (err: any) {
      if (err.response?.status === 404) return { exists: false };
      throw err;
    }
  };

  const sendOtp = async () => {
    try {
      const phone = normalizePhone(form.otpMobile);
      if (phone.length !== 10) {
        alert("Enter a valid 10-digit mobile number");
        return;
      }

      const check = await checkExisting(phone);
      if (check.exists) {
        if (confirm("This mobile number is already registered. Go to Login?")) {
          navigate("/login");
        }
        return;
      }

      const res = await axios.post(`${API_BASE}/otp/send`, { phone });
      console.log("OTP send:", res.data);
      setOtpSent(true);
      alert(res.data?.message || "OTP sent");
      if (res.data?.otp) console.log("DEV OTP:", res.data.otp); // visible only if backend returns it in dev
    } catch (err: any) {
      console.error("OTP Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to send OTP. Please try again.");
    }
  };

  const verifyAndRegister = async () => {
    try {
      const phone = normalizePhone(form.otpMobile);
      if (phone.length !== 10) {
        alert("Invalid phone number");
        return;
      }

      const verifyRes = await axios.post(`${API_BASE}/otp/verify`, { phone, otp });
      console.log("OTP verify:", verifyRes.data);
      if (!verifyRes.data?.success) {
        alert(verifyRes.data?.message || "Invalid OTP");
        return;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "visitingCard" && value instanceof File) {
          formData.append("visitingCard", value);
        } else if (key === "otpMobile") {
          formData.append("otpMobile", phone);
        } else if (key === "whatsapp") {
          formData.append("whatsapp", normalizePhone(value as string));
        } else {
          formData.append(key, value as string);
        }
      });

      const res = await axios.post(`${API_BASE}/registrations/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Register:", res.data);
      alert(res.data?.message || "Registration successful!");
      navigate("/login");
    } catch (err: any) {
      console.error("Verify/Register Error:", err.response?.data || err.message);

      if (err.response?.status === 409) {
        alert(err.response.data?.message || "This mobile is already registered.");
        if (confirm("Go to Login?")) navigate("/login");
        return;
      }
      if (err.response?.status === 400 && err.response.data?.message) {
        alert(err.response.data.message);
        return;
      }
      alert("Something went wrong during registration. Please try again.");
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
    </div>
  );
};

export default Register;
