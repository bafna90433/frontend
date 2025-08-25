import React, { useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { auth, setupRecaptcha } from "../firebase";
import { signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import "../styles/Register.css";

// ✅ Use only env variable, no localhost fallback in prod
const API_BASE = import.meta.env.VITE_API_URL;

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
  const [confirmation, setConfirmation] =
    useState<ConfirmationResult | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "visitingCard" && files) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Normalize to E.164 (+91XXXXXXXXXX)
  const normalizeMobile = (m: string) =>
    m.trim().replace(/^\+91/, "").replace(/\D/g, "");

  const sendOtp = async () => {
    try {
      const raw = normalizeMobile(form.otpMobile);
      if (raw.length !== 10) {
        alert("Please enter a valid 10-digit number");
        return;
      }
      const fullNumber = `+91${raw}`;

      const recaptcha = setupRecaptcha("recaptcha-container");
      const result = await signInWithPhoneNumber(auth, fullNumber, recaptcha);

      setConfirmation(result);
      setOtpSent(true);
      alert("OTP has been sent.");
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP.");
    }
  };

  const verifyAndRegister = async () => {
    if (!confirmation) return;

    try {
      await confirmation.confirm(otp);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "visitingCard" && value instanceof File) {
          formData.append("visitingCard", value);
        } else {
          formData.append(key, value as string);
        }
      });

      const res = await axios.post(`${API_BASE}/api/auth/register`, formData);
      alert(res.data.msg || "Registration successful.");
    } catch (err) {
      console.error(err);
      alert("Invalid OTP.");
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>

      <input
        name="firmName"
        placeholder="Firm Name"
        value={form.firmName}
        onChange={handleChange}
        type="text"
      />
      <input
        name="shopName"
        placeholder="Shop Name"
        value={form.shopName}
        onChange={handleChange}
        type="text"
      />
      <input
        name="state"
        placeholder="State"
        value={form.state}
        onChange={handleChange}
        type="text"
      />
      <input
        name="city"
        placeholder="City"
        value={form.city}
        onChange={handleChange}
        type="text"
      />
      <input
        name="zip"
        placeholder="Zip Code"
        value={form.zip}
        onChange={handleChange}
        type="text"
      />
      <input
        name="otpMobile"
        placeholder="Mobile (10 digits)"
        value={form.otpMobile}
        onChange={handleChange}
        type="tel"
      />
      <input
        name="whatsapp"
        placeholder="WhatsApp Number"
        value={form.whatsapp}
        onChange={handleChange}
        type="tel"
      />
      <input name="visitingCard" type="file" onChange={handleChange} />

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
