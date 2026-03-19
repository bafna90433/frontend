import React from "react";
import "../styles/CancellationRefund.css"; // 👈 make sure file exists

const CancellationRefund = () => {
  return (
    <div className="policy-container">
      <h1>Return & Refund Policy</h1>

      <p>
        We aim to provide a seamless shopping experience. Please review the
        guidelines below regarding returns and refunds.
      </p>

      <h3>🛍 Refund Eligibility</h3>
      <ul>
        <li>Wrong product received</li>
        <li>Damaged or defective item</li>
      </ul>

      <p>
        If approved, refunds will be processed within <b>5–7 working days</b> to
        the original payment method.
      </p>

      <h3>↩️ Return Request</h3>
      <p>
        Customers must raise a return request within <b>2–4 days</b> of delivery
        and provide valid proof (photo/video).
      </p>

      <h3>📦 Non-Returnable Items</h3>
      <p>
        Items damaged due to customer misuse or opened used toys are not
        eligible for return unless defective on arrival.
      </p>

      <p className="footer-text">
        For refund-related queries, contact us at: <br />
        <strong>bafnatoysphotos@gmail.com</strong>
      </p>
    </div>
  );
};

export default CancellationRefund;