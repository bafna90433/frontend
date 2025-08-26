import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4hfhVpBgdZqQ0PoqQZ0Yrs8GekrbjBjY",
  authDomain: "bafnatoys-otp.firebaseapp.com",
  projectId: "bafnatoys-otp",
  storageBucket: "bafnatoys-otp.appspot.com",
  messagingSenderId: "417820640865",
  appId: "1:417820640865:web:9675a4a996763b51084c20"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ✅ Setup reCAPTCHA
export async function setupRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined") return null;
  const win = window as any;

  // Ensure container exists
  if (!document.getElementById(containerId)) {
    console.error(`Recaptcha container #${containerId} not found`);
    return null;
  }

  // Clear old verifier if exists
  if (win.recaptchaVerifier) {
    try {
      win.recaptchaVerifier.clear();
    } catch (e) {}
    win.recaptchaVerifier = null;
  }

  // Create new verifier
  win.recaptchaVerifier = new RecaptchaVerifier(
    containerId,
    { size: "invisible", callback: () => console.log("reCAPTCHA solved") },
    auth
  );

  // Force render
  await win.recaptchaVerifier.render();
  return win.recaptchaVerifier;
}
