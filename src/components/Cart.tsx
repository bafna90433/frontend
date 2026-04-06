import React, { useState } from "react";
import { useShop } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import "../styles/Cart.css";

// 🔥 STRICT BULK BUY LOGIC FOR CART ITEMS
const getCartItemConfig = (item: any) => {
  const dbPieces = Number(item.piecesPerUnit) || 1;
  const dbUnit = item.unit || "Piece";
  const strictBulk = item.isBulkOnly || false;

  let stepQty = 1;
  let minQty = 1;
  let isBulk = false;

  if (strictBulk && dbPieces > 1) {
    stepQty = dbPieces;
    minQty = dbPieces;
    isBulk = true;
  } else if (dbPieces > 1) {
    stepQty = 1;
    minQty = dbPieces;
    isBulk = true;
  } else {
    minQty = Number(item.price) < 60 ? 3 : 2;
    stepQty = 1;
    isBulk = false;
  }

  const qty = item.quantity || 0;
  const unitPrice = item.price;
  const total = qty * unitPrice;

  return { qty, min: minQty, step: stepQty, unit: unitPrice, total, parsedUnit: dbUnit, isBulk };
};

// ✅ ADDED: ImageKit Optimizer for Cart Thumbnails
const getThumbUrl = (url: string | undefined) => {
  if (!url) return "/images/placeholder.webp";
  
  // ImageKit optimization (fast loading for cart thumbnails)
  if (url.includes("ik.imagekit.io")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}tr=w-150,h-150,cm-at_max,f-auto,q-80`;
  }
  
  // Cloudinary fallback
  if (url.includes("res.cloudinary.com")) {
    if (url.includes("/image/upload/f_auto") || url.includes("/w_")) return url;
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_150,h_150,c_fill/`);
  }

  if (url.startsWith("http")) return url;
  
  // Local fallback
  const baseUrl = (import.meta as any).env?.VITE_IMAGE_BASE_URL || "http://localhost:5000";
  const cleanPath = url.startsWith("/uploads/") ? url : `/uploads/${url}`;
  return `${baseUrl}${cleanPath}`;
};

/* ═══════════════════════════════════
   PROFESSIONAL CONFIRM POPUP
   ═══════════════════════════════════ */
const ConfirmPopup: React.FC<{
  open: boolean;
  icon?: "trash" | "remove" | "warning";
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open, icon = "warning", title, message,
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  danger = false, onConfirm, onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="cpop-overlay" onClick={onCancel}>
      <div className="cpop-card" onClick={(e) => e.stopPropagation()}>
        {/* Drag Handle (mobile) */}
        <div className="cpop-handle" />

        {/* Icon */}
        <div className={`cpop-icon ${danger ? "cpop-icon--danger" : "cpop-icon--warn"}`}>
          {icon === "trash" && (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          )}
          {icon === "remove" && (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {icon === "warning" && (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </div>

        {/* Text */}
        <h3 className="cpop-title">{title}</h3>
        <p className="cpop-msg">{message}</p>

        {/* Buttons */}
        <div className="cpop-btns">
          <button className="cpop-btn cpop-btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`cpop-btn ${danger ? "cpop-btn--danger" : "cpop-btn--primary"}`}
            onClick={onConfirm}
          >
            {icon === "trash" && (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            )}
            {icon === "remove" && (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════
   CART COMPONENT
   ═══════════════════════════════════ */
const Cart: React.FC = () => {
  const {
    cartItems, setCartItemQuantity, removeFromCart, clearCart,
    cartTotal, shippingFee, finalTotal, freeShippingThreshold,
  } = useShop();

  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  // ── Popup States ──
  const [showClearPopup, setShowClearPopup] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  const totalQty = cartItems.reduce((s, i) => s + (i.quantity || 0), 0);
  const needed = freeShippingThreshold - cartTotal;
  const progress = Math.min(100, (cartTotal / freeShippingThreshold) * 100);
  
  const hasMinError = cartItems.some((i) => {
    const { qty, min } = getCartItemConfig(i);
    return qty < min;
  });

  // ── Popup Handlers ──
  const handleClearClick = () => setShowClearPopup(true);
  const confirmClear = () => { clearCart(); setShowClearPopup(false); };

  const handleRemoveClick = (item: any) => setRemoveTarget({ id: item._id, name: item.name });
  const confirmRemove = () => { if (removeTarget) removeFromCart(removeTarget.id); setRemoveTarget(null); };

  if (cartItems.length === 0) {
    return (
      <div className="ct-empty-page">
        <div className="ct-empty-card">
          <div className="ct-empty-icon">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Start adding some amazing toys!</p>
          <button className="ct-shop-btn" onClick={() => navigate("/products")}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ct-page">
        {/* Header */}
        <div className="ct-header">
          <button className="ct-back" onClick={() => navigate(-1)} aria-label="Go back">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="ct-header-text">
            <h1>Cart</h1>
            <span>{cartItems.length} {cartItems.length === 1 ? "item" : "items"} · {totalQty} pcs</span>
          </div>
          <button className="ct-clear-top" onClick={handleClearClick}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="ct-body">
          <div className="ct-items">
            {/* Shipping Bar */}
            {freeShippingThreshold > 0 && (
              <div className={`ct-ship ${needed <= 0 ? "ct-ship--ok" : ""}`}>
                <div className="ct-ship-row">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"/>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  {needed > 0 ? (
                    <span>Add <b>₹{needed.toLocaleString()}</b> for <b>FREE</b> shipping</span>
                  ) : (
                    <span>🎉 <b>FREE shipping</b> unlocked!</span>
                  )}
                </div>
                <div className="ct-ship-track">
                  <div className="ct-ship-fill" style={{ width: `${progress}%` }}/>
                </div>
              </div>
            )}

            {/* Cards */}
            {cartItems.map((item: any) => {
              // 🔥 USING THE NEW BULK CONFIG LOGIC
              const { qty, min, step, unit, total, parsedUnit, isBulk } = getCartItemConfig(item);
              
              // ✅ Updated ImageKit helper logic here
              const imgSrc = getThumbUrl(item.image);

              return (
                <div className="ct-card" key={item._id}>
                  <div className="ct-card-img" onClick={() => navigate(`/product/${item._id}`)}>
                    {item.image ? (
                      <img src={imgSrc} alt={item.name} loading="lazy"/>
                    ) : (
                      <div className="ct-card-ph">📦</div>
                    )}
                  </div>

                  <div className="ct-card-info">
                    <div className="ct-card-row1">
                      <h3 onClick={() => navigate(`/product/${item._id}`)}>{item.name}</h3>
                      <button className="ct-card-del" onClick={() => handleRemoveClick(item)}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>

                    <div className="ct-card-price-row">
                      <span className="ct-card-price">₹{unit.toLocaleString()}</span>
                      <span className="ct-card-per">/ {parsedUnit}</span>
                    </div>

                    <div className="ct-card-pills">
                      <span className="ct-pill ct-pill--min">Min {min}</span>
                      {isBulk && <span className="ct-pill" style={{ background: "#e0f2fe", color: "#0369a1" }}>Per {step} pcs</span>}
                      {qty < min && <span className="ct-pill ct-pill--err">Below min!</span>}
                    </div>

                    <div className="ct-card-row2">
                      <div className="ct-stepper">
                        <button
                          className="ct-step-btn"
                          onClick={() => qty > min && setCartItemQuantity(item, qty - step)}
                          disabled={qty <= min}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                        <span className="ct-step-val">{qty}</span>
                        <button
                          className="ct-step-btn ct-step-btn--add"
                          onClick={() => setCartItemQuantity(item, qty + step)}
                          disabled={item.stock !== undefined && qty >= item.stock}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                      </div>
                      <span className="ct-card-total">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Summary */}
          <div className="ct-aside">
            <div className="ct-summary">
              <h3>Order Summary</h3>
              <div className="ct-sum-rows">
                <div className="ct-sum-row">
                  <span>Items ({totalQty})</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="ct-sum-row">
                  <span>Shipping</span>
                  {shippingFee === 0 ? <span className="ct-sum-free">FREE</span> : <span>₹{shippingFee.toLocaleString()}</span>}
                </div>
                <div className="ct-sum-row ct-sum-row--big">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {shippingFee === 0 && freeShippingThreshold > 0 && (
                <div className="ct-sum-save">✓ You're saving on shipping!</div>
              )}

              {hasMinError && (
                <div className="ct-sum-err">⚠ Some items below minimum qty</div>
              )}

              <button
                className={`ct-sum-checkout ${hasMinError ? "ct-sum-checkout--off" : ""}`}
                onClick={() => !hasMinError && navigate("/checkout")}
                disabled={hasMinError}
              >
                Proceed to Checkout
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <button className="ct-sum-continue" onClick={() => navigate("/products")}>
                Continue Shopping
              </button>

              <div className="ct-sum-trust">
                <span>🔒 Secure</span>
                <span>🛡️ Safe Pay</span>
                <span>✓ Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="ctm-bar-wrap">
        {showDetails && (
          <>
            <div className="ctm-overlay" onClick={() => setShowDetails(false)}/>
            <div className="ctm-expand">
              <div className="ctm-expand-handle"/>
              <div className="ctm-expand-row">
                <span>Subtotal ({totalQty} pcs)</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="ctm-expand-row">
                <span>Shipping</span>
                {shippingFee === 0 ? <span className="ctm-expand-free">FREE</span> : <span>₹{shippingFee.toLocaleString()}</span>}
              </div>
              {shippingFee === 0 && freeShippingThreshold > 0 && (
                <div className="ctm-expand-badge">✓ Free shipping applied</div>
              )}
              {hasMinError && (
                <div className="ctm-expand-warn">⚠ Fix minimum quantity errors</div>
              )}
            </div>
          </>
        )}

        <div className="ctm-bar">
          <div className="ctm-left" onClick={() => setShowDetails(v => !v)}>
            <span className="ctm-total">₹{finalTotal.toLocaleString()}</span>
            <button className="ctm-detail-btn" type="button">
              {showDetails ? "Hide" : "Details"}
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"
                style={{ transform: showDetails ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>
          </div>
          <button
            className={`ctm-checkout ${hasMinError ? "ctm-checkout--off" : ""}`}
            onClick={() => !hasMinError && navigate("/checkout")}
            disabled={hasMinError}
          >
            Checkout
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ═══ POPUPS ═══ */}
      <ConfirmPopup
        open={showClearPopup}
        icon="trash"
        title="Clear Entire Cart?"
        message="All items will be removed. This can't be undone."
        confirmLabel="Clear Cart"
        cancelLabel="Keep Shopping"
        danger
        onConfirm={confirmClear}
        onCancel={() => setShowClearPopup(false)}
      />

      <ConfirmPopup
        open={!!removeTarget}
        icon="remove"
        title="Remove Item?"
        message={<>Remove <strong>{removeTarget?.name}</strong> from your cart?</>}
        confirmLabel="Remove"
        cancelLabel="Keep"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
};

export default Cart;