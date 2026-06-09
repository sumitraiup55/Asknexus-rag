import { useState } from "react";
import { Bell, Menu, Sparkles } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import AccessBadge from "./AccessBadge";
import GlobalSearch from "./GlobalSearch";
import Sidebar from "./Sidebar";

import "../styles/dashboard.css";

const DashboardLayout = ({ children, title, subtitle }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <Sidebar
        isMobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="topbar-actions">
            <GlobalSearch />

            <AccessBadge user={user} compact />

            <button className="icon-btn">
              <Bell size={20} />
            </button>

            <div className="topbar-profile">
              <div className="profile-avatar">
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <h4>{user?.fullName || "User"}</h4>
                <p>{user?.department || "general"}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="ai-banner">
          <div>
            <span>
              <Sparkles size={16} />
              AskNexus AI is ready
            </span>

            <h2>Search your company knowledge with trusted document sources.</h2>
          </div>
        </section>

        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;