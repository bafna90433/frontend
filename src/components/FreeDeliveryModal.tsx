import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

type Props = {
  cartTotal: number;
  limit: number;
};

const STORAGE_KEY = "freeDeliverySkip";

const FreeDeliveryModal = ({ cartTotal, limit }: Props) => {
  const [show, setShow] = useState(false);
  const [discountRules, setDiscountRules] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/discount-rules")
      .then((res) => {
        setDiscountRules(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.log("Failed to load discount rules:", err));
  }, []);

  const remaining = useMemo(() => Math.max(0, (limit || 0) - (cartTotal || 0)), [cartTotal, limit]);

  useEffect(() => {
    if (!limit || limit <= 0 || cartTotal >= limit) {
      setShow(false);
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const today = new Date().toLocaleDateString('en-CA');
      const [flag, date] = saved.split("|");
      if (flag === "1" && date === today) {
        setShow(false);
        return;
      }
    }

    setShow(true);
  }, [cartTotal, limit]);

  useEffect(() => {
    if (!show) return;

    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    
    window.addEventListener("keydown", onKeyDown, { passive: true });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [show]);

  const close = () => {
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem(STORAGE_KEY, `1|${today}`);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={styles.overlay} onClick={close} role="dialog" aria-modal="true" aria-label="Free delivery offer">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={close} style={styles.closeBtn} aria-label="Close">
          ✕
        </button>

        <div style={styles.iconWrap} aria-hidden>
          🚚
        </div>

        <h2 style={styles.title}>FREE Door Delivery</h2>

        <p style={styles.text}>
          Get FREE Door Delivery on orders above <b>₹{Number(limit).toLocaleString()}</b>.
        </p>

        <p style={styles.subText}>
          Add <b>₹{Number(remaining).toLocaleString()}</b> more to unlock.
        </p>

        {discountRules.length > 0 && (
          <div style={styles.discountBox}>
            <div style={styles.discountTitle}>⚡ Volume Discounts Active!</div>
            <div style={styles.discountRules}>
              {discountRules.map((r, i) => (
                <div key={i} style={styles.discountRule}>
                  <span>₹{Number(r.minAmount).toLocaleString()}+</span>
                  <strong>{r.discountPercentage}% OFF</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={close} style={styles.btn}>
          Got it!

        </button>
      </div>
    </div>
  );
};

export default FreeDeliveryModal;

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    width: "min(92vw, 520px)",
    maxHeight: "min(86vh, 520px)",
    background: "#fff",
    borderRadius: 18,
    padding: "24px 18px",
    textAlign: "center",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    overflow: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    border: "none",
    background: "transparent",
    fontSize: 22,
    cursor: "pointer",
    lineHeight: 1,
    padding: 6,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    margin: "6px auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,107,107,0.12)",
    fontSize: 26,
  },
  title: {
    fontSize: 22,
    margin: "8px 0 10px",
    fontWeight: 800,
  },
  text: {
    fontSize: 14,
    margin: "0 0 6px",
    color: "#111827",
    lineHeight: 1.35,
  },
  subText: {
    fontSize: 13,
    margin: "0 0 16px",
    color: "#374151",
    lineHeight: 1.35,
  },
  btn: {
    padding: "10px 18px",
    fontSize: 14,
    borderRadius: 999,
    border: "none",
    background: "#1d4ed8",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    width: "min(260px, 100%)",
  },
  discountBox: {
    background: "rgba(168, 85, 247, 0.08)",
    border: "1px dashed rgba(168, 85, 247, 0.4)",
    borderRadius: 14,
    padding: "16px",
    margin: "8px 0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  discountTitle: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  discountRules: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  discountRule: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 13,
    color: "#4b5563",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  },
};