import React from "react";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { FiTruck, FiInfo } from "react-icons/fi";
import "../styles/Cart.css";

interface CartProps {}

const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

// Helper function to calculate minimum quantity based on price
const getMinimumQuantity = (price: number): number => {
  return price < 60 ? 3 : 2;
};

// Values calculation helper
function getItemValues(item: any) {
  const packetCount = item.quantity || 0;
  const minQty = getMinimumQuantity(item.price);
  const unitPrice = item.price;
  const totalPrice = packetCount * unitPrice;

  return { 
    packetCount,
    unitPrice, 
    totalPrice,
    minQty 
  };
}

const Cart: React.FC<CartProps> = () => {
  const { 
    cartItems, 
    setCartItemQuantity, 
    removeFromCart, 
    clearCart,
    // ✅ New Values from Context
    cartTotal,
    shippingFee,
    finalTotal,
    freeShippingThreshold
  } = useShop();
  
  const navigate = useNavigate();

  // ✅ Only approved users see prices
  const user = JSON.parse(localStorage.getItem("user") || "null");
  // const isApproved = user?.isApproved === true;
  // NOTE: Assuming you want prices visible to everyone now (as per earlier requests).
  // If you want to hide prices for non-login, uncomment above line and use below:
  const isApproved = true; 

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-container">
        <div className="cart-empty">
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any toys yet.</p>
          <button className="continue-shopping-btn" onClick={() => navigate("/")}>
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  // Sum of packets across all items
  const totalPacketCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  // Calculate amount needed for free shipping
  const neededForFree = freeShippingThreshold - cartTotal;
  const progressPercent = Math.min(100, (cartTotal / freeShippingThreshold) * 100);

  // Quantity Handlers
  const handleDecrease = (item: any) => {
    const { minQty } = getItemValues(item);
    const currentQty = item.quantity || 0;
    if (currentQty <= minQty) return; // Block going below min
    setCartItemQuantity(item, currentQty - 1);
  };

  const handleIncrease = (item: any) => {
    const currentQty = item.quantity || 0;
    setCartItemQuantity(item, currentQty + 1);
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2>Shopping Cart</h2>
        <span className="cart-count">
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          
          {/* ✅ Free Shipping Progress Bar */}
          {freeShippingThreshold > 0 && isApproved && (
            <div className="shipping-progress-card">
              {neededForFree > 0 ? (
                <div className="shipping-message info">
                   <FiInfo />
                   <span>Add items worth <strong>₹{neededForFree.toLocaleString()}</strong> more for <strong>FREE Shipping!</strong></span>
                </div>
              ) : (
                <div className="shipping-message success">
                   <FiTruck />
                   <span>Yay! You've unlocked FREE Shipping!</span>
                </div>
              )}
              <div className="progress-bar-bg">
                 <div className="progress-bar-fill" style={{ 
                     width: `${progressPercent}%`,
                     backgroundColor: neededForFree > 0 ? '#0ea5e9' : '#16a34a' 
                 }} />
              </div>
            </div>
          )}

          {cartItems.map((item: any) => {
            const { packetCount, unitPrice, minQty } = getItemValues(item);

            const imgSrc = item.image?.startsWith("http")
              ? item.image
              : item.image?.includes("/uploads/")
              ? `http://localhost:5000${item.image}`
              : `${IMAGE_BASE_URL}${encodeURIComponent(item.image)}`;

            return (
              <div className="cart-item" key={item._id}>
                {/* Image */}
                <div className="product-image-container">
                  {item.image ? (
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="product-image"
                      loading="lazy"
                      onClick={() => navigate(`/product/${item._id}`)}
                    />
                  ) : (
                    <div className="no-image">No image available</div>
                  )}
                </div>

                {/* Details */}
                <div className="product-details">
                  <div className="product-title-row">
                    <h3 className="product-name" onClick={() => navigate(`/product/${item._id}`)}>
                      {item.name}
                    </h3>
                    <button className="remove-btn" onClick={() => removeFromCart(item._id)} title="Remove item">
                      ×
                    </button>
                  </div>

                  <div className="min-qty-indicator">
                    Minimum Quantity: {minQty} {minQty === 1 ? 'packet' : 'packets'}
                  </div>

                  {isApproved ? (
                    <div className="product-price">
                      ₹{unitPrice.toLocaleString()} <span className="unit">(per packet)</span>
                    </div>
                  ) : (
                    <div className="locked-message">🔒 Login to see price</div>
                  )}

                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => handleDecrease(item)}
                      disabled={packetCount <= minQty}
                      title={packetCount <= minQty ? `Minimum quantity is ${minQty}` : "Decrease"}
                    >
                      –
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => handleIncrease(item)}
                      disabled={item.stock !== undefined && packetCount >= item.stock}
                    >
                      +
                    </button>
                  </div>

                  {packetCount < minQty && (
                    <div className="quantity-warning">
                      ⚠️ Minimum order is {minQty} packets
                    </div>
                  )}

                  {isApproved && (
                    <div className="item-total-price">
                      Item Total: ₹{(packetCount * unitPrice).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Total Packets Badge */}
                <div className="product-total">
                  <span>Quantity</span>
                  <div className="total-packets">{packetCount} packets</div>
                  <div className="min-qty-badge">Min: {minQty}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h3>Order Summary</h3>
          
          <div className="summary-row min-requirement">
            <span>Minimum Qty Check</span>
            <span>Applied ✓</span>
          </div>
          
          <div className="summary-row total">
            <span>Total Items</span>
            <span>{totalPacketCount} packets</span>
          </div>

          {isApproved && (
            <>
              <div className="summary-row subtotal">
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              
              {/* ✅ Shipping Row */}
              <div className="summary-row shipping">
                <span>Shipping Charges</span>
                {shippingFee === 0 ? (
                    <span className="free-shipping-text">FREE</span>
                ) : (
                    <span>₹{shippingFee.toLocaleString()}</span>
                )}
              </div>

              <div className="summary-row grand-total">
                <span>Grand Total</span>
                <span>₹{finalTotal.toLocaleString()}</span>
              </div>
            </>
          )}

          {/* Validation: Check if any item violates min qty */}
          {cartItems.some((item: any) => {
            const { packetCount, minQty } = getItemValues(item);
            return packetCount < minQty;
          }) ? (
            <div className="checkout-disabled">
              ⚠️ Some items are below minimum quantity
              <button className="checkout-btn disabled" disabled>
                Proceed to Checkout
              </button>
            </div>
          ) : (
            <button className="checkout-btn" onClick={() => navigate("/checkout")}>
              Proceed to Checkout
            </button>
          )}
          
          <button className="continue-shopping-btn" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
          <button
            className="clear-cart-btn"
            onClick={() => {
              if (window.confirm("Clear entire cart?")) clearCart();
            }}
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;