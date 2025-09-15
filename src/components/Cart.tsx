import React from "react";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import "../styles/Cart.css";

interface CartProps {}

const IMAGE_BASE_URL = "http://localhost:5000/uploads/";

function getItemValues(item: any) {
  const innerCount = item.quantity || 0;
  const piecesPerInner =
    item.innerQty && item.innerQty > 0
      ? item.innerQty
      : item.bulkPricing?.[0]?.qty > 0 && item.bulkPricing?.[0]?.inner > 0
      ? item.bulkPricing[0].qty / item.bulkPricing[0].inner
      : 1;

  const tiers = [...(item.bulkPricing || [])].sort((a, b) => a.inner - b.inner);
  const activeTier = tiers.reduce(
    (match, tier) => (innerCount >= tier.inner ? tier : match),
    tiers[0] || { inner: 0, price: item.price }
  );
  const unitPrice = activeTier.price || item.price;
  const totalPieces = innerCount * piecesPerInner;
  const totalPrice = totalPieces * unitPrice;

  return { innerCount, piecesPerInner, tiers, unitPrice, totalPieces, totalPrice };
}

const Cart: React.FC<CartProps> = () => {
  const { cartItems, setCartItemQuantity, removeFromCart, clearCart } = useShop();
  const navigate = useNavigate();

  // ✅ user role / approval
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isApproved = user?.isApproved === true;
  const isAdmin = user?.role === "admin";

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

  // sum of inner units across all items
  const totalInnerCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemValues(item).totalPrice,
    0
  );

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
              innerCount,
              piecesPerInner,
              tiers,
              unitPrice,
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
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>

                  {/* per-piece price */}
                  {isApproved ? (
                    <div className="product-price">
                      ₹{unitPrice.toLocaleString()} <span className="unit">(per pc)</span>
                    </div>
                  ) : (
                    <div className="locked-message">🔒 Price after admin approval</div>
                  )}

                  {/* qty controls */}
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() =>
                        setCartItemQuantity(item, Math.max(1, item.quantity - 1))
                      }
                    >
                      –
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => setCartItemQuantity(item, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  {/* bulk pricing list */}
                  {isApproved && (
                    <div className="bulk-pricing-list">
                      {tiers.map((tier: any, i: number) => {
                        const rowQty = tier.qty ?? tier.inner * piecesPerInner;
                        const nextInner = tiers[i + 1]?.inner ?? Infinity;
                        const isActive =
                          innerCount >= tier.inner && innerCount < nextInner;

                        return (
                          <div
                            key={i}
                            className={`bulk-pricing-item${isActive ? " highlight" : ""}`}
                          >
                            ₹{tier.price.toLocaleString()} / {tier.inner} inner / {rowQty} nos
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* TOTAL: innerCount only */}
                <div className="product-total">
                  <span>Total</span>
                  <div className="total-inners">{innerCount}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row total">
            <span>Total Inners</span>
            <span>{totalInnerCount}</span>
          </div>

          {/* ✅ Only approved users (customer + admin) see money totals */}
          {isApproved && (
            <div className="summary-row subtotal">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
          )}

          <button className="checkout-btn" onClick={() => navigate("/checkout")}>
            Proceed to Checkout
          </button>
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
