import React, { useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { auth, setupRecaptcha } from "../firebase";
import { signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import "../styles/Register.css";

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
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "visitingCard" && files) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Normalize phone number to E.164 format
  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
    if (raw.startsWith("+")) return raw;
    return "";
  };

  // Send OTP
  const sendOtp = async () => {
    try {
      const phone = normalizePhone(form.otpMobile);
      if (!phone) {
        alert("Enter valid phone number");
        return;
      }

      // Setup recaptcha
      const recaptcha = setupRecaptcha("recaptcha-container");

      // Send OTP
      const result = await signInWithPhoneNumber(auth, phone, recaptcha);
      setConfirmation(result);
      setOtpSent(true);

      alert("OTP sent to " + phone);
    } catch (err: any) {
      console.error("OTP Error:", err);
      alert("Failed to send OTP: " + (err.message || "Unknown error"));
    }
  };

  // Verify OTP & Register
  const verifyAndRegister = async () => {
    if (!confirmation) {
      alert("No OTP session found.");
      return;
    }
    try {
      await confirmation.confirm(otp.trim());

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "visitingCard" && value instanceof File) {
          formData.append("visitingCard", value);
        } else {
          formData.append(key, value as string);
        }
      });

      const res = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.msg || "Registration successful ✅");
    } catch (err: any) {
      console.error("Verify/Register Error:", err);
      alert("Invalid OTP: " + (err.message || "Unknown error"));
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
      <input name="otpMobile" placeholder="+91XXXXXXXXXX" value={form.otpMobile} onChange={handleChange} />
      <input name="whatsapp" placeholder="WhatsApp Number" value={form.whatsapp} onChange={handleChange} />
      <input name="visitingCard" type="file" onChange={handleChange} />

      {/* Recaptcha */}
      <div id="recaptcha-container" style={{ marginBottom: "12px" }}></div>

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
