// ════════════════════════════════════════════════════════════
// CHECKOUT SUCCESS COMPONENT
// Extracted from Checkout.tsx — logic unchanged
// ════════════════════════════════════════════════════════════

import React from "react";
import { CheckCircle2, FileText, ShoppingBag, ChevronRight } from "lucide-react";
import { generateInvoicePDF } from "../utils/CheckoutUtils";
import type { OrderData } from "../types/CheckoutTypes";

interface CheckoutSuccessProps {
  orderNumber: string | null;
  orderDetails: OrderData | null;
  user: any;
  navigate: (path: string) => void;
}

const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({
  orderNumber,
  orderDetails,
  user,
  navigate,
}) => {
  const isCod = orderDetails?.paymentMode === "COD";
  const advPaid = orderDetails?.advancePaid || 0;
  const totalAmt = orderDetails?.total || 0;
  const balance = Math.max(totalAmt - advPaid, 0);

  return (
    <div className="co-success-wrap">
      <div className="co-success-card">
        <div className="co-success-anim">
          <div className="co-success-circle">
            <CheckCircle2 size={48} />
          </div>
        </div>

        <h2 className="co-success-title">Order Confirmed!</h2>
        <p className="co-success-subtitle">Thank you for your order</p>

        <div className="co-success-order-id">
          <span>Order ID</span>
          <strong>#{orderNumber}</strong>
        </div>

        <div className="co-success-details">
          <div className="co-success-row">
            <span>Payment Method</span>
            <strong>{isCod ? "Cash on Delivery" : "Online Payment"}</strong>
          </div>
          <div className="co-success-row">
            <span>Order Total</span>
            <strong>₹{totalAmt.toLocaleString()}</strong>
          </div>
          {isCod && advPaid > 0 && (
            <>
              <div className="co-success-row co-success-row--green">
                <span>Advance Paid</span>
                <strong>₹{advPaid.toLocaleString()}</strong>
              </div>
              <div className="co-success-row co-success-row--amber">
                <span>Pay on Delivery</span>
                <strong>₹{balance.toLocaleString()}</strong>
              </div>
            </>
          )}
        </div>

        <div className="co-success-actions">
          <button onClick={() => generateInvoicePDF(orderDetails!, user)} className="co-success-btn co-success-btn--primary">
            <FileText size={18} /> View Invoice
          </button>
          <button onClick={() => navigate("/orders")} className="co-success-btn co-success-btn--secondary">
            <ShoppingBag size={18} /> My Orders
          </button>
          <button onClick={() => navigate("/products")} className="co-success-btn co-success-btn--ghost">
            Continue Shopping <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
