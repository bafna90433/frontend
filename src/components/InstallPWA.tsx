import React, { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const COOLDOWN_DAYS = 7; // kitne din baad phir dikhana
const LS_KEY = "pwa_install_prompt_hidden_until";

function getHiddenUntil(): number {
  const v = localStorage.getItem(LS_KEY);
  return v ? Number(v) : 0;
}

function hideForDays(days: number) {
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(LS_KEY, String(until));
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // already installed?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) return;

    // cooldown check
    if (Date.now() < getHiddenUntil()) return;

    const handler = (e: Event) => {
      // Chrome install prompt ko intercept karo
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // ✅ Open hote hi aapka popup show
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If installed later
    window.addEventListener("appinstalled", () => {
      setShow(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    } else {
      // user ne cancel kiya => 7 din ke liye hide
      hideForDays(COOLDOWN_DAYS);
      setShow(false);
    }
  };

  const onClose = () => {
    hideForDays(COOLDOWN_DAYS);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: "#fff",
          borderRadius: 18,
          padding: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            BT
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              Install Bafna Toys App
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Faster checkout • Home screen icon • App-like experience
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Not now
          </button>

          <button
            onClick={onInstall}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 12,
              border: "none",
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
