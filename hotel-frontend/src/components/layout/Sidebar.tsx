import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHotel,
  FaThLarge,
  FaBed,
  FaUsers,
  FaCalendarAlt,
  FaConciergeBell,
  FaChartLine,
  FaUserShield,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../types";
import "./Sidebar.css";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <FaThLarge />,
    allowedRoles: ["admin", "receptionist", "housekeeping"],
  },
  {
    to: "/rooms",
    label: "Rooms Inventory",
    icon: <FaBed />,
    allowedRoles: ["admin", "receptionist", "housekeeping"],
  },
  {
    to: "/guests",
    label: "Guests Directory",
    icon: <FaUsers />,
    allowedRoles: ["admin", "receptionist"],
  },
  {
    to: "/bookings",
    label: "Bookings",
    icon: <FaCalendarAlt />,
    allowedRoles: ["admin", "receptionist"],
  },
  {
    to: "/checkin-checkout",
    label: "Front Desk Operations",
    icon: <FaConciergeBell />,
    allowedRoles: ["admin", "receptionist"],
  },
  {
    to: "/reports",
    label: "Reports & Analytics",
    icon: <FaChartLine />,
    allowedRoles: ["admin", "receptionist"],
  },
  {
    to: "/staff",
    label: "Staff Management",
    icon: <FaUserShield />,
    allowedRoles: ["admin"],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const currentRole = user?.role;

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`app-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">
            <FaHotel className="brand-logo-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">GRAND HORIZON</span>
            <span className="brand-subtitle">HOTEL MANAGEMENT</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">MAIN NAVIGATION</div>
          <ul className="nav-list">
            {navItems
              .filter((item) => currentRole && item.allowedRoles.includes(currentRole))
              .map((item) => (
                <li key={item.to} className="nav-item">
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                    onClick={onClose}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-indicator-dot" />
            <span className="system-status-text">HMS v1.0.0 Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};
