import React from "react";
import Sidebar from "./Sidebar"; 
import "../styles/MainLayout.css";

type MainLayoutProps = {
  children: React.ReactNode;
  hideSidebar?: boolean; // ✅ Step 1: Add this optional prop
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, hideSidebar = false }) => {
  return (
    <div className="app-shell">
      <div className="app-body">
        {/* ✅ Step 2: Conditionally render the Sidebar */}
        {!hideSidebar && (
          <aside className="app-sidebar">
            <Sidebar />
          </aside>
        )}

        {/* Main content */}
        {/* Added a dynamic class in case you need to adjust padding when sidebar is hidden */}
        <main className={`app-content ${hideSidebar ? 'sidebar-hidden' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;