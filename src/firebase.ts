import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4hfhVbPgZqQ0PoqQZ0Yrs8GekrbjBjY",   // from your WordPress digits config
  authDomain: "bafnatoys-otp.firebaseapp.com",
  projectId: "bafnatoys-otp",
  storageBucket: "bafnatoys-otp.appspot.com",
  messagingSenderId: "417820640865",
  appId: "1:417820640865:web:9675a4a996763b51084c20",
  measurementId: "G-ZTTC8YDQ2J",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Setup Recaptcha
export const setupRecaptcha = (containerId: string) => {
  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: "normal", // you can use 'invisible' also
    callback: (response: any) => {
      console.log("Recaptcha verified ✅", response);
    },
  });
  return verifier;
};
