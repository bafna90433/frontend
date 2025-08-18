import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/FloatingCheckoutButton.css';
import { FiShoppingCart } from 'react-icons/fi';
import { useShop } from '../context/ShopContext'; // ✅ Import cart context

const FloatingCheckoutButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems } = useShop(); // ✅ Get cart data

  // ✅ Calculate total quantity
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 0), 0);

  // Hide button if cart is empty (optional)
  if (cartCount === 0) return null;

  return (
    <button
      className="floating-checkout-btn"
      onClick={() => navigate('/checkout')}
    >
      <FiShoppingCart className="checkout-icon" />
      <span className="checkout-text">Proceed to Checkout</span>
      <span className="checkout-badge">{cartCount}</span> {/* ✅ Show count */}
    </button>
  );
};

export default FloatingCheckoutButton;
