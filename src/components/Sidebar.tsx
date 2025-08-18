import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
    { label: "My Account", path: "/my-account" },
    { label: "Orders", path: "/orders" },
    { label: "Edit Profile", path: "/edit-profile" },
    { label: "Manage Addresses", path: "/addresses" },
  ];

  return (
    <aside className="sidebar">
      <h2 className="sidebar__title">Namaste</h2>
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
            Logout
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
