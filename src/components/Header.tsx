import React from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "../styles/Header.css";

const Header: React.FC = () => {
  const { cartCount, wishlistCount } = useShop();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🎁</span>
          <span className="logo-text">BAFNA TOYS</span>
        </Link>

        <div className="search-bar">
          <input type="text" placeholder="Search toys..." />
          <button className="search-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </div>

        <nav className="nav-links">
          <div className="nav-item">
            <Link to="/wishlist" className="nav-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="count-badge">{wishlistCount}</span>
              )}
            </Link>
          </div>
          
          <div className="nav-item">
            <Link to="/cart" className="nav-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartCount > 0 && (
                <span className="count-badge">{cartCount}</span>
              )}
            </Link>
          </div>
          
          <div className="nav-divider"></div>
          
          <Link to="/login" className="auth-btn login-btn">
            <span>Login</span>
          </Link>
          <Link to="/register" className="auth-btn signup-btn"> {/* Updated link */}
            <span>Sign Up</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
