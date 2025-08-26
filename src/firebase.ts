import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4hfhVpBgdZqQ0PoqQZ0Yrs8GekrbjBjY",
  authDomain: "bafnatoys-otp.firebaseapp.com",
  projectId: "bafnatoys-otp",
  storageBucket: "bafnatoys-otp.appspot.com", // ✅ FIXED
  messagingSenderId: "417820640865",
  appId: "1:417820640865:web:9675a4a996763b51084c20",
  measurementId: "G-ZTTC8YDQ2J", // optional
};

// ✅ Initialize once
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ✅ reCAPTCHA setup
export function setupRecaptcha(containerId: string) {
  const w = window as any;
  if (!w.recaptchaVerifier) {
    w.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      {
        size: "invisible", // or "normal" if you want visible captcha box
        callback: () => console.log("reCAPTCHA solved ✅"),
      },
      auth
    );
    w.recaptchaVerifier.render(); // required for Vercel deploys
  }
  return w.recaptchaVerifier;
}
