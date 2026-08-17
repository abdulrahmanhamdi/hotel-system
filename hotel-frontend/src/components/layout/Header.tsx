import React from "react";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { Badge } from "../common/Badge";
import "./Header.css";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <FaBars />
        </button>
        <div className="header-title-wrapper">
          <span className="hotel-branch">Main Branch • Downtown</span>
        </div>
      </div>

      <div className="header-right">
        {user && (
          <div className="user-profile-badge">
            <div className="user-avatar-circle">{getInitials(user.name)}</div>
            <div className="user-details-text">
              <span className="user-display-name">{user.name}</span>
              <Badge variant={user.role} size="sm">
                {user.role}
              </Badge>
            </div>
          </div>
        )}

        <button className="logout-action-btn" onClick={logout} title="Sign Out">
          <FaSignOutAlt className="logout-icon" />
          <span className="logout-text">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
