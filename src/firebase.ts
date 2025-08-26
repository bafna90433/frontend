// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD4hfhVpBgdZqQ0PoqQZ0Yrs8GekrbjBjY",
  authDomain: "bafnatoys-otp.firebaseapp.com",
  projectId: "bafnatoys-otp",
  storageBucket: "bafnatoys-otp.appspot.com",
  messagingSenderId: "417820640865",
  appId: "1:417820640865:web:9675a4a996763b51084c20"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Creates (or reuses) a RecaptchaVerifier instance.
 * Ensures #containerId exists, clears previous verifier, renders widget and returns it.
 * Returns null on SSR or failure.
 */
export async function setupRecaptcha(containerId = "recaptcha-container") {
  if (typeof window === "undefined") return null;

  const win = window as any;

  if (!auth) {
    console.error("[setupRecaptcha] auth is undefined");
    return null;
  }

  // ensure container exists
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    // keep it off-screen when using invisible size
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);
    console.warn(`[setupRecaptcha] created missing #${containerId}`);
  }

  // clear previous verifier if any
  if (win.recaptchaVerifier) {
    try { win.recaptchaVerifier.clear?.(); } catch (e) { /* ignore */ }
    win.recaptchaVerifier = null;
  }

  try {
    // correct order: container (string or element), options, auth
    win.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      { size: "invisible", callback: () => console.log("reCAPTCHA solved") },
      auth as Auth
    );

    // wait for render to finish — render() returns a Promise<number>
    if (typeof win.recaptchaVerifier.render === "function") {
      await win.recaptchaVerifier.render();
    }

    console.log("[setupRecaptcha] created and rendered verifier", win.recaptchaVerifier);
    return win.recaptchaVerifier as RecaptchaVerifier;
  } catch (err) {
    console.error("[setupRecaptcha] error creating RecaptchaVerifier:", err);
    return null;
  }
}
