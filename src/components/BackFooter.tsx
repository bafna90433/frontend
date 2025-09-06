import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/BackFooter.css";   // ✅ correct path

const BackFooter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Home page pe Back button mat dikhana
  if (location.pathname === "/") return null;

  return (
    <div className="back-footer">
      <span className="back-text" onClick={() => navigate(-1)}>
        ⬅ Back
      </span>
    </div>
  );
};

export default BackFooter;
