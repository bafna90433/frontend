import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/BackFooter.css";

const BackFooter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Hide on home page
  if (location.pathname === "/") return null;

  return (
    <div className="back-header-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>
    </div>
  );
};

export default BackFooter;
