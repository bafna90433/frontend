import React from "react";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
// ✅ Changed icons to Lucide for consistency with Checkout
import { Truck, Info, AlertCircle } from "lucide-react"; 
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
    // ✅ Context Values
    cartTotal,
    shippingFee,
    finalTotal,
    freeShippingThreshold
  } = useShop();
  
  const navigate = useNavigate();

  // ✅ Always approved (since approval system is removed)
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

  // Sum of packets
  const totalPacketCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  // ✅ FREE SHIPPING CALCULATION
  const neededForFree = freeShippingThreshold - cartTotal;
  const progressPercent = Math.min(100, (cartTotal / freeShippingThreshold) * 100);

  // Quantity Handlers
  const handleDecrease = (item: any) => {
    const { minQty } = getItemValues(item);
    const currentQty = item.quantity || 0;
    if (currentQty <= minQty) return;
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
          
          {/* ✅ Free Shipping Progress Bar (SAME AS CHECKOUT) */}
          {freeShippingThreshold > 0 && isApproved && (
            <div style={{
                marginBottom: '20px', padding: '15px 20px', 
                background: neededForFree > 0 ? '#eff6ff' : '#f0fdf4', 
                borderRadius: '12px', border: neededForFree > 0 ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', 
                  fontSize: '15px', fontWeight: '600', 
                  color: neededForFree > 0 ? '#1e40af' : '#15803d'
              }}>
                 <Truck size={20} />
                 {neededForFree > 0 
                   ? <span>Add <strong>₹{neededForFree.toLocaleString()}</strong> more for <strong>FREE Shipping!</strong></span>
                   : <span>🎉 Congratulations! You've unlocked <strong>FREE Shipping!</strong></span>
                 }
              </div>
              <div style={{width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden'}}>
                 <div style={{
                    width: `${progressPercent}%`, 
                    height: '100%', 
                    background: neededForFree > 0 ? '#3b82f6' : '#22c55e',
                    transition: 'width 0.5s ease',
                    borderRadius: '4px'
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

          {/* Validation */}
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