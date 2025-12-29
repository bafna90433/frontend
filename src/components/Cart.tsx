import React from "react";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import "../styles/Cart.css";

interface CartProps {}

const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

// Helper function to calculate minimum quantity based on price
const getMinimumQuantity = (price: number): number => {
  return price < 60 ? 3 : 2;
};

function getItemValues(item: any) {
  const packetCount = item.quantity || 0; // Changed from innerCount to packetCount
  const minQty = getMinimumQuantity(item.price);
  const unitPrice = item.price;
  const totalPrice = packetCount * unitPrice;

  return { 
    packetCount, // Changed from innerCount
    unitPrice, 
    totalPrice,
    minQty 
  };
}

const Cart: React.FC<CartProps> = () => {
  const { cartItems, setCartItemQuantity, removeFromCart, clearCart } = useShop();
  const navigate = useNavigate();

  // ✅ user role / approval
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved === true;

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty-container">
        <div className="cart-empty">
          <h3>Your cart is empty</h3>
          <button className="continue-shopping-btn" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // sum of packets across all items
  const totalPacketCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemValues(item).totalPrice,
    0
  );

  // Function to handle quantity decrease with minimum quantity check
  const handleDecrease = (item: any) => {
    const { minQty } = getItemValues(item);
    const currentQty = item.quantity || 0;
    
    // If at minimum quantity, block further decrease
    if (currentQty <= minQty) {
      return; // Do nothing - button should be disabled
    }
    
    // Decrease by 1
    setCartItemQuantity(item, currentQty - 1);
  };

  // Function to handle quantity increase
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
          {cartItems.map((item: any) => {
            const {
              packetCount,
              unitPrice,
              minQty
            } = getItemValues(item);

            const imgSrc = item.image?.startsWith("http")
              ? item.image
              : item.image?.includes("/uploads/")
              ? `http://localhost:5000${item.image}`
              : `${IMAGE_BASE_URL}${encodeURIComponent(item.image)}`;

            return (
              <div className="cart-item" key={item._id}>
                {/* image */}
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

                {/* details */}
                <div className="product-details">
                  <div className="product-title-row">
                    <h3
                      className="product-name"
                      onClick={() => navigate(`/product/${item._id}`)}
                    >
                      {item.name}
                    </h3>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item._id)}
                      title="Remove item from cart"
                    >
                      ×
                    </button>
                  </div>

                  {/* Minimum quantity indicator */}
                  <div className="min-qty-indicator">
                    Minimum Quantity: {minQty} {minQty === 1 ? 'packet' : 'packets'}
                  </div>

                  {/* per-packet price */}
                  {isApproved ? (
                    <div className="product-price">
                      ₹{unitPrice.toLocaleString()} <span className="unit">(per packet)</span>
                    </div>
                  ) : (
                    <div className="locked-message">🔒 Price after admin approval</div>
                  )}

                  {/* qty controls */}
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => handleDecrease(item)}
                      disabled={packetCount <= minQty}
                      title={packetCount <= minQty ? `Minimum quantity is ${minQty} packets` : "Decrease quantity"}
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

                  {/* Quantity warning */}
                  {packetCount < minQty && (
                    <div className="quantity-warning">
                      ⚠️ Minimum order is {minQty} packets
                    </div>
                  )}

                  {/* Total for this item */}
                  {isApproved && (
                    <div className="item-total-price">
                      Item Total: ₹{(packetCount * unitPrice).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Quantity display */}
                <div className="product-total">
                  <span>Quantity</span>
                  <div className="total-packets">{packetCount} packets</div> {/* Changed */}
                  <div className="min-qty-badge">
                    Min: {minQty}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h3>Order Summary</h3>
          
          {/* Show minimum quantity requirement summary */}
          <div className="summary-row min-requirement">
            <span>Minimum Quantity Requirement</span>
            <span>Applied ✓</span>
          </div>
          
          <div className="summary-row total">
            <span>Total Items</span>
            <span>{totalPacketCount} packets</span> {/* Changed */}
          </div>

          {/* ✅ Only approved users (customer + admin) see money totals */}
          {isApproved && (
            <>
              <div className="summary-row subtotal">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row grand-total">
                <span>Grand Total</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
            </>
          )}

          {/* Check if all items meet minimum quantity */}
          {cartItems.some((item: any) => {
            const { packetCount, minQty } = getItemValues(item);
            return packetCount < minQty;
          }) ? (
            <div className="checkout-disabled">
              ⚠️ Some items are below minimum quantity
              <button 
                className="checkout-btn disabled" 
                disabled
                title="Adjust quantities to meet minimum requirements"
              >
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