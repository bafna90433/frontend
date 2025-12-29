import React from "react";
import "../styles/ShippingDelivery.css"; // 👈 Make sure this file exists

const ShippingDelivery = () => {
  return (
    <div className="policy-container">
      <h1>Shipping & Delivery Policy</h1>

      <p>
        Orders are usually processed within <b>1–2 business days</b> after
        successful payment. Processing time may vary during festivals or sales.
      </p>

      <h3>📦 Delivery Timeline</h3>
      <ul>
        <li>Metro Cities: <b>3–6 Days</b></li>
        <li>Other Indian Locations: <b>5–9 Days</b></li>
      </ul>

      <p>
        Once your order is shipped, you will receive an SMS or email update
        containing your tracking ID and courier partner details.
      </p>

      <h3>🚚 Delays</h3>
      <p>
        Delivery may be affected due to courier workload, weather conditions, or
        regional restrictions. We cannot control delivery delays once the order
        has been handed to the courier partner.
      </p>

      <h3>📍 Address Responsibility</h3>
      <p>
        Please ensure your delivery address and contact number are correct.
        Orders cannot be redirected once dispatched.
      </p>

      <p className="footer-text">
        If you have any shipping-related questions, contact us at:<br />
        <strong>bafnatoysphotos@gmail.com</strong>
      </p>
    </div>
  );
};

export default ShippingDelivery;
