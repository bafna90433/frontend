import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FloatingCheckoutButton.css";
import { FiShoppingCart } from "react-icons/fi";
import { useShop } from "../context/ShopContext";

const FloatingCheckoutButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems } = useShop();

  // ✅ User check
  const user = JSON.parse(localStorage.getItem("user") || "null");
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
      onClick={() =>
        isApproved ? navigate("/checkout") : navigate("/login")
      }
    >
      <FiShoppingCart className="checkout-icon" />
      <span className="checkout-text">
        {isApproved
          ? "Proceed to Checkout"
          : isLoggedIn
          ? "Awaiting Approval"
          : "Login to Checkout"}
      </span>

      <span className="checkout-badge">{cartCount}</span>

      {/* ✅ Admin only → show cart total */}
      {isApproved && isAdmin && (
        <span className="checkout-total">₹{cartTotal.toLocaleString()}</span>
      )}
    </button>
  );
};

export default FloatingCheckoutButton;
