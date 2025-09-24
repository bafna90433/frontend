import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/BackFooter.css";

const BackFooter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="back-footer">
      {/* Home button - Always visible */}
      <span className="home-text" onClick={() => navigate("/")}>
        🏠 Home
      </span>

      {/* Back button - Home page par hide */}
      {location.pathname !== "/" && (
        <span className="back-text" onClick={() => navigate(-1)}>
          ⬅ Back
        </span>
      )}
    </div>
  );
};

export default BackFooter;
