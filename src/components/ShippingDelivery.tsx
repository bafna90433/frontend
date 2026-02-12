// src/pages/ShippingDelivery.tsx
import React from "react";
import { Helmet } from "react-helmet-async";
import { Truck, MapPin, Clock, AlertTriangle, Phone } from "lucide-react";
import "../styles/ShippingDelivery.css";

const ShippingDelivery = () => {
  return (
    <>
      <Helmet>
        <title>Shipping & Delivery Policy | Bafna Toys</title>
        <meta
          name="description"
          content="Read Bafna Toys Shipping and Delivery Policy. We deliver wholesale toys across India within 3-9 days via trusted courier partners."
        />
        <link rel="canonical" href="https://bafnatoys.com/shipping-policy" />
      </Helmet>

      <div className="policy-wrapper">
        <div className="policy-container">
          <div className="policy-header">
            <h1>Shipping & Delivery Policy</h1>
            <p className="policy-subtitle">Last updated: February 2026</p>
          </div>

          <div className="policy-section">
            <h3>
              <Clock size={20} className="policy-icon" /> Order Processing
            </h3>
            <p>
              Orders are usually processed within <b>1–2 business days</b> after
              successful payment. Processing time may vary during festivals or
              peak sales periods.
            </p>
          </div>

          <div className="policy-section">
            <h3>
              <Truck size={20} className="policy-icon" /> Delivery Timeline
            </h3>
            <p>We strive to deliver your wholesale orders as fast as possible:</p>
            <ul className="policy-list">
              <li>
                <strong>Metro Cities:</strong> 3–6 Business Days
              </li>
              <li>
                <strong>Other Indian Locations:</strong> 5–9 Business Days
              </li>
            </ul>
            <p className="policy-note">
              Once shipped, you will receive an SMS/Email with your{" "}
              <b>Tracking ID</b> and courier details.
            </p>
          </div>

          <div className="policy-section">
            <h3>
              <AlertTriangle size={20} className="policy-icon" /> Potential
              Delays
            </h3>
            <p>
              Delivery times are estimates and may be affected by courier
              workload, weather conditions, or regional restrictions. While we
              ensure timely dispatch, we cannot fully control delays once the
              package is with the courier partner.
            </p>
          </div>

          <div className="policy-section">
            <h3>
              <MapPin size={20} className="policy-icon" /> Address Responsibility
            </h3>
            <p>
              Please ensure your complete delivery address (with Pin Code) and
              contact number are correct. Orders cannot be redirected to a new
              address once dispatched.
            </p>
          </div>

          <div className="policy-footer">
            <Phone size={18} />
            <p>
              Have shipping questions? Contact us at:
              <br />
              <a href="mailto:bafnatoysphotos@gmail.com">
                bafnatoysphotos@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingDelivery;
