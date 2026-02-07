import { useEffect, useState } from "react";

type Props = {
  cartTotal: number;
  limit: number;
};

const FreeDeliveryModal = ({ cartTotal, limit }: Props) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const skipped = localStorage.getItem("freeDeliverySkip");

    if (!limit || limit <= 0) return setShow(false);
    if (skipped || cartTotal >= limit) return setShow(false);

    setShow(true);
  }, [cartTotal, limit]);

  const close = () => {
    localStorage.setItem("freeDeliverySkip", "1");
    setShow(false);
  };

  if (!show) return null;

  const remaining = Math.max(0, limit - cartTotal);

  return (
    <div style={styles.overlay} onClick={close}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={close} style={styles.closeBtn}>✕</button>
        <h1 style={styles.title}>FREE Door Delivery 🚚</h1>
        <p style={styles.text}>
          Get FREE Door Delivery on orders above <b>₹{limit}</b>.
        </p>
        <p style={styles.subText}>
          Add <b>₹{remaining}</b> more to unlock.
        </p>
        <button onClick={close} style={styles.btn}>Skip</button>
      </div>
    </div>
  );
};

export default FreeDeliveryModal;

const styles: any = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: "1000px",
    maxHeight: "1000px",
    background: "#fff",
    borderRadius: 20,
    padding: 60,
    textAlign: "center",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  closeBtn: {
    position: "absolute",
    top: 18,
    right: 18,
    border: "none",
    background: "transparent",
    fontSize: 26,
    cursor: "pointer",
  },
  title: { fontSize: 44, marginBottom: 16 },
  text: { fontSize: 22, marginBottom: 10 },
  subText: { fontSize: 20, marginBottom: 30, color: "#444" },
  btn: {
    padding: "14px 30px",
    fontSize: 18,
    borderRadius: 999,
    border: "none",
    background: "#0072ff",
    color: "#fff",
    cursor: "pointer",
  },
};
