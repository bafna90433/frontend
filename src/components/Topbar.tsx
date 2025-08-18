import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Topbar.css";

const Topbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link to="/" className="logo">🎁 BAFNA TOYS</Link>
      </div>

      <div className="topbar-center">
        <input
          type="text"
          className="search-input"
          placeholder="Search for toys, brands, categories..."
        />
        <button className="search-btn">🔍</button>
      </div>

      <div className="topbar-right">
        <button onClick={() => navigate("/register")}>Register</button>
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/cart")}>🛒</button>
      </div>
    </header>
  );
};

export default Topbar;
