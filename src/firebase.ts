import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD4hfhVpBgdZqQ0PoqQZ0Yrs8GekrbjBjY",
  authDomain: "bafnatoys-otp.firebaseapp.com",
  projectId: "bafnatoys-otp",
  storageBucket: "bafnatoys-otp.appspot.com",
  messagingSenderId: "417820640865",
  appId: "1:417820640865:web:9675a4a996763b51084c20",
  measurementId: "G-ZTTC8YDQ2J",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// ✅ Correct reCAPTCHA setup
export function setupRecaptcha(containerId: string) {
  const w = window as any;
  if (!w.recaptchaVerifier) {
    w.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      {
        size: 'invisible',
        callback: () => console.log("reCAPTCHA solved ✅"),
      },
      auth
    );
    w.recaptchaVerifier.render(); // required on web
  }
  return w.recaptchaVerifier;
}
