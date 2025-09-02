import React, { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Register.css";

/** Build API base robustly:
 * - If VITE_API_URL ends with /api, don't add another /api
 * - If it doesn't, append /api
 * - Trim trailing slashes
 */
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
  const navigate = useNavigate();

  // Normalize to last 10 digits (handles +91, spaces, dashes, leading 0)
  const normalizeTo10 = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  // input handle
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "visitingCard" && files && files.length > 0) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Send OTP
  const sendOtp = async () => {
    try {
      const phone = normalizeTo10(form.otpMobile);
      if (phone.length !== 10) {
        alert("⚠️ Enter a valid 10-digit mobile number (you can omit +91/0).");
        return;
      }

      console.log("Calling OTP send:", `${API_BASE}/otp/send`, { phone });

      const res = await axios.post(`${API_BASE}/otp/send`, { phone });
      console.log("OTP send response:", res.status, res.data);

      if (res.data && res.data.success) {
        setOtpSent(true);
        // Dev helper: server may return OTP if RETURN_OTP_IN_RESPONSE=true
        if (res.data.otp) {
          console.log("DEV OTP:", res.data.otp);
          alert(`✅ OTP sent (dev). OTP: ${res.data.otp}`);
        } else {
          alert("✅ OTP sent successfully! Check your SMS.");
        }
      } else {
        alert("❌ Failed to send OTP: " + (res.data?.message || "unknown error"));
      }
    } catch (err: any) {
      console.error("OTP Error:", err.response?.data || err.message);
      const msg = err.response?.data?.message || err.response?.data || err.message;
      alert("❌ Failed to send OTP: " + String(msg));
    }
  };

  // Verify OTP + Register
  const verifyAndRegister = async () => {
    try {
      const phone = normalizeTo10(form.otpMobile);

      // verify first
      const verifyRes = await axios.post(`${API_BASE}/otp/verify`, {
        phone,
        otp,
      });

      console.log("OTP verify response:", verifyRes.status, verifyRes.data);

      if (!verifyRes.data?.success) {
        alert("❌ Invalid OTP");
        return;
      }

      // build form data
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

      console.log("Register response:", res.status, res.data);

      alert(res.data.message || "🎉 Registration successful!");
      navigate("/login");
    } catch (err: any) {
      console.error("Verify/Register Error:", err.response?.data || err.message);
      alert("❌ Something went wrong during registration: " + String(err.response?.data?.message || err.message));
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
