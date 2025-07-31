import React, { useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../utils/firebase";
import axios from "axios";
import { countries } from "../data/countries";

const Register: React.FC = () => {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState({
    firmName: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    mobile: "",
    whatsapp: "",
    visitingCard: null as File | null,
  });
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as any;
    if (name === "country") {
      setForm((prev) => ({ ...prev, country: value, state: "" }));
      const selectedCountry = countries.find(
        (c: any) => c.name === value
      );
      setAvailableStates(selectedCountry ? selectedCountry.states : []);
    } else if (name === "visitingCard") {
      setForm((prev) => ({ ...prev, visitingCard: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Send OTP using Firebase
  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.mobile.length < 10) {
      alert("Enter a valid mobile number.");
      return;
    }

    // Only create RecaptchaVerifier once!
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }

    const appVerifier = (window as any).recaptchaVerifier;

    const fullPhone = "+91" + form.mobile; // Change code if not India
    try {
      const result = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Verify OTP and save registration data
  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    try {
      await confirmationResult.confirm(otp);
      // Now submit the form to backend
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v as any));
      await axios.post("http://localhost:5000/api/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Registration Success!");
      setStep("form");
      setForm({
        firmName: "",
        country: "",
        state: "",
        city: "",
        zip: "",
        mobile: "",
        whatsapp: "",
        visitingCard: null,
      });
      setOtp("");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      {step === "form" ? (
        <form onSubmit={sendOTP} className="register-form">
          <input
            type="text"
            name="firmName"
            placeholder="Firm Name"
            value={form.firmName}
            onChange={handleChange}
            required
          />
          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            required
          >
            <option value="">Select Country</option>
            {countries.map((country: any) => (
              <option key={country.code} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
          <select
            name="state"
            value={form.state}
            onChange={handleChange}
            required
            disabled={!form.country}
          >
            <option value="">Select State</option>
            {availableStates.map((state, idx) => (
              <option key={idx} value={state}>
                {state}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="zip"
            placeholder="Zip Code"
            value={form.zip}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="whatsapp"
            placeholder="WhatsApp Number"
            value={form.whatsapp}
            onChange={handleChange}
            required
          />
          <input
            type="file"
            name="visitingCard"
            accept="image/*,application/pdf"
            onChange={handleChange}
            required
          />
          <div id="recaptcha-container"></div>
          <button type="submit">Send OTP</button>
        </form>
      ) : (
        <form onSubmit={verifyOTP} className="otp-form">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            required
          />
          <button type="submit">Verify OTP & Register</button>
        </form>
      )}
    </div>
  );
};

export default Register;
