import {
  Bot,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  UserCircle,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isMobileOpen = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = user?.role || "user";
  const isAdmin = role === "admin" || role === "super_admin";

  const links = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "AI Chat",
      path: "/chat",
      icon: MessageSquareText,
    },
    ...(isAdmin
      ? [
          {
            label: "Documents",
            path: "/documents",
            icon: FileText,
          },
        ]
      : []),
    {
      label: "Profile",
      path: "/profile",
      icon: UserCircle,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleBrandClick = () => {
    navigate("/dashboard");
    onClose();
  };

  return (
    <aside className={isMobileOpen ? "sidebar mobile-open" : "sidebar"}>
      <div className="sidebar-mobile-head">
        <div className="sidebar-brand" onClick={handleBrandClick}>
          <div className="brand-icon">
            <Bot size={24} />
          </div>

          <div>
            <h2>AskNexus</h2>
            <p>AI Knowledge Hub</p>
          </div>
        </div>

        <button className="sidebar-close-btn" onClick={onClose}>
          <X size={21} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {links.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="user-info">
            <h4>{user?.fullName || "User"}</h4>
            <p>{role}</p>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;