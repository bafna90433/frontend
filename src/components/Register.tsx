import React, { useState, ChangeEvent, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  MapPin, Store, Smartphone, MessageCircle, ArrowRight,
  ShieldCheck, Lock, CheckCircle, Package, Truck, Award,
  Zap, Star, Users, UploadCloud
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGstDocument(e.target.files[0]);
    }
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
      
      // Send GST Number to backend if provided
      if (form.gstNumber) {
          formData.append("gstNumber", form.gstNumber);
      }
      
      // Send document only if exists
      if (gstDocument) {
        formData.append("gstDocument", gstDocument);
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
      {/* ── Left ── */}
      <div className="au-left au-left--reg">
        <div className="au-left-inner">
          <div className="au-logo">🧸 Bafna Toys</div>
          <h1 className="au-left-title">Start Your<br />Toy Business</h1>
          <p className="au-left-sub">Join 4,900+ retailers who trust Bafna Toys for quality wholesale toys at best prices.</p>

          <div className="au-features">
            <div className="au-feature"><div className="au-feature-icon"><Zap size={18} /></div><div><strong>Quick Setup</strong><span>Register in 2 minutes</span></div></div>
            <div className="au-feature"><div className="au-feature-icon"><Package size={18} /></div><div><strong>400+ Products</strong><span>Huge toy catalog</span></div></div>
            <div className="au-feature"><div className="au-feature-icon"><Truck size={18} /></div><div><strong>All India Delivery</strong><span>Free above ₹5000</span></div></div>
            <div className="au-feature"><div className="au-feature-icon"><Award size={18} /></div><div><strong>50%+ Off MRP</strong><span>Best wholesale prices</span></div></div>
          </div>

          <div className="au-left-trust"><Users size={14} /> 4,900+ Verified Retailers</div>
        </div>
        <div className="au-left-deco au-left-deco--1" />
        <div className="au-left-deco au-left-deco--2" />
      </div>

      {/* ── Right ── */}
      <div className="au-right">
        <div className="au-card">
          <div className="au-card-head">
            <h2>Create Account</h2>
            <p>Set up your wholesale business profile</p>
          </div>

          {/* Steps indicator */}
          <div className="au-steps">
            {["Business Info", "Address", "Verify"].map((label, i) => (
              <div key={i} className={`au-step ${step > i + 1 ? "au-step--done" : step === i + 1 ? "au-step--active" : ""}`}>
                <div className="au-step-dot">{step > i + 1 ? <CheckCircle size={14} /> : i + 1}</div>
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="au-step-body">
              
              <div className="au-field">
                <label>GST Number (Optional)</label>
                <div className="au-input-wrap">
                  <ShieldCheck size={18} className="au-input-icon" />
                  <input 
                    className={`au-input ${errors.gstNumber ? "au-input--err" : ""}`} 
                    name="gstNumber" 
                    placeholder="Enter 15-digit GSTIN" 
                    value={form.gstNumber?.toUpperCase() || ""} 
                    onChange={handleChange} 
                    maxLength={15}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                {errors.gstNumber && <span className="au-err">{errors.gstNumber}</span>}
              </div>

              <div className="au-field">
                <label>Shop / Business Name</label>
                <div className="au-input-wrap">
                  <Store size={18} className="au-input-icon" />
                  <input className={`au-input ${errors.shopName ? "au-input--err" : ""}`} name="shopName" placeholder="e.g. Rahul General Store" value={form.shopName} onChange={handleChange} />
                </div>
                {errors.shopName && <span className="au-err">{errors.shopName}</span>}
              </div>

              <div className="au-field">
                <label>Mobile Number</label>
                <div className="au-input-wrap">
                  <Smartphone size={18} className="au-input-icon" />
                  <input className={`au-input ${errors.otpMobile ? "au-input--err" : ""}`} name="otpMobile" placeholder="10-digit mobile" value={form.otpMobile} onChange={handleChange} type="tel" maxLength={10} />
                </div>
                {errors.otpMobile && <span className="au-err">{errors.otpMobile}</span>}
              </div>

              <div className="au-field">
                <label>WhatsApp Number</label>
                <div className="au-input-wrap">
                  <MessageCircle size={18} className="au-input-icon" />
                  <input
                    className={`au-input ${errors.whatsapp ? "au-input--err" : ""}`}
                    name="whatsapp" placeholder="91XXXXXXXXXX" value={form.whatsapp} onChange={handleChange}
                    onFocus={() => { if (!form.whatsapp) setForm(p => ({ ...p, whatsapp: "91" })); }}
                    onKeyDown={e => { const s = e.currentTarget.selectionStart ?? 0; if (e.key === "Backspace" && s <= 2) e.preventDefault(); }}
                    type="tel" maxLength={12}
                  />
                </div>
                {errors.whatsapp && <span className="au-err">{errors.whatsapp}</span>}
              </div>

              <div className="au-field">
                <label>Upload GST Document (Optional)</label>
                <div className="au-input-wrap" style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  <UploadCloud size={18} className="au-input-icon" style={{ position: 'static', marginRight: '10px' }} />
                  <input 
                    type="file" 
                    name="gstDocument" 
                    accept=".pdf, image/*" 
                    onChange={handleFileChange} 
                    style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Please upload your GST certificate if available.
                </p>
              </div>

              <button className="au-btn au-btn--primary" onClick={goStep2}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="au-step-body">
              <div className="au-field">
                <label>Street / Shop Address</label>
                <div className="au-input-wrap">
                  <MapPin size={18} className="au-input-icon" />
                  <input className={`au-input ${errors.street ? "au-input--err" : ""}`} name="street" placeholder="Shop No, Street, Building" value={addr.street} onChange={handleAddrChange} />
                </div>
                {errors.street && <span className="au-err">{errors.street}</span>}
              </div>

              <div className="au-row">
                <div className="au-field au-field--half">
                  <label>Area / Colony</label>
                  <input className="au-input au-input--plain" name="area" placeholder="Area" value={addr.area} onChange={handleAddrChange} />
                </div>
                <div className="au-field au-field--half">
                  <label>City</label>
                  <input className={`au-input au-input--plain ${errors.city ? "au-input--err" : ""}`} name="city" placeholder="City" value={addr.city} onChange={handleAddrChange} />
                </div>
              </div>

              <div className="au-row">
                <div className="au-field" style={{ flex: 2 }}>
                  <label>State</label>
                  <select className={`au-input au-input--plain ${errors.state ? "au-input--err" : ""}`} name="state" value={addr.state} onChange={handleAddrChange}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="au-field">
                  <label>Pincode</label>
                  <input className={`au-input au-input--plain ${errors.pincode ? "au-input--err" : ""}`} name="pincode" placeholder="6 digits" value={addr.pincode} onChange={handleAddrChange} maxLength={6} />
                </div>
              </div>

              <div className="au-step-btns">
                <button className="au-btn au-btn--ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="au-btn au-btn--primary" onClick={sendOtp} disabled={loading}>
                  {loading ? <><span className="au-spin" /> Sending...</> : <>Get OTP <ArrowRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: OTP */}
          {step === 3 && (
            <div className="au-step-body">
              <div className="au-otp-section">
                <div className="au-otp-label">
                  <Lock size={14} />
                  <span>Enter OTP sent to <strong>+91 {normalizeTo10(form.otpMobile)}</strong></span>
                </div>

                <div className="au-otp-boxes">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      type="tel" maxLength={1}
                      className={`au-otp-digit ${otp[i] ? "au-otp-digit--filled" : ""}`}
                      value={otp[i] || ""}
                      onChange={e => handleOtpChange(i, e)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                <button className="au-btn au-btn--success" onClick={verifyAndRegister} disabled={otp.length !== 6 || loading}>
                  {loading ? <><span className="au-spin" /> Registering...</> : <>Verify & Register <ArrowRight size={16} /></>}
                </button>

                <button className="au-change-num" onClick={() => { setStep(2); setOtp(""); setOtpSent(false); }}>
                  ← Change Details
                </button>
              </div>
            </div>
          )}

          <div className="au-divider"><span>Already registered?</span></div>

          <Link to="/login" className="au-btn au-btn--outline">
            Sign In to Account <ArrowRight size={16} />
          </Link>

          <div className="au-footer-trust">
            <span><ShieldCheck size={12} /> 256-bit Secure</span>
            <span><Lock size={12} /> OTP Verified</span>
            <span><Star size={12} /> BIS Certified</span>
          </div>
        </div>
      </div>

      {loading && <div className="au-loader"><div className="au-spin-lg" /></div>}
    </div>
  );
};

export default Register;