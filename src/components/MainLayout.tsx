import React from "react";
import Sidebar from "./Sidebar"; 
import "../styles/MainLayout.css";

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-shell">
      <div className="app-body">
        {/* Fixed Sidebar (desktop + mobile me same) */}
        <aside className="app-sidebar">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
