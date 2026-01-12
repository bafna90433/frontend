import React, { useState, ChangeEvent, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { MapPin, Store, Smartphone, MessageCircle, ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import "../styles/AuthStyles.css"; // ✅ IMPORTANT: Connects to shared CSS

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
  const [form, setForm] = useState({ shopName: "", otpMobile: "", whatsapp: "" });
  const [addr, setAddr] = useState({ street: "", area: "", city: "", state: "", pincode: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // --- Logic Helpers ---
  const normalizeTo10 = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.shopName.trim()) newErrors.shopName = "Shop Name is required";
    if (!addr.street.trim()) newErrors.street = "Street Address is required";
    if (!addr.city.trim()) newErrors.city = "City is required";
    if (!addr.state.trim()) newErrors.state = "State is required";
    if (!addr.pincode.trim()) newErrors.pincode = "Pincode is required";
    else if (addr.pincode.length !== 6) newErrors.pincode = "Invalid Pincode (6 digits)";
    
    const phone = normalizeTo10(form.otpMobile);
    if (phone.length !== 10) newErrors.otpMobile = "Valid Mobile Number required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) deleteError(name);
  };

  const handleAddrChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "pincode" && !/^\d*$/.test(value)) return;
    setAddr((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) deleteError(name);
  };

  const deleteError = (field: string) => {
    setErrors((prev) => { const newErrors = { ...prev }; delete newErrors[field]; return newErrors; });
  };

  // --- OTP Logic ---
  const handleOtpChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val && e.target.value !== "") return;
    
    const newOtp = otp.split("");
    while (newOtp.length < 6) newOtp.push("");
    newOtp[index] = val;
    setOtp(newOtp.join("").slice(0, 6));

    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const sendOtp = async () => {
    if (!validateForm()) {
      Swal.fire("Incomplete Details", "Please fill all required fields correctly.", "warning");
      return;
    }
    try {
      setLoading(true);
      const phone = normalizeTo10(form.otpMobile);
      const res = await axios.post(`${API_BASE}/otp/send`, { phone });
      setLoading(false);
      
      if (res.data?.success) {
        setOtpSent(true);
        Swal.fire({ title: "OTP Sent!", text: "Check your SMS.", icon: "success", timer: 2000, showConfirmButton: false });
        setTimeout(() => otpRefs.current[0]?.focus(), 500);
      } else {
        Swal.fire("Error", res.data?.message || "Failed to send OTP", "error");
      }
    } catch (err: any) {
      setLoading(false);
      Swal.fire("Error", "Failed to send OTP. Try again.", "error");
    }
  };

  const verifyAndRegister = async () => {
    if (!validateForm()) return;
    if (otp.length !== 6) { Swal.fire("Error", "Enter a valid 6-digit OTP", "error"); return; }

    try {
      const phone = normalizeTo10(form.otpMobile);
      setLoading(true);

      // 1. Verify OTP
      const verifyRes = await axios.post(`${API_BASE}/otp/verify`, { phone, otp });
      if (!verifyRes.data?.success) {
        setLoading(false);
        Swal.fire("Invalid OTP", "The code is incorrect.", "error");
        return;
      }

      // 2. Prepare Data
      const fullAddress = `Country: India\nState: ${addr.state}\nCity: ${addr.city}\nArea: ${addr.area || "N/A"}\nPin Code: ${addr.pincode}\nAddress: ${addr.street}`;
      const formData = new FormData();
      formData.append("shopName", form.shopName);
      formData.append("otpMobile", phone);
      formData.append("whatsapp", form.whatsapp);
      formData.append("address", fullAddress);
      
      // 3. Register
      const res = await axios.post(`${API_BASE}/registrations/register`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setLoading(false);

      if (res.data?.alreadyRegistered) {
        Swal.fire("Welcome Back", "Account exists. Redirecting to login...", "info");
        navigate("/login");
        return;
      }

      const newUser = res.data?.user || { name: form.shopName, phone: phone, role: "customer", isApproved: true, _id: res.data?._id || "new-user-id" };
      newUser.isApproved = true;
      localStorage.setItem("user", JSON.stringify(newUser));
      
      Swal.fire({ title: "Success!", text: "Registration Complete.", icon: "success", timer: 2000, showConfirmButton: false });
      setTimeout(() => { window.location.href = "/"; }, 1500);

    } catch (err: any) {
      setLoading(false);
      Swal.fire("Error", err.response?.data?.message || "Registration failed", "error");
    }
  };

  return (
    <div className="auth-layout">
      {/* LEFT SIDE - BRANDING */}
      <div className="auth-brand">
        <div className="brand-content">
          <div className="brand-header">
            <Store size={32} color="#fff" />
            <h1>ShopPartner</h1>
          </div>
          <h2>Join the Retail <br/> Revolution.</h2>
          <p>Register your shop in seconds and start managing your inventory digitally.</p>
          <div className="brand-badges">
             <span className="brand-badge"><ShieldCheck size={16}/> Secure</span>
             <span className="brand-badge"><ShoppingBag size={16}/> Easy Sales</span>
          </div>
        </div>
        <div className="circle c1"></div>
        <div className="circle c2"></div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="auth-form-container">
        <div className="auth-card">
          <div className="form-head">
            <h3>Create Account</h3>
            <p>Enter shop details to get started.</p>
          </div>

          {/* FORM INPUTS */}
          <div className="form-group">
            <label>Shop Name</label>
            <div className="input-wrapper">
              <Store size={18} className="input-icon" />
              <input 
                className={`auth-input ${errors.shopName ? "error" : ""}`} 
                name="shopName" 
                placeholder="Ex: Rahul General Store" 
                value={form.shopName} 
                onChange={handleChange} 
              />
            </div>
            {errors.shopName && <small className="err-msg">{errors.shopName}</small>}
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <div className="input-wrapper">
              <Smartphone size={18} className="input-icon" />
              <input 
                className={`auth-input ${errors.otpMobile ? "error" : ""}`}
                name="otpMobile" 
                placeholder="10-digit Mobile" 
                value={form.otpMobile} 
                onChange={handleChange} 
                type="tel" 
                maxLength={10} 
              />
            </div>
            {errors.otpMobile && <small className="err-msg">{errors.otpMobile}</small>}
          </div>

          <div className="form-group">
             <label>WhatsApp (Optional)</label>
             <div className="input-wrapper">
                <MessageCircle size={18} className="input-icon" />
                <input 
                  className="auth-input" 
                  name="whatsapp" 
                  placeholder="WhatsApp Number" 
                  value={form.whatsapp} 
                  onChange={handleChange} 
                  type="tel" 
                  maxLength={10} 
                />
             </div>
          </div>

          <div className="divider">Shop Address</div>

          <div className="form-group">
            <div className="input-wrapper">
              <MapPin size={18} className="input-icon" />
              <input 
                className={`auth-input ${errors.street ? "error" : ""}`}
                name="street" 
                placeholder="Shop No, Street, Building" 
                value={addr.street} 
                onChange={handleAddrChange} 
              />
            </div>
            {errors.street && <small className="err-msg">{errors.street}</small>}
          </div>

          <div className="row">
             <div className="col">
                <input 
                  className="auth-input plain-input" 
                  name="area" 
                  placeholder="Area / Colony" 
                  value={addr.area} 
                  onChange={handleAddrChange} 
                />
             </div>
             <div className="col">
                <input 
                  className={`auth-input plain-input ${errors.city ? "error" : ""}`} 
                  name="city" 
                  placeholder="City *" 
                  value={addr.city} 
                  onChange={handleAddrChange} 
                />
             </div>
          </div>

          <div className="row" style={{ marginTop: "12px" }}>
             <div className="col" style={{ flex: 2 }}>
                <select 
                  className={`auth-input plain-input ${errors.state ? "error" : ""}`} 
                  name="state" 
                  value={addr.state} 
                  onChange={handleAddrChange}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
             </div>
             <div className="col">
                <input 
                  className={`auth-input plain-input ${errors.pincode ? "error" : ""}`} 
                  name="pincode" 
                  placeholder="Pin *" 
                  value={addr.pincode} 
                  onChange={handleAddrChange} 
                  maxLength={6} 
                />
             </div>
          </div>
          {(errors.city || errors.state || errors.pincode) && <small className="err-msg">Check address fields</small>}

          {/* BUTTONS / OTP */}
          {!otpSent ? (
            <button onClick={sendOtp} disabled={loading} className="auth-btn">
              {loading ? "Processing..." : "Get OTP"} <ArrowRight size={18} />
            </button>
          ) : (
            <div className="otp-area">
              <label>Enter OTP Sent to {form.otpMobile}</label>
              <div className="otp-inputs">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input 
                    key={i} 
                    ref={(el) => (otpRefs.current[i] = el)} 
                    type="tel" 
                    maxLength={1} 
                    className="otp-digit"
                    value={otp[i] || ""} 
                    onChange={(e) => handleOtpChange(i, e)} 
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>
              <button onClick={verifyAndRegister} disabled={loading} className="auth-btn verify">
                 {loading ? "Verifying..." : "Verify & Register"}
              </button>
            </div>
          )}

          <div className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default Register;