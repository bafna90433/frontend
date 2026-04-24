import React, { useState, ChangeEvent, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  MapPin, Store, Smartphone, MessageCircle, ArrowRight,
  ShieldCheck, Lock, Package, Truck, Award,
  Zap, Star, Users
} from "lucide-react";
import "../styles/AuthStyles.css";

const RAW = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_BASE = RAW.endsWith("/api") ? RAW : `${RAW}/api`;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry",
];

const Register: React.FC = () => {
  const [form, setForm] = useState({ shopName: "", otpMobile: "", whatsapp: "", gstNumber: "" });
  const [addr, setAddr] = useState({ street: "", area: "", city: "", state: "", pincode: "" });
  const [gstDocument, setGstDocument] = useState<File | null>(null);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1); // 1: info, 2: address, 3: otp

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const normalizeTo10 = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  };

  const normalizeTo91 = (raw: string) => {
    const digits = String(raw || "").replace(/\D/g, "");
    const ten = digits.startsWith("91") ? digits.slice(2) : digits;
    const last10 = ten.length > 10 ? ten.slice(-10) : ten;
    if (last10.length !== 10) return "";
    return `91${last10}`;
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.shopName.trim()) e.shopName = "Required";
    const phone = normalizeTo10(form.otpMobile);
    if (phone.length !== 10) e.otpMobile = "Valid 10-digit number required";
    if (!form.whatsapp.trim()) e.whatsapp = "Required";
    else if (!normalizeTo91(form.whatsapp)) e.whatsapp = "Enter valid WhatsApp number";
    
    if (form.gstNumber && form.gstNumber.length !== 15) {
       e.gstNumber = "Please enter complete 15-digit GST or leave empty";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!addr.street.trim()) e.street = "Required";
    if (!addr.city.trim()) e.city = "Required";
    if (!addr.state.trim()) e.state = "Required";
    if (!addr.pincode.trim()) e.pincode = "Required";
    else if (addr.pincode.length !== 6) e.pincode = "6 digits required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const deleteError = (field: string) => setErrors(p => { const n = { ...p }; delete n[field]; return n; });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "whatsapp") {
      let digits = String(value || "").replace(/\D/g, "");
      if (!digits) digits = "91";
      if (!digits.startsWith("91")) digits = "91" + (digits.length > 10 ? digits.slice(-10) : digits);
      setForm(p => ({ ...p, whatsapp: digits.slice(0, 12) }));
      if (errors[name]) deleteError(name);
      return;
    }
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) deleteError(name);
  };

  const handleAddrChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "pincode" && !/^\d*$/.test(value)) return;
    setAddr(p => ({ ...p, [name]: value }));
    if (errors[name]) deleteError(name);
  };

  const handleOtpChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val && e.target.value !== "") return;
    const arr = otp.split("");
    while (arr.length < 6) arr.push("");
    arr[index] = val;
    setOtp(arr.join("").slice(0, 6));
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const goStep2 = () => { if (validateStep1()) { setStep(2); setErrors({}); } };

  const sendOtp = async () => {
    if (!validateStep2()) return;
    try {
      setLoading(true);
      const phone = normalizeTo10(form.otpMobile);
      const res = await axios.post(`${API_BASE}/otp/send`, { phone });
      setLoading(false);
      if (res.data?.success) {
        setOtpSent(true); setStep(3);
        Swal.fire({ title: "OTP Sent!", icon: "success", timer: 2000, showConfirmButton: false });
        setTimeout(() => otpRefs.current[0]?.focus(), 500);
      } else Swal.fire("Error", "Failed to send OTP", "error");
    } catch { setLoading(false); Swal.fire("Error", "Failed to send OTP", "error"); }
  };

  const verifyAndRegister = async () => {
    if (otp.length !== 6) { Swal.fire("Error", "Enter 6-digit OTP", "error"); return; }
    try {
      const phone = normalizeTo10(form.otpMobile);
      const wa91 = normalizeTo91(form.whatsapp);
      if (!wa91) { Swal.fire("Error", "Invalid WhatsApp number", "error"); return; }
      setLoading(true);
      const verifyRes = await axios.post(`${API_BASE}/otp/verify`, { phone, otp });
      if (!verifyRes.data?.success) { setLoading(false); Swal.fire("Invalid OTP", "Incorrect code", "error"); return; }
      
      const fullAddress = `Country: India\nState: ${addr.state}\nCity: ${addr.city}\nArea: ${addr.area || "N/A"}\nPin: ${addr.pincode}\nAddress: ${addr.street}`;
      
      const formData = new FormData();
      formData.append("shopName", form.shopName);
      formData.append("otpMobile", phone);
      formData.append("whatsapp", wa91);
      formData.append("address", fullAddress);
      
      if (form.gstNumber) {
          formData.append("gstNumber", form.gstNumber);
      }
      
      const res = await axios.post(`${API_BASE}/registrations/register`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setLoading(false);
      
      if (res.data?.alreadyRegistered) { Swal.fire("Welcome Back", "Account exists", "info"); navigate("/login"); return; }
      
      const newUser = res.data?.user || { name: form.shopName, phone, role: "customer", isApproved: true, _id: res.data?._id || "" };
      newUser.isApproved = true;
      localStorage.setItem("user", JSON.stringify(newUser));
      window.dispatchEvent(new Event("storage"));

      Swal.fire({ title: "Success!", text: "Registration Complete", icon: "success", timer: 2000, showConfirmButton: false });
      setTimeout(() => { navigate("/"); }, 1500);
      
    } catch (err: any) { setLoading(false); Swal.fire("Error", err.response?.data?.message || "Failed", "error"); }
  };

  return (
    <div className="au-page">
      {/* ── Left Panel (Hero) ── */}
      <div className="au-left">
        <div className="au-logo-wrap">
          <div className="au-logo-icon">🧸</div>
          <div className="au-logo-text">Bafna Toys</div>
        </div>

        <div className="au-left-content">
          <div className="au-badge">B2B Registration</div>
          <h1 className="au-left-title">
            <span>India's Leading</span>
            <span>Toys Manufacturers</span>
          </h1>
          <p className="au-left-sub">
            Join 4,900+ retailers who trust Bafna Toys for quality wholesale toys at best prices.
          </p>

          <div className="au-features-grid">
             <div className="au-feature-card">
              <div className="au-f-icon"><Zap size={20} /></div>
              <div className="au-f-text">
                <strong>Quick Setup</strong>
                <span>Register in 2 minutes</span>
              </div>
            </div>
            <div className="au-feature-card">
              <div className="au-f-icon"><Truck size={20} /></div>
              <div className="au-f-text">
                <strong>Free Delivery</strong>
                <span>Orders ₹3000+</span>
              </div>
            </div>
            <div className="au-feature-card">
              <div className="au-f-icon"><ShieldCheck size={20} /></div>
              <div className="au-f-text">
                <strong>BIS Certified</strong>
                <span>All Products Tested</span>
              </div>
            </div>
            <div className="au-feature-card">
              <div className="au-f-icon"><Package size={20} /></div>
              <div className="au-f-text">
                <strong>400+ Products</strong>
                <span>Wide Range of Toys</span>
              </div>
            </div>
            <div className="au-feature-card">
              <div className="au-f-icon"><Award size={20} /></div>
              <div className="au-f-text">
                <strong>Best Wholesale Prices</strong>
                <span>Direct from Factory</span>
              </div>
            </div>
          </div>

          <div className="au-trust-pill">
            <Users size={14} />
            4,900+ Verified Retailers
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="au-right">
        <div className="au-form-card">
          {loading && (
            <div className="au-loading-overlay">
              <div className="au-spinner" />
            </div>
          )}

          <div className="au-card-header">
            <h2>Create Account</h2>
            <p>Set up your wholesale business profile</p>
          </div>

          <div className="au-steps-nav">
            <div className={`au-step-item ${step >= 1 ? "au-step-item--active" : ""} ${step > 1 ? "au-step-item--done" : ""}`} />
            <div className={`au-step-item ${step >= 2 ? "au-step-item--active" : ""} ${step > 2 ? "au-step-item--done" : ""}`} />
            <div className={`au-step-item ${step >= 3 ? "au-step-item--active" : ""} ${step > 3 ? "au-step-item--done" : ""}`} />
          </div>

          {step === 1 && (
            <div className="au-step-body">
              <div className="au-field">
                <label className="au-label">Shop / Business Name</label>
                <div className="au-input-container">
                  <Store size={18} className="au-i-icon" />
                  <input className={`au-input ${errors.shopName ? "au-input--err" : ""}`} name="shopName" placeholder="e.g. Rahul General Store" value={form.shopName} onChange={handleChange} />
                </div>
                {errors.shopName && <span className="au-err">{errors.shopName}</span>}
              </div>

              <div className="au-field">
                <label className="au-label">Mobile Number</label>
                <div className="au-input-container">
                  <Smartphone size={18} className="au-i-icon" />
                  <input className={`au-input ${errors.otpMobile ? "au-input--err" : ""}`} name="otpMobile" placeholder="10-digit mobile" value={form.otpMobile} onChange={handleChange} type="tel" maxLength={10} />
                </div>
                {errors.otpMobile && <span className="au-err">{errors.otpMobile}</span>}
              </div>

              <div className="au-field">
                <label className="au-label">WhatsApp Number</label>
                <div className="au-input-container">
                  <MessageCircle size={18} className="au-i-icon" />
                  <input
                    className={`au-input ${errors.whatsapp ? "au-input--err" : ""}`}
                    name="whatsapp" placeholder="91XXXXXXXXXX" value={form.whatsapp} onChange={handleChange}
                    onFocus={() => { if (!form.whatsapp) setForm(p => ({ ...p, whatsapp: "91" })); }}
                    type="tel" maxLength={12}
                  />
                </div>
                {errors.whatsapp && <span className="au-err">{errors.whatsapp}</span>}
              </div>

              <div className="au-field">
                <label className="au-label">GST Number (Optional)</label>
                <div className="au-input-container">
                  <ShieldCheck size={18} className="au-i-icon" />
                  <input 
                    className={`au-input ${errors.gstNumber ? "au-input--err" : ""}`} 
                    name="gstNumber" 
                    placeholder="15-digit GSTIN" 
                    value={form.gstNumber?.toUpperCase() || ""} 
                    onChange={handleChange} 
                    maxLength={15}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                {errors.gstNumber && <span className="au-err">{errors.gstNumber}</span>}
              </div>

              <button className="au-submit-btn" onClick={goStep2}>
                Next: Address <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="au-step-body">
              <div className="au-field">
                <label className="au-label">Street / Shop Address</label>
                <div className="au-input-container">
                  <MapPin size={18} className="au-i-icon" />
                  <input className={`au-input ${errors.street ? "au-input--err" : ""}`} name="street" placeholder="Shop No, Street, Building" value={addr.street} onChange={handleAddrChange} />
                </div>
                {errors.street && <span className="au-err">{errors.street}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="au-field" style={{ marginBottom: 0 }}>
                  <label className="au-label">City</label>
                  <input className={`au-input ${errors.city ? "au-input--err" : ""}`} style={{ paddingLeft: '16px' }} name="city" placeholder="City" value={addr.city} onChange={handleAddrChange} />
                </div>
                <div className="au-field" style={{ marginBottom: 0 }}>
                  <label className="au-label">Pincode</label>
                  <input className={`au-input ${errors.pincode ? "au-input--err" : ""}`} style={{ paddingLeft: '16px' }} name="pincode" placeholder="6 digits" value={addr.pincode} onChange={handleAddrChange} maxLength={6} />
                </div>
              </div>

              <div className="au-field">
                <label className="au-label">State</label>
                <select className={`au-input ${errors.state ? "au-input--err" : ""}`} style={{ paddingLeft: '16px' }} name="state" value={addr.state} onChange={handleAddrChange}>
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginTop: '24px' }}>
                <button className="au-secondary-btn" style={{ marginTop: 0 }} onClick={() => setStep(1)}>Back</button>
                <button className="au-submit-btn" style={{ marginTop: 0 }} onClick={sendOtp} disabled={loading}>
                  Get OTP <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="au-step-body">
               <div className="au-otp-wrap">
                <div className="au-otp-label">
                  <Lock size={14} />
                  <span>Enter OTP sent to <strong>+91 {normalizeTo10(form.otpMobile)}</strong></span>
                </div>

                <div className="au-otp-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="tel" maxLength={1}
                      className="au-otp-box"
                      value={otp[i] || ""}
                      onChange={e => handleOtpChange(i, e)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                <button className="au-submit-btn" onClick={verifyAndRegister} disabled={otp.length !== 6 || loading}>
                  Verify & Register <ArrowRight size={18} />
                </button>

                <button className="au-change-num" style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }} onClick={() => { setStep(2); setOtp(""); setOtpSent(false); }}>
                  ← Change Details
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--au-border)' }} />
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Already registered?</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--au-border)' }} />
          </div>

          <Link to="/login" className="au-secondary-btn" style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            Sign In to Account
          </Link>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', opacity: 0.6 }}>
             <ShieldCheck size={14} />
             <Lock size={14} />
             <Star size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;