import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FloatingCheckoutButton.css";
import { FiShoppingCart } from "react-icons/fi";
import { useShop } from "../context/ShopContext";

const FloatingCheckoutButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems } = useShop();

  // ✅ User check
  const user = React.useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );
  const isApproved = user?.isApproved === true;
  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!user;

  // ✅ Calculate total quantity & total price
  const cartCount = cartItems.reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );
  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.price || 0;
    return total + (item.quantity || 0) * price;
  }, 0);

  // ❌ Hide if cart empty
  if (cartCount === 0) return null;

  return (
    <button
      className="floating-checkout-btn"
      aria-label="Floating Checkout Button"
      onClick={() =>
        isApproved ? navigate("/checkout") : navigate("/login")
      }
    >
      <FiShoppingCart className="checkout-icon" aria-hidden="true" />

      <span className="checkout-text">
        {isApproved
          ? "Proceed to Checkout"
          : isLoggedIn
          ? "Awaiting Approval"
          : "Login to Checkout"}
      </span>

      {/* ✅ Quantity badge */}
      <span className="checkout-badge" aria-label={`Cart items: ${cartCount}`}>
        {cartCount}
      </span>

      {/* ✅ Admin only → show cart total */}
      {isApproved && isAdmin && (
        <span className="checkout-total">
          ₹{cartTotal.toLocaleString("en-IN")}
        </span>
      )}
    </button>
  );
};

export default FloatingCheckoutButton;
