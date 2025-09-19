import React, { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const normalizeTo10 = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firmName.trim()) newErrors.firmName = "Firm Name is required";
    if (!form.shopName.trim()) newErrors.shopName = "Shop Name is required";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.zip.trim()) newErrors.zip = "Pin Code is required";

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

      Swal.fire("Error", "❌ Registration failed. Please try again later.", "error");
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>

      <input name="firmName" placeholder="Firm Name" value={form.firmName} onChange={handleChange} />
      {errors.firmName && <div className="error">{errors.firmName}</div>}

      <input name="shopName" placeholder="Shop Name" value={form.shopName} onChange={handleChange} />
      {errors.shopName && <div className="error">{errors.shopName}</div>}

      <input name="state" placeholder="State" value={form.state} onChange={handleChange} />
      {errors.state && <div className="error">{errors.state}</div>}

      <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
      {errors.city && <div className="error">{errors.city}</div>}

      <input name="zip" placeholder="Pin Code" value={form.zip} onChange={handleChange} />
      {errors.zip && <div className="error">{errors.zip}</div>}

      <input
        name="otpMobile"
        placeholder="Enter Mobile (10 digits)"
        value={form.otpMobile}
        onChange={handleChange}
        type="tel"
      />
      {errors.otpMobile && <div className="error">{errors.otpMobile}</div>}

      <input
        name="whatsapp"
        placeholder="WhatsApp Number"
        value={form.whatsapp}
        onChange={handleChange}
        type="tel"
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
