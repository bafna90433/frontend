import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import { signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth, setupRecaptcha } from "../firebase";
import "../styles/LoginOTP.css";

const LoginOTP: React.FC = () => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();

  const normalizeMobile = (m: string) =>
    m.trim().replace(/^\+91/, "").replace(/\D/g, "");

  const sendOTP = async () => {
    const raw = normalizeMobile(mobile);

    if (raw.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSending(true);
    try {
      const { data: user } = await api.get(`/registrations/phone/${raw}`);

      if (!user) {
        alert("This mobile number is not registered. Please register first.");
        navigate("/register");
        return;
      }
      if (!user.isApproved) {
        alert("Your account is pending approval. Please try again later.");
        return;
      }

      const w = window as any;
      if (!w.recaptchaVerifier) {
        w.recaptchaVerifier = setupRecaptcha("recaptcha-container");
      }

      const fullNumber = `+91${raw}`;
      const confirmationResult = await signInWithPhoneNumber(auth, fullNumber, w.recaptchaVerifier);
      setConfirmation(confirmationResult);
      alert("OTP sent successfully.");
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert("This mobile number is not registered. Please register first.");
        navigate("/register");
      } else {
        console.error(err);
        alert("Failed to send OTP. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) return alert("Please enter the OTP.");
    if (!confirmation) return alert("Please send the OTP first.");

    setVerifying(true);
    try {
      await confirmation.confirm(otp);

      const raw = normalizeMobile(mobile);
      const { data: user } = await api.get(`/registrations/phone/${raw}`);

      if (!user) {
        alert("This mobile number is not registered. Please register first.");
        navigate("/register");
        return;
      }
      if (!user.isApproved) {
        alert("Your account is pending approval. Please try again later.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", "otp"); 
      window.dispatchEvent(new Event("storage"));

      navigate("/my-account");
    } catch (err) {
      console.error(err);
      alert("Invalid OTP or login failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="login-otp-container">
      <h2>Login with OTP</h2>

      <input
        type="text"
        placeholder="Enter Mobile (10 digits)"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <button onClick={sendOTP} disabled={sending}>
        {sending ? "Sending..." : "Send OTP"}
      </button>

      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <button onClick={verifyOTP} disabled={verifying}>
        {verifying ? "Verifying..." : "Verify & Login"}
      </button>

      <div id="recaptcha-container"></div>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <span>New here? </span>
        <Link to="/register" style={{ textDecoration: "underline", color: "#007bff" }}>
          Register
        </Link>
      </div>
    </div>
  );
};

export default LoginOTP;
