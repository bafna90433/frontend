import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Package, Edit, MapPin, LogOut } from "lucide-react"; // ✅ Icons imported
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
    { label: "My Account", path: "/my-account", icon: <User size={20} /> },
    { label: "Orders", path: "/orders", icon: <Package size={20} /> },
    { label: "Edit Profile", path: "/edit-profile", icon: <Edit size={20} /> },
    { label: "Manage Addresses", path: "/addresses", icon: <MapPin size={20} /> }, // ✅ Added here
  ];

  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">Namaste 🙏</h2>
      <nav>
        <ul className="sidebar__nav">
          {navItems.map((item) => (
            <li
              key={item.path}
              className={`sidebar__item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <Link to={item.path} className="sidebar__link">
                <span className="sidebar__icon">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
          
          <li
            className="sidebar__item sidebar__logout"
            onClick={handleLogout}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleLogout();
              }
            }}
          >
            <span className="sidebar__icon"><LogOut size={20} /></span>
            Logout
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;