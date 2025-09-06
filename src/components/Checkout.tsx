import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import api, { MEDIA_URL } from "../utils/api";
import "../styles/Checkout.css";

const Checkout: React.FC = () => {
  const { cartItems, setCartItemQuantity, clearCart, removeFromCart } = useShop();
  const navigate = useNavigate();

  const [payment] = useState<"cod">("cod"); // sirf COD
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const IMAGE_BASE_URL = `${MEDIA_URL}/uploads/`;

  // Helpers
  const piecesPerInnerFor = (item: any) => {
    if (item.innerQty && item.innerQty > 0) return item.innerQty;
    if (item.nosPerInner && item.nosPerInner > 0) return item.nosPerInner;
    return 1;
  };

  const getItemTotal = (item: any) => {
    const inners = item.quantity || 0;
    const totalPieces = inners * piecesPerInnerFor(item);
    return totalPieces;
  };

  const total = cartItems.reduce((sum, item) => sum + getItemTotal(item), 0);

  // Place order
  const handlePlaceOrder = async () => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(raw);

    if (!cartItems.length) return alert("Cart is empty.");

    const items = cartItems.map((i: any) => {
      const ppi = piecesPerInnerFor(i);
      const inners = i.quantity || 0;
      const totalPieces = inners * ppi;

      return {
        productId: i._id,
        name: i.name,
        qty: totalPieces,
        innerQty: ppi,
        inners: inners,
        price: i.price || 0, // ✅ backend ke liye bhejna zaroori hai
        image: i.image || i.images?.[0] || "",
      };
    });

    const payload: any = {
      customerId: user._id,
      items,
      total,
      paymentMethod: "COD",
    };

    try {
      setPlacing(true);
      const { data } = await api.post("/orders", payload);
      const on =
        data?.order?.orderNumber || data?.orderNumber || data?.order?.orderNumber;
      if (!on) throw new Error("Order number not returned");
      setOrderNumber(on);
      setOrderPlaced(true);
      clearCart();
    } catch (err: any) {
      console.error("Order place error:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Could not place order. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  };

  if (cartItems.length === 0 && !orderPlaced) {
    return <div className="checkout-empty">No items in cart.</div>;
  }

  if (orderPlaced) {
    return (
      <div className="checkout-success">
        <h2>Order placed successfully!</h2>
        <p>
          Thank you for your purchase.<br />
          <b>Your Order Number: {orderNumber}</b>
        </p>
      </div>
    );
  }

  return (
    <div className="checkout-wrapper two-column">
      {/* LEFT: CART ITEMS */}
      <div className="checkout-left">
        <h2>Your Order</h2>
        {cartItems.map((item: any) => {
          const sortedTiers = [...(item.bulkPricing || [])].sort(
            (a, b) => a.inner - b.inner
          );
          const inners = item.quantity || 0;
          const piecesPerInner = piecesPerInnerFor(item);

          const imgSrc = item.image?.startsWith("http")
            ? item.image
            : item.image?.includes("/uploads/")
            ? `${MEDIA_URL}${item.image}`
            : `${IMAGE_BASE_URL}${encodeURIComponent(item.image || "")}`;

          return (
            <div key={item._id} className="checkout-item">
              <div className="checkout-image-wrapper">
                <img
                  src={imgSrc}
                  alt={item.name}
                  className="checkout-item-big-img"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).src = "/placeholder.png")
                  }
                />
              </div>
              <div className="checkout-item-info">
                <div className="checkout-item-name">
                  {item.name}
                  <button
                    className="checkout-remove-btn"
                    onClick={() => removeFromCart(item._id)}
                    title="Remove from cart"
                  >
                    🗑
                  </button>
                </div>

                {/* Fancy Quantity Selector */}
                <div className="checkout-item-qty fancy-qty">
                  <button
                    className="qty-btn"
                    onClick={() =>
                      setCartItemQuantity(item, Math.max(1, item.quantity - 1))
                    }
                  >
                    –
                  </button>
                  <span className="qty-value">{inners}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setCartItemQuantity(item, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <div className="checkout-item-total">
                  Total Inners: {inners}
                </div>

                {/* Bulk Price Table (without Price column) */}
                <table className="bulk-table">
                  <thead>
                    <tr>
                      <th>Inner Qty</th>
                      <th>Total Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTiers.map((tier, i) => {
                      const tierQty =
                        tier.inner > 0 && piecesPerInner > 0
                          ? tier.inner * piecesPerInner
                          : tier.qty || "-";
                      const nextInner = sortedTiers[i + 1]?.inner ?? Infinity;
                      const highlight =
                        inners >= tier.inner && inners < nextInner;
                      return (
                        <tr key={i} className={highlight ? "highlight" : ""}>
                          <td>{tier.inner}+</td>
                          <td>{tierQty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT: ORDER SUMMARY */}
      <div className="checkout-right checkout-card">
        <h2 className="checkout-title">Complete Your Order</h2>

        <div className="checkout-summary">
          <p><b>Total Items:</b> {cartItems.length}</p>
          <p><b>Total Inners:</b> {total}</p>
        </div>

        <div className="checkout-payments clean-payments">
          <b>Select Payment</b>
          <div className="payment-option active">
            <span>💵 Cash on Delivery</span>
          </div>
        </div>

        <button
          className="checkout-placeorder modern-btn"
          onClick={handlePlaceOrder}
          disabled={placing || !cartItems.length}
        >
          {placing ? "Placing Order..." : "✅ Place Order"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
