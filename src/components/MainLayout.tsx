import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "./Sidebar"; // same Sidebar component
import "../styles/MainLayout.css";

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);

  // Close on ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    if (isDrawerOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Body scroll lock when drawer open
  useEffect(() => {
    const body = document.body;
    if (isDrawerOpen) {
      body.classList.add("no-scroll");
    } else {
      body.classList.remove("no-scroll");
    }
    return () => body.classList.remove("no-scroll");
  }, [isDrawerOpen]);

  return (
    <div className="app-shell">
      {/* Mobile top bar with hamburger */}
      <header className="mobile-topbar">
        <button
          className="hamburger"
          aria-label="Open menu"
          aria-controls="mobile-drawer"
          aria-expanded={isDrawerOpen}
          onClick={openDrawer}
        >
          {/* Simple hamburger icon */}
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
        <div className="mobile-topbar-title">BAFNA TOYS</div>
      </header>

      <div className="app-body">
        {/* Desktop sidebar (hidden on mobile via CSS) */}
        <aside className="app-sidebar" aria-label="Sidebar (desktop)">
          <Sidebar />
        </aside>

        {/* Mobile Drawer (hidden on desktop via CSS) */}
        <div
          id="mobile-drawer"
          className={`drawer-root ${isDrawerOpen ? "is-open" : ""}`}
          aria-hidden={!isDrawerOpen}
        >
          <div className="drawer-backdrop" onClick={closeDrawer} />
          <aside className="drawer-panel" role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div className="drawer-title">Menu</div>
              <button
                className="drawer-close"
                aria-label="Close menu"
                onClick={closeDrawer}
              >
                ×
              </button>
            </div>
            <div className="drawer-content">
              <Sidebar />
            </div>
          </aside>
        </div>

        {/* Main content */}
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
