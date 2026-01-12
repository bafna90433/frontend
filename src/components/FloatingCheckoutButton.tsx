import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/FloatingCheckoutButton.css";
import { FiShoppingBag, FiArrowRight, FiCheckCircle, FiTruck } from "react-icons/fi";
import { useShop } from "../context/ShopContext";

const FloatingCheckoutButton: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, freeShippingThreshold } = useShop();
  const buttonRef = useRef<HTMLDivElement>(null);

  const user = React.useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );
  const isLoggedIn = !!user;

  const cartCount = cartItems.reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );

  const cartTotal = cartItems.reduce((total, item) => {
    const price = item.price || 0;
    return total + (item.quantity || 0) * price;
  }, 0);

  // Free shipping logic
  const threshold = freeShippingThreshold || 0;
  const neededAmount = Math.max(0, threshold - cartTotal);
  const progressPercent = threshold > 0 ? Math.min(100, (cartTotal / threshold) * 100) : 100;
  const isFreeShipping = cartTotal >= threshold;

  if (cartCount === 0) return null;

  const handleClick = () => {
    // Navigate immediately for better mobile UX
    isLoggedIn ? navigate("/checkout") : navigate("/login");
  };

  return (
    <div 
      className="floating-checkout-container"
      ref={buttonRef}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Checkout ${cartCount} items for ₹${cartTotal}`}
    >
      {/* Progress bar - only show if threshold exists and not reached */}
      {threshold > 0 && cartTotal < threshold && (
        <div className="checkout-progress-container">
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="progress-message">
            <span className="message-remaining">
              <FiTruck className="message-icon" />
              Add ₹{neededAmount} for free shipping
            </span>
          </div>
        </div>
      )}

      {/* Free shipping message when achieved */}
      {threshold > 0 && isFreeShipping && (
        <div className="checkout-progress-container">
          <div className="progress-message">
            <span className="message-success">
              <FiCheckCircle className="message-icon" />
              Free shipping unlocked!
            </span>
          </div>
        </div>
      )}

      {/* Main checkout area */}
      <div className="checkout-main-area">
        <div className="checkout-info">
          <div className="checkout-summary">
            <div className="item-count-badge">
              <FiShoppingBag className="bag-icon" />
              {cartCount > 0 && (
                <span className="count-number">{cartCount}</span>
              )}
            </div>
            
            <div className="price-details">
              <div className="total-label">Total</div>
              <div className="total-amount">₹{cartTotal.toLocaleString("en-IN")}</div>
            </div>
          </div>
          
          {/* Show shipping note only when no threshold logic applies */}
          {(threshold === 0) && (
            <div className="shipping-note">
              <FiTruck className="truck-icon" />
              <span>Shipping calculated at checkout</span>
            </div>
          )}
        </div>
        
        <div className="checkout-action">
          <span className="action-label">
            {isLoggedIn ? "Checkout" : "Login"}
          </span>
          <div className="action-arrow">
            <FiArrowRight className="arrow-icon" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingCheckoutButton;