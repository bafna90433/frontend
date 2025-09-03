import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import api, { MEDIA_URL } from "../utils/api";
import "../styles/Checkout.css";

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

const LOCAL_KEY = "bt.addresses";

const Checkout: React.FC = () => {
  const { cartItems, setCartItemQuantity, clearCart, removeFromCart } = useShop();

  const [addrLoading, setAddrLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState(false);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"cod" | "online">("cod");

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const IMAGE_BASE_URL = `${MEDIA_URL}/uploads/`;

  // Helpers
  const piecesPerInnerFor = (item: any) => {
    const bulkPricing = Array.isArray(item.bulkPricing) ? item.bulkPricing : [];
    if (item.innerQty && item.innerQty > 0) return item.innerQty;
    if (item.nosPerInner && item.nosPerInner > 0) return item.nosPerInner;
    if (bulkPricing.length > 0 && bulkPricing[0].qty > 0 && bulkPricing[0].inner > 0) {
      return bulkPricing[0].qty / bulkPricing[0].inner;
    }
    return 1;
  };

  const activeUnitPriceFor = (item: any) => {
    const bulkPricing = Array.isArray(item.bulkPricing) ? item.bulkPricing : [];
    const tiers = [...bulkPricing].sort((a, b) => a.inner - b.inner);
    const innerCount = item.quantity || 0;
    if (tiers.length === 0) return item.price || 0;
    const active = tiers.reduce(
      (m, t) => (innerCount >= t.inner ? t : m),
      tiers[0] || { inner: 0, price: item.price }
    );
    return active?.price ?? item.price ?? 0;
  };

  const getItemTotal = (item: any) => {
    const inners = item.quantity || 0;
    const totalPieces = inners * piecesPerInnerFor(item);
    const unitPrice = activeUnitPriceFor(item);
    return totalPieces * unitPrice;
  };

  const total = cartItems.reduce((sum, item) => sum + getItemTotal(item), 0);

  const isPhoneValid = /^\d{10}$/.test(phone);
  const isEmailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Fetch saved addresses
  useEffect(() => {
    (async () => {
      setAddrLoading(true);
      try {
        const { data } = await api.get("/addresses");
        const list: Address[] = Array.isArray(data) ? data : (data?.data ?? []);
        setAddresses(list);
      } catch {
        const raw = localStorage.getItem(LOCAL_KEY);
        setAddresses(raw ? JSON.parse(raw) : []);
      } finally {
        setAddrLoading(false);
      }
    })();
  }, []);

  const addrToString = (a: Address) =>
    [a.line1, a.line2, `${a.city}, ${a.state} ${a.zip}`].filter(Boolean).join(", ");

  useEffect(() => {
    if (addrLoading) return;
    if (!addresses.length) {
      setSelectedAddressId(null);
      return;
    }
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
    setPhone(a.phone || "");
    setAddress(addrToString(a));
    setManualAddress(false);
  }, [selectedAddressId, addresses]);

  // Place order
  const handlePlaceOrder = async () => {
    if (!manualAddress && selectedAddressId) {
      const a = addresses.find((x) => x._id === selectedAddressId);
      if (!a) return alert("Please select a shipping address.");
      if (!/^\d{10}$/.test(a.phone || "")) return alert("Selected address has invalid phone.");
    }
    if (!address.trim()) return alert("Please enter/select your address.");
    if (!isPhoneValid) return alert("Enter a valid 10-digit phone number.");
    if (!isEmailValid) return alert("Enter a valid email address.");

    const raw = localStorage.getItem("user");
    if (!raw) return alert("Please login to place an order.");
    const user = JSON.parse(raw);

    if (!cartItems.length) return alert("Cart is empty.");

    // Build items: send qty (pieces), innerQty, inners
    const items = cartItems.map((i: any) => {
      const ppi = piecesPerInnerFor(i);       // pieces per inner
      const inners = i.quantity || 0;         // selected inners
      const totalPieces = inners * ppi;       // total pieces
      const unitPrice = activeUnitPriceFor(i);

      return {
        productId: i._id,
        name: i.name,
        qty: totalPieces,      // ✅ total pieces
        innerQty: ppi,         // ✅ pieces per inner
        inners: inners,        // ✅ user selected inners
        price: unitPrice,      // price per piece
        image: i.image || i.images?.[0] || "",
      };
    });

    const payload: any = {
      customerId: user._id,
      items,
      total,
      paymentMethod: payment === "cod" ? "COD" : "ONLINE",
      shipping: { address, phone, email, notes },
    };

    if (selectedAddressId) payload.shipping.selectedAddressId = selectedAddressId;

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
      <div className="checkout-left">
        <h2>Your Order</h2>
        {cartItems.map((item: any) => {
          const sortedTiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
          const inners = item.quantity || 0;
          const piecesPerInner = piecesPerInnerFor(item);
          const unitPrice = activeUnitPriceFor(item);

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

                <div className="checkout-item-qty">
                  <button
                    onClick={() =>
                      setCartItemQuantity(item, Math.max(1, item.quantity - 1))
                    }
                  >
                    –
                  </button>
                  {item.quantity}
                  <button
                    onClick={() => setCartItemQuantity(item, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <div className="checkout-item-total">
                  Total Inners: {inners}
                </div>

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

      <div className="checkout-right">
        <h2>Shipping & Payment</h2>

        <section className="ship-address-section">
          <div className="ship-head">
            <b>Select Shipping Address</b>
            <Link to="/addresses" className="btn-link">
              Add / Manage
            </Link>
          </div>

          {addrLoading ? (
            <div>Loading addresses…</div>
          ) : addresses.length === 0 ? (
            <div>
              No saved addresses. <Link to="/addresses">Add one</Link>
            </div>
          ) : (
            <ul className="addr-radio-list">
              {addresses.map((a) => (
                <li key={a._id}>
                  <label>
                    <input
                      type="radio"
                      name="shippingAddress"
                      checked={selectedAddressId === a._id}
                      onChange={() => setSelectedAddressId(a._id!)}
                    />
                    {a.fullName} — {addrToString(a)} (📞 {a.phone})
                  </label>
                </li>
              ))}
            </ul>
          )}

          <label>
            <input
              type="checkbox"
              checked={manualAddress}
              onChange={(e) => setManualAddress(e.target.checked)}
            />
            Enter a different address
          </label>
        </section>

        <input
          className="checkout-input"
          type="text"
          placeholder="Your Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          className="checkout-input"
          type="email"
          placeholder="Your Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <textarea
          className="checkout-address"
          placeholder="Enter shipping address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={!manualAddress && !!selectedAddressId}
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
              disabled
            />
            Pay Online (Coming Soon)
          </label>
        </div>

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
