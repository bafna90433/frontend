import React from "react";
import { FiClock } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa"; // ✅ WhatsApp Icon Import

const ComingSoon: React.FC = () => {
  
  // ✅ Redirect Function
  const handleWhatsAppRedirect = () => {
    const phoneNumber = "919363482008"; // Country code +91 added
    const message = "Hello Bafna Toys, the website is under maintenance. I want to place an order manually. Please assist me.";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
        color: "#333",
        textAlign: "center",
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#ffe4e6",
            color: "#e11d48",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "32px",
          }}
        >
          <FiClock />
        </div>

        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "800",
            color: "#1f2937",
            marginBottom: "10px",
            lineHeight: "1.2",
          }}
        >
          We Are Coming Soon!
        </h1>
        
        <p
          style={{
            fontSize: "1.1rem",
            color: "#6b7280",
            lineHeight: "1.6",
            marginBottom: "30px",
          }}
        >
          Our website is currently under maintenance. We are working hard to bring you a better experience. Stay tuned!
        </p>

        {/* ✅ WhatsApp Order Button */}
        <button
          onClick={handleWhatsAppRedirect}
          style={{
            background: "#25D366",
            color: "white",
            border: "none",
            padding: "12px 24px",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "50px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            margin: "0 auto 20px auto",
            boxShadow: "0 4px 10px rgba(37, 211, 102, 0.4)",
            transition: "transform 0.2s ease",
            width: "100%",
            maxWidth: "280px"
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <FaWhatsapp size={22} />
          Order on WhatsApp
        </button>

        <div
          style={{
            padding: "15px",
            background: "#f3f4f6",
            borderRadius: "10px",
            fontSize: "0.9rem",
            color: "#4b5563",
            fontWeight: "600",
          }}
        >
          Expected to be live shortly.
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;