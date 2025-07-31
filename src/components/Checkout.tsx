import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import "../styles/Checkout.css";

const Checkout: React.FC = () => {
  const { cartItems, setCartItemQuantity, clearCart } = useShop();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState("cod");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

  const getItemTotal = (item: any) => {
    const tiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
    const innerCount = item.quantity || 0;
    const activeTier = tiers.reduce(
      (match, tier) => (innerCount >= tier.inner ? tier : match),
      tiers[0]
    );
    const unitPrice = activeTier?.price || item.price;
    const totalQty = innerCount * (item.innerQty || 1);
    return unitPrice * totalQty;
  };

  const total = cartItems.reduce((sum, item) => sum + getItemTotal(item), 0);

  const isPhoneValid = /^\d{10}$/.test(phone);
  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handlePlaceOrder = () => {
    if (!address.trim()) return alert("Please enter your address.");
    if (!isPhoneValid) return alert("Enter a valid 10-digit phone number.");
    if (!isEmailValid) return alert("Enter a valid email address.");
    const num = "ODR" + (100000 + Math.floor(Math.random() * 900000));
    setOrderNumber(num);
    setOrderPlaced(true);
    clearCart();
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
      {/* LEFT */}
      <div className="checkout-left">
        <h2>Your Order</h2>
        {cartItems.map(item => {
          const sortedTiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
          const innerCount = item.quantity || 0;
          const activeTier = sortedTiers.reduce(
            (match, tier) => (innerCount >= tier.inner ? tier : match),
            sortedTiers[0]
          );
          const unitPrice = activeTier?.price || item.price;
          const totalPrice = getItemTotal(item);

          const imgSrc = item.image?.startsWith("http")
            ? item.image
            : item.image?.includes("/uploads/")
              ? `http://localhost:5000${item.image}`
              : `${IMAGE_BASE_URL}${encodeURIComponent(item.image || "")}`;

          return (
            <div key={item._id} className="checkout-item">
              <div className="checkout-image-wrapper">
                <img
                  src={imgSrc}
                  alt={item.name}
                  className="checkout-item-big-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
              </div>
              <div className="checkout-item-info">
                <div className="checkout-item-name">{item.name}</div>
                <div className="checkout-item-qty">
                  <button onClick={() => setCartItemQuantity(item, Math.max(1, item.quantity - 1))}>–</button>
                  {item.quantity}
                  <button onClick={() => setCartItemQuantity(item, item.quantity + 1)}>+</button>
                  × ₹{unitPrice}
                </div>
                <div className="checkout-item-total">Total: ₹{totalPrice}</div>

                <table className="bulk-table">
                  <thead>
                    <tr>
                      <th>Inner Qty</th>
                      <th>Total Qty</th>
                      <th>Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTiers.map((tier, i) => (
                      <tr
                        key={i}
                        className={
                          innerCount >= tier.inner &&
                          innerCount < (sortedTiers[i + 1]?.inner || Infinity)
                            ? "highlight"
                            : ""
                        }
                      >
                        <td>{tier.inner}+</td>
                        <td>{tier.qty}</td>
                        <td>₹{tier.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT */}
      <div className="checkout-right">
        <h2>Shipping & Payment</h2>
        <input
          className="checkout-input"
          type="text"
          placeholder="Your Phone (10 digits)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          maxLength={10}
          style={{ borderColor: phone && !isPhoneValid ? "#e53935" : undefined }}
        />
        <input
          className="checkout-input"
          type="email"
          placeholder="Your Email (optional)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ borderColor: email && !isEmailValid ? "#e53935" : undefined }}
        />
        <textarea
          className="checkout-address"
          placeholder="Enter shipping address"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
        <textarea
          className="checkout-notes"
          placeholder="Order notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <div className="checkout-payments">
          <b>Payment Method:</b>
          <label>
            <input
              type="radio"
              checked={payment === "cod"}
              onChange={() => setPayment("cod")}
            />
            Cash on Delivery
          </label>
          <label>
            <input
              type="radio"
              checked={payment === "online"}
              onChange={() => setPayment("online")}
              disabled
            />
            Pay Online (Coming Soon)
          </label>
        </div>
        <div className="checkout-total">
          <strong>Total: ₹{total.toLocaleString()}</strong>
        </div>
        <button
          className="checkout-placeorder"
          onClick={handlePlaceOrder}
          disabled={!address.trim() || !isPhoneValid || !isEmailValid}
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default Checkout;
