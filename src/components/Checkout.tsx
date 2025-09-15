import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import api, { MEDIA_URL } from "../utils/api";
import "../styles/Checkout.css";

const Checkout: React.FC = () => {
  const { cartItems, setCartItemQuantity, clearCart, removeFromCart } = useShop();
  const navigate = useNavigate();

  const [payment] = useState<"cod">("cod");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const IMAGE_BASE_URL = `${MEDIA_URL}/uploads/`;

  // ✅ User check
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved === true;
  const isAdmin = user?.role === "admin";

  // ✅ Calculation
  const getItemTotalPrice = (item: any) => {
    const sortedTiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
    const inners = item.quantity || 0;

    const activeTier =
      sortedTiers.length > 0
        ? sortedTiers.reduce(
            (prev, tier) => (inners >= tier.inner ? tier : prev),
            sortedTiers[0]
          )
        : null;

    if (!activeTier) return 0;

    const piecesPerInner =
      item.innerQty && item.innerQty > 0
        ? item.innerQty
        : activeTier.qty > 0
        ? activeTier.qty / activeTier.inner
        : 1;

    const totalPieces = inners * piecesPerInner;
    return totalPieces * activeTier.price;
  };

  const totalInners = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const grandTotal = cartItems.reduce((sum, item) => sum + getItemTotalPrice(item), 0);

  // ✅ Place Order
  const handlePlaceOrder = async () => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(raw);

    if (!cartItems.length) return alert("Cart is empty.");

    const items = cartItems.map((i: any) => {
      const sortedTiers = [...(i.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
      const activeTier =
        sortedTiers.length > 0
          ? sortedTiers.reduce(
              (prev, tier) => (i.quantity >= tier.inner ? tier : prev),
              sortedTiers[0]
            )
          : null;

      const piecesPerInner =
        i.innerQty && i.innerQty > 0
          ? i.innerQty
          : activeTier && activeTier.inner > 0
          ? activeTier.qty / activeTier.inner
          : 1;

      const totalPieces = (i.quantity || 0) * piecesPerInner;

      return {
        productId: i._id,
        name: i.name,
        qty: totalPieces,
        innerQty: piecesPerInner,
        inners: i.quantity || 0,
        price: activeTier ? activeTier.price : i.price || 0,
        image: i.image || i.images?.[0] || "",
      };
    });

    const payload: any = {
      customerId: user._id,
      items,
      total: grandTotal,
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
          const sortedTiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
          const inners = item.quantity || 0;

          const imgSrc = item.image?.startsWith("http")
            ? item.image
            : item.image?.includes("/uploads/")
            ? `${MEDIA_URL}${item.image}`
            : `${IMAGE_BASE_URL}${encodeURIComponent(item.image || "")}`;

          const activeTier =
            sortedTiers.length > 0
              ? sortedTiers.reduce(
                  (prev, tier) => (inners >= tier.inner ? tier : prev),
                  sortedTiers[0]
                )
              : null;

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

                {/* Quantity Selector */}
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

                <div className="checkout-item-total">Total Inners: {inners}</div>

                {/* ✅ Packing & Pricing */}
                <div className="packing-section">
                  <h4 className="packing-title">
                    <span className="packing-icon">P</span> Packing & Pricing
                  </h4>
                  <ul className="pricing-list">
                    {sortedTiers.map((tier) => {
                      const highlight =
                        activeTier && tier.inner === activeTier.inner;
                      return (
                        <li
                          key={tier.inner}
                          className={highlight ? "active-tier-row" : ""}
                        >
                          {tier.inner} inner ({tier.qty} pcs) 
                          {isApproved ? ` ₹${tier.price}/pc` : " 🔒"}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* ✅ Show total per product only if approved */}
                {isApproved && (
                  <div className="product-line-total">
                    <b>Line Total:</b> ₹{getItemTotalPrice(item).toLocaleString()}
                  </div>
                )}
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
          <p><b>Total Inners:</b> {totalInners}</p>
          {isApproved && (
            <p><b>Grand Total:</b> ₹{grandTotal.toLocaleString()}</p>
          )}
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
