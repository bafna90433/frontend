import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/BottomNav.css";

const BottomNav: React.FC = () => {
  const location = useLocation();

  // ✅ Agar current path "/" nahi hai to nav hide karo
  if (location.pathname !== "/") {
    return null;
  }

  const navItems = [
    {
      label: "Orders",
      to: "/orders",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
             strokeLinejoin="round" viewBox="0 0 24 24" className="nav-icon">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="3" cy="6" r="1.5" />
          <circle cx="3" cy="12" r="1.5" />
          <circle cx="3" cy="18" r="1.5" />
        </svg>
      )
    },
    {
      label: "Shop",
      to: "/",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
             strokeLinejoin="round" viewBox="0 0 24 24" className="nav-icon">
          <path d="M3 9l9-7 9 7" />
          <path d="M9 22V12h6v10" />
        </svg>
      )
    },
    {
      label: "My Account",
      to: "/my-account",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"
             stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
             strokeLinejoin="round" viewBox="0 0 24 24" className="nav-icon">
          <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    },
  ];

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Bottom Navigation">
      {navItems.map((item) => {
        const isActive = isActivePath(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`bottom-nav-item${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="icon">{item.icon}</div>
            <div className="label">{item.label}</div>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
