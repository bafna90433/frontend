import React, { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; 
import "../styles/Register.css";

const RAW = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = RAW.endsWith("/api") ? RAW : `${RAW}/api`;

const Register: React.FC = () => {
  const [form, setForm] = useState({
    shopName: "",
    otpMobile: "",
    whatsapp: "",
    visitingCard: null as File | null,
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const normalizeTo10 = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.shopName.trim()) newErrors.shopName = "Shop Name is required";

    const phone = normalizeTo10(form.otpMobile);
    if (phone.length !== 10) newErrors.otpMobile = "Enter a valid 10-digit mobile number";

    if (!form.visitingCard) newErrors.visitingCard = "Visiting Card is required";
    else if (form.visitingCard.size > 5 * 1024 * 1024) {
      newErrors.visitingCard = "File size should be less than 5MB";
    } else if (!form.visitingCard.type.startsWith("image/")) {
      newErrors.visitingCard = "Please upload an image file";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "visitingCard" && files && files.length > 0) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
      if (errors.visitingCard) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.visitingCard;
          return newErrors;
        });
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errors[name as keyof typeof errors]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const sendOtp = async () => {
    if (!validateForm()) {
      Swal.fire("Warning", "⚠️ Please fix the errors before sending OTP", "warning");
      return;
    }
    try {
      const phone = normalizeTo10(form.otpMobile);
      if (phone.length !== 10) {
        Swal.fire("Error", "Enter a valid 10-digit mobile number", "error");
        return;
      }

      const res = await axios.post(`${API_BASE}/otp/send`, { phone });
      if (res.data?.success) {
        setOtpSent(true);
        Swal.fire("Success", "✅ OTP sent successfully! Check your SMS.", "success");
      } else {
        Swal.fire("Error", res.data?.message || "Failed to send OTP", "error");
      }
    } catch (err: any) {
      console.error("OTP Error:", err.response?.data || err.message);
      Swal.fire("Error", "❌ Failed to send OTP. Try again.", "error");
    }
  };

  const verifyAndRegister = async () => {
    if (!validateForm()) {
      Swal.fire("Warning", "⚠️ Please fix the errors before registering", "warning");
      return;
    }
    try {
      const phone = normalizeTo10(form.otpMobile);
      setLoading(true);

      const verifyRes = await axios.post(`${API_BASE}/otp/verify`, { phone, otp });
      if (!verifyRes.data?.success) {
        setLoading(false);
        Swal.fire("Error", "❌ Invalid OTP", "error");
        return;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "visitingCard" && value instanceof File) {
          formData.append("visitingCard", value);
        } else {
          formData.append(key, key === "otpMobile" ? phone : (value as string));
        }
      });

      const res = await axios.post(`${API_BASE}/registrations/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLoading(false);

      if (res.data?.alreadyRegistered || res.data?.message?.includes("already exists")) {
        Swal.fire("Notice", "⚠️ This mobile number is already registered. Please login.", "warning");
        navigate("/login");
        return;
      }

      Swal.fire(
        "Success",
        "🎉 Registration submitted! Your account will be approved by admin within 24 hours.",
        "success"
      );
      navigate("/login");
    } catch (err: any) {
      setLoading(false);
      console.error("Verify/Register Error:", err.response?.data || err.message);

      if (
        err.response?.data?.message?.includes("already exists") ||
        err.response?.data?.message?.includes("already registered")
      ) {
        Swal.fire("Notice", "⚠️ This mobile number is already registered. Please login.", "warning");
        navigate("/login");
        return;
      }

      Swal.fire("Error", "❌ This number is already registered with BafnaToys. Try logging in", "error");
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2>Register</h2>

        <input
          name="shopName"
          placeholder="Shop Name"
          value={form.shopName}
          onChange={handleChange}
        />
        {errors.shopName && <div className="error">{errors.shopName}</div>}

        <input
  name="otpMobile"
  placeholder="Enter your 10-digit mobile number to receive OTP"
  value={form.otpMobile}
  onChange={handleChange}
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={10}
/>

<input
  name="whatsapp"
  placeholder="Enter your WhatsApp number for more details"
  value={form.whatsapp}
  onChange={handleChange}
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={10}
/>


        <div className="file-input-container">
          <label>Visiting Card (Required) *</label>
          <input name="visitingCard" type="file" onChange={handleChange} accept="image/*" />
          {errors.visitingCard && <div className="error">{errors.visitingCard}</div>}
        </div>

        {!otpSent ? (
          <button onClick={sendOtp}>Send OTP</button>
        ) : (
          <>
         {/* ✅ 6 Separate OTP Boxes */}
<div className="otp-box-container">
  {Array.from({ length: 6 }).map((_, i) => (
    <input
      key={i}
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={1}
      className="otp-box"
      value={otp[i] || ""}
      autoFocus={i === 0}
      onChange={(e) => {
        const val = e.target.value.replace(/\D/g, "");
        if (!val && i > 0) {
          const boxes = document.querySelectorAll<HTMLInputElement>(".otp-box");
          boxes[i - 1].focus();
        } else if (val && i < 5) {
          const boxes = document.querySelectorAll<HTMLInputElement>(".otp-box");
          boxes[i + 1].focus();
        }

        const newOtp = otp.split("");
        newOtp[i] = val;
        setOtp(newOtp.join(""));
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) {
          const boxes = document.querySelectorAll<HTMLInputElement>(".otp-box");
          boxes[i - 1].focus();
        }
      }}
    />
  ))}
</div>

            <button onClick={verifyAndRegister}>Verify & Register</button>
          </>
        )}

        {/* ✅ Bottom text */}
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <span>Already have an account? </span>
          <Link to="/login" style={{ textDecoration: "underline", color: "#007bff", fontWeight: 600 }}>
            Login Now
          </Link>
        </div>

        {loading && (
          <div className="loader-overlay">
            <div className="loader"></div>
            <p>⏳ Please wait, verifying & submitting registration...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
