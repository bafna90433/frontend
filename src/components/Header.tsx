import React from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "../styles/Header.css";

const Header: React.FC = () => {
  const { cartCount, wishlistCount } = useShop();

  return (
    <header className="hdr-root">
      <div className="hdr-row">
        {/* LOGO + Brand Text */}
        <Link to="/" className="hdr-logo">
          <span className="logo-emoji">🎁</span>
          <span className="logo-text">BAFNA TOYS</span>
        </Link>

        {/* SEARCH: Only visible on desktop */}
        <form className="hdr-searchbox">
          <input type="text" placeholder="Search for toys, brands, categories..." />
          <button type="submit" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
        </form>

        {/* ACTION ICONS */}
        <div className="hdr-actions">
          {/* Wishlist */}
          <Link to="/wishlist" className="hdr-icon" aria-label="Wishlist">
            <span role="img" aria-label="Wishlist" className="only-mobile">🩶</span>
            <svg className="only-desktop" width="22" height="22" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && <span className="count-badge">{wishlistCount}</span>}
          </Link>
          {/* Cart */}
          <Link to="/cart" className="hdr-icon" aria-label="Cart">
            <span role="img" aria-label="Cart" className="only-mobile">🛒</span>
            <svg className="only-desktop" width="22" height="22" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && <span className="count-badge">{cartCount}</span>}
          </Link>
          {/* Account */}
          <Link to="/login" className="hdr-icon" aria-label="Account">
            <svg width="22" height="22" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="7" r="5" />
              <path d="M17 21v-2a5 5 0 0 0-10 0v2"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* MOBILE: Search bar below row */}
      <div className="hdr-searchbar-mobile">
        <form className="hdr-searchbox-mobile">
          <input type="text" placeholder="Search for toys, brands, categories..." />
          <button type="submit" aria-label="Search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
};

export default Header;
