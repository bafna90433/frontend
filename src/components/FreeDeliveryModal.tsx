import { useEffect, useMemo, useState } from "react";

type Props = {
  cartTotal: number;
  limit: number;
};

const STORAGE_KEY = "freeDeliverySkip";

const FreeDeliveryModal = ({ cartTotal, limit }: Props) => {
  const [show, setShow] = useState(false);

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

        <button onClick={close} style={styles.btn}>
          Ok
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
};