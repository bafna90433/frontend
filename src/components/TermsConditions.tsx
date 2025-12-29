import React from "react";
import "../styles/TermsConditions.css"; // 👈 make sure CSS linked

const TermsConditions = () => {
  return (
    <div className="policy-container">
      <h1>Terms & Conditions</h1>

      <p>
        By accessing or purchasing from our website, you agree to follow our
        terms, guidelines, and policies. These terms are in place to ensure a
        smooth and transparent shopping experience for all users.
      </p>

      <h3>📌 General Conditions</h3>
      <ul>
        <li>Prices and product availability may change anytime without notice.</li>
        <li>Customers must provide accurate personal and delivery information.</li>
        <li>Unauthorized copying, reselling, or misuse of website content is prohibited.</li>
      </ul>

      <h3>📌 Payments</h3>
      <p>
        All payments are securely processed via Razorpay. We do not store or
        access your card, UPI, or banking details.
      </p>

      <h3>📌 Order Acceptance</h3>
      <p>
        We reserve the right to refuse or cancel any order due to stock issues,
        payment failure, or incorrect information.
      </p>

      <h3>📌 Policy Updates</h3>
      <p>
        These terms may be updated periodically. Continued use of our platform
        means you agree to the updated terms.
      </p>

      <p className="footer-text">
        For any questions, feel free to contact us at:
        <br />
        <strong>bafnatoysphotos@gmail.com</strong>
      </p>
    </div>
  );
};

export default TermsConditions;
