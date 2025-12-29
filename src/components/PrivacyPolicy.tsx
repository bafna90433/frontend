import React from "react";
import "../styles/PrivacyPolicy.css"; // 👈 CSS linked

const PrivacyPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Privacy Policy</h1>

      <p>
        We respect your privacy and are committed to protecting your personal
        data. This policy explains how we collect, use, and secure your
        information.
      </p>

      <h3>📌 Information We Collect</h3>
      <ul>
        <li>Name</li>
        <li>Email Address</li>
        <li>Phone Number</li>
        <li>Shipping Address</li>
        <li>Payment Information (handled securely by Razorpay)</li>
      </ul>

      <h3>📌 How We Use Your Information</h3>
      <p>
        We use your information to process orders, provide support, and send
        notifications regarding products or purchases.
      </p>

      <h3>📌 Data Protection</h3>
      <p>
        We do not store or share payment details. All payments are encrypted and
        processed securely via Razorpay.
      </p>

      <h3>📌 Policy Updates</h3>
      <p>
        We may update this privacy policy from time to time. Continued use of
        our website means you accept any future changes.
      </p>

      <p className="footer-text">
        If you have any questions regarding this policy, contact us at:
        <br />
        <strong>bafnatoysphotos@gmail.com</strong>
      </p>
    </div>
  );
};

export default PrivacyPolicy;
