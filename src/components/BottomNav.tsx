import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "../styles/BottomNav.css";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { cartItems } = useShop();

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const allowedPaths = ["/", "/products", "/cart", "/my-account", "/orders"];

  if (!allowedPaths.includes(location.pathname)) {
    return null;
  }

  const navItems = [
    {
      label: "Shop",
      to: "/",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {active ? (
            <>
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="currentColor" stroke="none" />
              <path d="M9 22V12h6v10" stroke="#fff" strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path d="M9 22V12h6v10" />
            </>
          )}
        </svg>
      ),
    },
    {
      label: "Orders",
      to: "/orders",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {active ? (
            <>
              <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" stroke="none" />
              <path d="M8 8h8M8 12h6M8 16h4" stroke="#fff" strokeWidth="2" />
            </>
          ) : (
            <>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M8 8h8M8 12h6M8 16h4" />
            </>
          )}
        </svg>
      ),
    },
    {
      label: "Cart",
      to: "/cart",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {active ? (
            <>
              <path d="M6 6h15l-1.5 9H7.5L6 6z" fill="currentColor" stroke="none" />
              <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
              <path d="M1 1h4l1 4" stroke="currentColor" strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </>
          )}
        </svg>
      ),
      badge: cartCount,
    },
    {
      label: "Account",
      to: "/my-account",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {active ? (
            <>
              <circle cx="12" cy="8" r="4" fill="currentColor" stroke="none" />
              <path d="M4 21v-2a6 6 0 0112 0v2" fill="currentColor" stroke="none" />
            </>
          ) : (
            <>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </>
          )}
        </svg>
      ),
    },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/products";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bn" role="navigation" aria-label="Bottom Navigation">
      <div className="bn-inner">
        {navItems.map((item) => {
          const isActive = isActivePath(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`bn-item ${isActive ? "bn-item--on" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="bn-icon-wrap">
                <div className={`bn-icon ${isActive ? "bn-icon--on" : ""}`}>
                  {item.icon(isActive)}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bn-badge">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {isActive && <div className="bn-glow" />}
              </div>
              <span className={`bn-label ${isActive ? "bn-label--on" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;