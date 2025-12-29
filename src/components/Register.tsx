// src/components/Register.tsx
import React, { useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; 
import "../styles/Register.css";

const RAW = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = RAW.endsWith("/api") ? RAW : `${RAW}/api`;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const Register: React.FC = () => {
  // ✅ 1. Main Form State
  const [form, setForm] = useState({
    shopName: "",
    otpMobile: "",
    whatsapp: "",
    visitingCard: null as File | null,
  });

  // ✅ 2. Separate State for Address Fields
  const [addr, setAddr] = useState({
    street: "",
    area: "",
    city: "",
    state: "",
    pincode: ""
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

  // ✅ 3. Validation Logic
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.shopName.trim()) newErrors.shopName = "Shop Name is required";

    // Address Validations
    if (!addr.street.trim()) newErrors.street = "Shop No./Street is required";
    if (!addr.city.trim()) newErrors.city = "City is required";
    if (!addr.state.trim()) newErrors.state = "State is required";
    if (!addr.pincode.trim()) newErrors.pincode = "Pincode is required";
    else if (addr.pincode.length !== 6) newErrors.pincode = "Invalid Pincode";

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

  // Handle General Inputs
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const files = (e.target as HTMLInputElement).files;

    if (name === "visitingCard" && files && files.length > 0) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
      if (errors.visitingCard) deleteError("visitingCard");
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) deleteError(name);
    }
  };

  // ✅ Handle Address Inputs
  const handleAddrChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Pincode numeric only check
    if (name === "pincode" && !/^\d*$/.test(value)) return;

    setAddr((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) deleteError(name);
  };

  const deleteError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const sendOtp = async () => {
    if (!validateForm()) {
      Swal.fire("Warning", "⚠️ Please fix the errors before sending OTP", "warning");
      return;
    }
    try {
      const phone = normalizeTo10(form.otpMobile);
      const res = await axios.post(`${API_BASE}/otp/send`, { phone });
      if (res.data?.success) {
        setOtpSent(true);
        Swal.fire("Success", "✅ OTP sent successfully! Check your SMS.", "success");
      } else {
        Swal.fire("Error", res.data?.message || "Failed to send OTP", "error");
      }
    } catch (err: any) {
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

      // ✅ Combine Address with LABELS for Admin Panel
      // This format allows Admin Panel to split by '\n' and show Bold Headings
      const fullAddress = `Country: India
State: ${addr.state}
City: ${addr.city}
Area: ${addr.area || "N/A"}
Pin Code: ${addr.pincode}
Address: ${addr.street}`;

      const formData = new FormData();
      formData.append("shopName", form.shopName);
      formData.append("otpMobile", phone);
      formData.append("whatsapp", form.whatsapp);
      formData.append("address", fullAddress); // ✅ Sending Formatted String
      
      if (form.visitingCard) {
        formData.append("visitingCard", form.visitingCard);
      }

      const res = await axios.post(`${API_BASE}/registrations/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLoading(false);

      if (res.data?.alreadyRegistered) {
        Swal.fire("Notice", "⚠️ Number already registered. Please login.", "warning");
        navigate("/login");
        return;
      }

      Swal.fire("Success", "🎉 Registration submitted! Wait for approval.", "success");
      navigate("/login");

    } catch (err: any) {
      setLoading(false);
      console.error(err);
      Swal.fire("Error", err.response?.data?.message || "Registration failed", "error");
    }
  };

  // 🎨 Styles for the Grid Layout
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2>Register Shop</h2>

        {/* Shop Name */}
        <div className="form-group">
            <label className="input-label">Shop Name *</label>
            <input
            name="shopName"
            placeholder="Ex: My Kids Store"
            value={form.shopName}
            onChange={handleChange}
            />
            {errors.shopName && <div className="error">{errors.shopName}</div>}
        </div>

        {/* ✅ E-Commerce Style Address Section */}
        <div className="address-section" style={{ marginBottom: "15px" }}>
            <label className="input-label" style={{fontWeight: "bold", display: "block", marginBottom: "5px"}}>Shop Address</label>
            
            {/* Line 1 */}
            <input
                name="street"
                placeholder="Shop No., Building Name, Street *"
                value={addr.street}
                onChange={handleAddrChange}
                style={{marginBottom: "10px"}}
            />
            {errors.street && <div className="error">{errors.street}</div>}

            {/* Line 2 */}
            <input
                name="area"
                placeholder="Area / Colony / Landmark (Optional)"
                value={addr.area}
                onChange={handleAddrChange}
                style={{marginBottom: "10px"}}
            />

            {/* City & Pincode Row */}
            <div style={gridStyle}>
                <div>
                    <input
                        name="city"
                        placeholder="City / District *"
                        value={addr.city}
                        onChange={handleAddrChange}
                    />
                    {errors.city && <div className="error">{errors.city}</div>}
                </div>
                <div>
                    <input
                        name="pincode"
                        placeholder="Pincode *"
                        value={addr.pincode}
                        onChange={handleAddrChange}
                        maxLength={6}
                    />
                    {errors.pincode && <div className="error">{errors.pincode}</div>}
                </div>
            </div>

            {/* State Dropdown */}
            <select 
                name="state" 
                value={addr.state} 
                onChange={handleAddrChange}
                style={{width: "100%", padding: "10px", marginTop: "10px", borderRadius: "5px", border: "1px solid #ccc"}}
            >
                <option value="">Select State *</option>
                {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            {errors.state && <div className="error">{errors.state}</div>}
        </div>

        {/* Mobile */}
        <div className="form-group">
             <label className="input-label">Mobile Number *</label>
            <input
            name="otpMobile"
            placeholder="10-digit Mobile Number"
            value={form.otpMobile}
            onChange={handleChange}
            type="tel"
            maxLength={10}
            />
            {errors.otpMobile && <div className="error">{errors.otpMobile}</div>}
        </div>

        {/* Whatsapp */}
        <div className="form-group">
            <label className="input-label">WhatsApp Number</label>
            <input
            name="whatsapp"
            placeholder="WhatsApp Number"
            value={form.whatsapp}
            onChange={handleChange}
            type="tel"
            maxLength={10}
            />
        </div>

        {/* Visiting Card */}
        <div className="file-input-container">
          <label>Visiting Card (Required) *</label>
          <input name="visitingCard" type="file" onChange={handleChange} accept="image/*" />
          {errors.visitingCard && <div className="error">{errors.visitingCard}</div>}
        </div>

        {!otpSent ? (
          <button onClick={sendOtp}>Send OTP</button>
        ) : (
          <>
            <div className="otp-box-container">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="tel"
                  maxLength={1}
                  className="otp-box"
                  value={otp[i] || ""}
                  autoFocus={i === 0}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (!val && i > 0) document.querySelectorAll<HTMLInputElement>(".otp-box")[i - 1].focus();
                    else if (val && i < 5) document.querySelectorAll<HTMLInputElement>(".otp-box")[i + 1].focus();
                    
                    const newOtp = otp.split("");
                    newOtp[i] = val;
                    setOtp(newOtp.join(""));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[i] && i > 0) document.querySelectorAll<HTMLInputElement>(".otp-box")[i - 1].focus();
                  }}
                />
              ))}
            </div>

            <button onClick={verifyAndRegister}>Verify & Register</button>
          </>
        )}

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <span>Already have an account? </span>
          <Link to="/login" style={{ textDecoration: "underline", color: "#007bff", fontWeight: 600 }}>
            Login Now
          </Link>
        </div>

        {loading && (
          <div className="loader-overlay">
            <div className="loader"></div>
            <p>⏳ Verifying & Submitting...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;