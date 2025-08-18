// src/components/Checkout.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "../styles/Checkout.css";

const API = "http://localhost:5000";
const LOCAL_KEY = "bt.addresses"; // same as ManageAddresses

type Address = {
  _id?: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  label?: "Home" | "Office" | "Other";
  isDefault?: boolean;
};

const Checkout: React.FC = () => {
  const { cartItems, setCartItemQuantity, clearCart, removeFromCart } = useShop();

  // ========== NEW: addresses ==========
  const [addrLoading, setAddrLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState(false);

  // shipping/contact fields
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"cod" | "online">("cod");

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

  // helpers — same logic you already use for bulk pricing
  const piecesPerInnerFor = (item: any) => {
    const bulkPricing = Array.isArray(item.bulkPricing) ? item.bulkPricing : [];
    return item.innerQty && item.innerQty > 0
      ? item.innerQty
      : bulkPricing[0]?.qty > 0 && bulkPricing[0]?.inner > 0
      ? bulkPricing[0].qty / bulkPricing[0].inner
      : 1;
  };

  const activeUnitPriceFor = (item: any) => {
    const bulkPricing = Array.isArray(item.bulkPricing) ? item.bulkPricing : [];
    const tiers = [...bulkPricing].sort((a, b) => a.inner - b.inner);
    const innerCount = item.quantity || 0;
    const activeTier =
      tiers.reduce((m, t) => (innerCount >= t.inner ? t : m), tiers[0] || { inner: 0, price: item.price }) ||
      { price: item.price };
    return activeTier.price || item.price;
  };

  const getItemTotal = (item: any) => {
    const innerCount = item.quantity || 0;
    const totalPieces = innerCount * piecesPerInnerFor(item);
    const unitPrice = activeUnitPriceFor(item);
    return totalPieces * unitPrice;
  };

  const total = cartItems.reduce((sum, item) => sum + getItemTotal(item), 0);

  const isPhoneValid = /^\d{10}$/.test(phone);
  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // -------- fetch saved addresses (tries API then localStorage fallback) --------
  useEffect(() => {
    (async () => {
      setAddrLoading(true);
      try {
        // Try API (ManageAddresses uses api `/addresses`)
        const { data } = await axios.get(`${API}/addresses`);
        const list: Address[] = Array.isArray(data) ? data : (data?.data ?? []);
        setAddresses(list);
      } catch {
        // Fallback to local
        const raw = localStorage.getItem(LOCAL_KEY);
        setAddresses(raw ? JSON.parse(raw) : []);
      } finally {
        setAddrLoading(false);
      }
    })();
  }, []);

  // build display string from Address
  const addrToString = (a: Address) =>
    [a.line1, a.line2, `${a.city}, ${a.state} ${a.zip}`].filter(Boolean).join(", ");

  // preselect default and hydrate fields when selected changes
  useEffect(() => {
    if (addrLoading) return;
    if (!addresses.length) {
      setSelectedAddressId(null);
      return;
    }

    // set default on first load if nothing selected
    setSelectedAddressId((prev) => {
      if (prev) return prev;
      const def = addresses.find((x) => x.isDefault);
      return def?._id || addresses[0]._id || null;
    });
  }, [addrLoading, addresses]);

  useEffect(() => {
    if (!selectedAddressId) return;
    const a = addresses.find((x) => x._id === selectedAddressId);
    if (!a) return;
    // Auto-fill
    setPhone(a.phone || "");
    setAddress(addrToString(a));
    // Email saved nahi hai addresses me – user jo bhi pehle bhara hai woh rahega
    setManualAddress(false); // default: use selected address, not manual
  }, [selectedAddressId]); // eslint-disable-line

  // ================== ORDER FLOW ==================
  const handlePlaceOrder = async () => {
    if (!manualAddress && selectedAddressId) {
      // using saved address — ensure it exists and we have phone
      const a = addresses.find((x) => x._id === selectedAddressId);
      if (!a) return alert("Please select a shipping address.");
      if (!/^\d{10}$/.test(a.phone || "")) return alert("Selected address has invalid phone.");
    }

    if (!address.trim()) return alert("Please enter/select your address.");
    if (!isPhoneValid) return alert("Enter a valid 10-digit phone number.");
    if (!isEmailValid) return alert("Enter a valid email address.");

    const raw = localStorage.getItem("user");
    if (!raw) {
      alert("Please login to place an order.");
      return;
    }
    const user = JSON.parse(raw); // should contain _id

    if (!cartItems.length) {
      alert("Cart is empty.");
      return;
    }

    // Build payload expected by backend
    const items = cartItems.map((i: any) => ({
      productId: i._id,
      name: i.name,
      // backend stores qty in *pieces*
      qty: (i.quantity || 0) * piecesPerInnerFor(i),
      price: activeUnitPriceFor(i),
      image: i.image,
    }));

    const payload: any = {
      customerId: user._id,
      items,
      total,
      paymentMethod: payment === "cod" ? "COD" : "ONLINE",
      shipping: {
        address,
        phone,
        email,
        notes,
      },
    };

    // (optional) attach selectedAddressId for backend reference
    if (selectedAddressId) payload.shipping.selectedAddressId = selectedAddressId;

    try {
      setPlacing(true);
      const { data } = await axios.post(`${API}/api/orders`, payload);
      const on = data?.order?.orderNumber;
      if (!on) {
        throw new Error("Order number not returned");
      }
      setOrderNumber(on);
      setOrderPlaced(true);
      clearCart();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Could not place order. Please try again.");
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
      {/* LEFT */}
      <div className="checkout-left">
        <h2>Your Order</h2>
        {cartItems.map((item: any) => {
          const bulkPricing = Array.isArray(item.bulkPricing) ? item.bulkPricing : [];
          const sortedTiers = [...bulkPricing].sort((a, b) => a.inner - b.inner);
          const innerCount = item.quantity || 0;
          const piecesPerInner = piecesPerInnerFor(item);
          const unitPrice = activeUnitPriceFor(item);

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
                  onError={(e) => ((e.target as HTMLImageElement).src = "/placeholder.png")}
                />
              </div>
              <div className="checkout-item-info">
                <div className="checkout-item-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {item.name}
                  <button
                    className="checkout-remove-btn"
                    style={{ background: "transparent", border: "none", color: "#e53935", cursor: "pointer", fontSize: 18, marginLeft: 8 }}
                    onClick={() => removeFromCart(item._id)}
                    title="Remove from cart"
                  >
                    🗑
                  </button>
                </div>

                <div className="checkout-item-qty">
                  <button className="qty-btn" onClick={() => setCartItemQuantity(item, Math.max(1, item.quantity - 1))}>–</button>
                  {item.quantity}
                  <button className="qty-btn" onClick={() => setCartItemQuantity(item, item.quantity + 1)}>+</button>
                  × ₹{unitPrice}
                </div>

                {/* Only "Total Inners" (quantity) is shown, NO price */}
                <div className="checkout-item-total">Total Inners: {item.quantity}</div>

                <table className="bulk-table">
                  <thead>
                    <tr>
                      <th>Inner Qty</th>
                      <th>Total Qty</th>
                      <th>Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTiers.map((tier, i) => {
                      const tierQty =
                        tier.inner > 0 && piecesPerInner > 0 ? tier.inner * piecesPerInner : tier.qty || "-";
                      const nextInner = sortedTiers[i + 1]?.inner ?? Infinity;
                      const highlight = innerCount >= tier.inner && innerCount < nextInner;
                      return (
                        <tr key={i} className={highlight ? "highlight" : ""}>
                          <td>{tier.inner}+</td>
                          <td>{tierQty}</td>
                          <td>₹{tier.price}</td>
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

      {/* RIGHT */}
      <div className="checkout-right">
        <h2>Shipping & Payment</h2>

        {/* ========== NEW: Select Shipping Address ========== */}
        <section className="ship-address-section">
          <div className="ship-head">
            <b>Select Shipping Address</b>
            <Link to="/addresses" className="btn-link">Add / Manage</Link>
          </div>

          {addrLoading ? (
            <div className="addr-skel">Loading addresses…</div>
          ) : addresses.length === 0 ? (
            <div className="addr-empty">
              No saved addresses. <Link to="/addresses" className="btn-link">Add one</Link>
            </div>
          ) : (
            <ul className="addr-radio-list">
              {addresses.map((a) => (
                <li key={a._id} className={`addr-radio-item ${selectedAddressId === a._id ? "sel" : ""}`}>
                  <label>
                    <input
                      type="radio"
                      name="shippingAddress"
                      checked={selectedAddressId === a._id}
                      onChange={() => setSelectedAddressId(a._id!)}
                    />
                    <div className="addr-card-mini">
                      <div className="addr-row-1">
                        <span className="addr-name">{a.fullName}</span>
                        {a.isDefault && <span className="addr-chip">Default</span>}
                      </div>
                      <div className="addr-row-2">{addrToString(a)}</div>
                      <div className="addr-row-3">📞 {a.phone}</div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="addr-edit-toggle">
            <label>
              <input
                type="checkbox"
                checked={manualAddress}
                onChange={(e) => setManualAddress(e.target.checked)}
              />{" "}
              Enter a different address
            </label>
          </div>
        </section>

        {/* Contact / Shipping inputs */}
        <input
          className="checkout-input"
          type="text"
          placeholder="Your Phone (10 digits)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={10}
          style={{ borderColor: phone && !isPhoneValid ? "#e53935" : undefined }}
        />

        {/* Optional email */}
        <input
          className="checkout-input"
          type="email"
          placeholder="Your Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ borderColor: email && !isEmailValid ? "#e53935" : undefined }}
        />

        <textarea
          className="checkout-address"
          placeholder="Enter shipping address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={!manualAddress && !!selectedAddressId}  /* lock when using saved address */
        />

        <textarea
          className="checkout-notes"
          placeholder="Order notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="checkout-payments">
          <b>Payment Method:</b>
          <label>
            <input type="radio" checked={payment === "cod"} onChange={() => setPayment("cod")} />
            Cash on Delivery
          </label>
          <label>
            <input type="radio" checked={payment === "online"} onChange={() => setPayment("online")} disabled />
            Pay Online (Coming Soon)
          </label>
        </div>

        {/* Order total hidden from user, for admin use */}
        <div className="checkout-total" style={{ display: "none" }}>
          <strong>Total: ₹{total.toLocaleString()}</strong>
        </div>

        <button
          className="checkout-placeorder"
          onClick={handlePlaceOrder}
          disabled={placing || !address.trim() || !isPhoneValid || !isEmailValid}
        >
          {placing ? "Placing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
