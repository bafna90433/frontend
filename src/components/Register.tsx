// src/components/Register.tsx
import React, { useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
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
  const [confirmation, setConfirmation] =
    useState<ConfirmationResult | null>(null);
  const [isSending, setIsSending] = useState(false); // prevents double clicks
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "visitingCard" && files) {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Helper: ensure phone is E.164. If user enters 10 digits, assume +91 prefix.
  const normalizePhone = (raw: string) => {
    const s = raw.trim();
    if (!s) return "";
    if (s.startsWith("+")) return s;
    // allow numbers with spaces/dashes
    const digits = s.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    // if user typed country code without + e.g. 919XXXXXXXXX
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    return ""; // unknown format
  };

  const sendOtp = async () => {
    try {
      if (isSending) return;
      setIsSending(true);

      const phoneCandidate = normalizePhone(form.otpMobile);
      if (!phoneCandidate) {
        alert("Enter phone number in +91XXXXXXXXXX or 10-digit format (XXXXXXXXXX).");
        setIsSending(false);
        return;
      }

      // ensure recaptcha and auth are available
      const recaptcha = setupRecaptcha("recaptcha-container");
      console.log("sendOtp debug -> auth:", auth, "recaptcha:", recaptcha);

      if (!recaptcha) {
        alert("reCAPTCHA unavailable. Check console for details and ensure #recaptcha-container exists.");
        setIsSending(false);
        return;
      }

      // signInWithPhoneNumber expects E.164 phone format and a RecaptchaVerifier instance
      const result = await signInWithPhoneNumber(auth, phoneCandidate, recaptcha);
      setConfirmation(result);
      setOtpSent(true);
      alert("OTP has been sent to " + phoneCandidate);
    } catch (err) {
      console.error("sendOtp error:", err);
      alert("Failed to send OTP. See console for details.");
    } finally {
      setIsSending(false);
    }
  };

  const verifyAndRegister = async () => {
    try {
      if (isVerifying) return;
      setIsVerifying(true);

      if (!confirmation) {
        alert("No OTP session found. Please request an OTP first.");
        return;
      }
      if (!otp || otp.trim().length === 0) {
        alert("Enter the OTP received on your phone.");
        return;
      }

      await confirmation.confirm(otp.trim());

      // build form data for backend registration
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "visitingCard" && value instanceof File) {
          formData.append("visitingCard", value);
        } else {
          formData.append(key, value as string);
        }
      });

      // TODO: replace with env var in production
      const res = await axios.post("http://localhost:5000/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data?.msg || "Registration successful.");
      // optional: redirect to login or clear form
    } catch (err) {
      console.error("verifyAndRegister error:", err);
      alert("OTP verification failed. Please check the code and try again.");
    } finally {
      setIsVerifying(false);
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
        placeholder="+91XXXXXXXXXX or XXXXXXXXXX"
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

      {/* reCAPTCHA container — required for RecaptchaVerifier */}
      <div id="recaptcha-container" style={{ marginBottom: "12px" }} />

      {!otpSent ? (
        <button onClick={sendOtp} disabled={isSending}>
          {isSending ? "Sending..." : "Send OTP"}
        </button>
      ) : (
        <>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="otp"
            type="text"
          />
          <button onClick={verifyAndRegister} disabled={isVerifying}>
            {isVerifying ? "Verifying..." : "Verify & Register"}
          </button>
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
