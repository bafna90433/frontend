// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

// ✅ Direct Firebase Config (hardcoded)
const firebaseConfig = {
  apiKey: "AIzaSyD4hfhVpBgdZqQ0PoqQZ0Yrs8GekrbjBjY",
  authDomain: "bafnatoys-otp.firebaseapp.com",
  projectId: "bafnatoys-otp",
  storageBucket: "bafnatoys-otp.appspot.com", // ⚡ "appspot.com" hona chahiye
  messagingSenderId: "417820640865",
  appId: "1:417820640865:web:9675a4a996763b51084c20",
  measurementId: "G-ZTTC8YDQ2J"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Firebase Auth
export const auth = getAuth(app);

// ✅ reCAPTCHA setup
export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible", // "normal" bhi kar sakte ho
    callback: (response: any) => {
      console.log("reCAPTCHA solved ✅", response);
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired ❌");
    },
  });
};
