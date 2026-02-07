import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Package, Edit, MapPin, LogOut, LayoutDashboard } from "lucide-react"; 
import "../styles/Sidebar.css";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={22} /> },
    { label: "My Account", path: "/my-account", icon: <User size={22} /> },
    { label: "Orders", path: "/orders", icon: <Package size={22} /> },
    { label: "Edit Profile", path: "/edit-profile", icon: <Edit size={22} /> },
    { label: "Addresses", path: "/addresses", icon: <MapPin size={22} /> },
  ];

  return (
    <aside className="sidebar-container">
      <div className="sidebar-glass">
        {/* Header Section */}
        <div className="sidebar__header">
          <div className="brand-logo">B</div>
          <h2 className="sidebar__title">Namaste 🙏</h2>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar__nav-wrapper">
          <ul className="sidebar__nav">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item-container">
                <Link 
                  to={item.path} 
                  className={`sidebar__link ${location.pathname === item.path ? "active" : ""}`}
                >
                  <span className="sidebar__icon">{item.icon}</span>
                  <span className="sidebar__label">{item.label}</span>
                  {location.pathname === item.path && <div className="active-glow" />}
                </Link>
              </li>
            ))}
            
            {/* Mobile-only Logout (Visible only on small screens) */}
            <li className="nav-item-container mobile-logout-item">
               <button className="sidebar__link logout-trigger-btn" onClick={handleLogout}>
                  <LogOut size={22} />
                  <span className="sidebar__label">Logout</span>
               </button>
            </li>
          </ul>
        </nav>

        {/* Desktop Footer Section */}
        <div className="sidebar__footer">
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;