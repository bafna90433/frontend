import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useShop } from "../context/ShopContext";
import "../styles/BottomNav.css";

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { cartItems } = useShop();

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Added "/faq" to the allowed paths
  const allowedPaths = ["/", "/products", "/cart", "/my-account", "/orders", "/faq"];

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
    {
      label: "FAQ",
      to: "/faq",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {active ? (
            <>
              <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="#fff" />
              <circle cx="12" cy="17" r="1.5" fill="#fff" stroke="none" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
            </>
          )}
        </svg>
      ),
    },
    {
      label: "WhatsApp",
      to: "https://wa.me/919043347300",
      isExternal: true,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.12.556 4.186 1.613 6.04L0 24l6.105-1.603a11.815 11.815 0 005.94 1.597h.005c6.632 0 12.028-5.391 12.032-12.029a11.815 11.815 0 00-3.57-8.505" />
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
        {navItems.map((item: any) => {
          const isWhatsApp = item.label === 'WhatsApp';
          const isActive = !item.isExternal && isActivePath(item.to);
          
          const content = (
            <>
              <div className="bn-icon-wrap">
                <div className={`bn-icon ${isActive || isWhatsApp ? "bn-icon--on" : ""}`}>
                  {item.icon(isActive || isWhatsApp)}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bn-badge">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
                {(isActive || isWhatsApp) && <div className="bn-glow" />}
              </div>
              <span className={`bn-label ${isActive || isWhatsApp ? "bn-label--on" : ""}`}>
                {item.label}
              </span>
            </>
          );

          if (isWhatsApp) {
            return (
              <button
                key={item.label}
                onClick={() => window.dispatchEvent(new CustomEvent("open-whatsapp-panel"))}
                className="bn-item bn-item-whatsapp"
                style={{ background: 'none', border: 'none', padding: '6px 0 4px', cursor: 'pointer' }}
              >
                {content}
              </button>
            );
          }

          if (item.isExternal) {
            return (
              <a
                key={item.label}
                href={item.to}
                target="_blank"
                rel="noopener noreferrer"
                className="bn-item"
                style={{ textDecoration: 'none' }}
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`bn-item ${isActive ? "bn-item--on" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;