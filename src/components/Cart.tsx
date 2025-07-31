import React from "react";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import "../styles/Cart.css";

const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

const Cart: React.FC = () => {
  const { cartItems, setCartItemQuantity, removeFromCart } = useShop();
  const navigate = useNavigate();

  if (!cartItems.length) {
    return (
      <div className="cart-empty-container">
        <div className="cart-empty">
          <svg className="cart-empty-icon" viewBox="0 0 24 24">
            <path d="M7,18C8.1,18 9,18.9 9,20C9,21.1 8.1,22 7,22C5.9,22 5,21.1 5,20C5,18.9 5.9,18 7,18M17,18C18.1,18 19,18.9 19,20C19,21.1 18.1,22 17,22C15.9,22 15,21.1 15,20C15,18.9 15.9,18 17,18M7.2,14.8V14.7L8.1,13H15.5C16.2,13 16.9,12.6 17.2,12L21.1,5L19.4,4L15.5,11H8.5L4.3,2H1V4H3L6.6,11.6L5.2,14C5.1,14.3 5,14.6 5,15C5,16.1 5.9,17 7,17H19V15H7.4C7.3,15 7.2,14.9 7.2,14.8Z" />
          </svg>
          <h3>Your cart is empty</h3>
          <p>Add some amazing toys to your cart to see them here!</p>
          <button className="continue-shopping-btn" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Cart total calculation (uses bulk price per item)
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
          {cartItems.map((item) => {
            const imgSrc =
              item.image?.startsWith("http") || item.image?.includes("/uploads/")
                ? item.image?.startsWith("http")
                  ? item.image
                  : `http://localhost:5000${item.image}`
                : `${IMAGE_BASE_URL}${encodeURIComponent(item.image || "")}`;

            const sortedTiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
            const innerCount = item.quantity || 0;
            const activeTier = sortedTiers.reduce(
              (match, tier) => (innerCount >= tier.inner ? tier : match),
              sortedTiers[0]
            );
            const unitPrice = activeTier?.price || item.price;
            const totalQty = innerCount * (item.innerQty || 1);
            const totalPrice = unitPrice * totalQty;

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
                      style={{ cursor: "pointer" }}
                    />
                  ) : (
                    <div className="no-image">No image available</div>
                  )}
                </div>

                <div className="product-details">
                  <div className="product-title-row">
                    <h3
                      className="product-name"
                      onClick={() => navigate(`/product/${item._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {item.name}
                    </h3>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item._id)}
                      title="Remove from cart"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="product-price">₹{unitPrice.toLocaleString()} <span className="unit">(per pc)</span></div>
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() =>
                        setCartItemQuantity(item, Math.max(1, item.quantity - 1))
                      }
                      aria-label="Decrease quantity"
                    >
                      –
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => setCartItemQuantity(item, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
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

                <div className="product-total">
                  <span>Total</span>
                  <div className="total-price">₹{totalPrice.toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span className="shipping-free">FREE</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
          <button className="checkout-btn" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
          <button className="continue-shopping-btn" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
