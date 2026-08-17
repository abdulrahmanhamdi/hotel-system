import React from "react";
import "./Badge.css";

export type BadgeVariant =
  | "available"
  | "booked"
  | "occupied"
  | "cleaning"
  | "maintenance"
  | "pending"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "completed"
  | "refunded"
  | "admin"
  | "receptionist"
  | "housekeeping"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant | string;
  children: React.ReactNode;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ variant = "default", children, size = "md" }) => {
  const formattedVariant = (variant || "default").toLowerCase().replace("-", "_");
  return (
    <span className={`badge badge-${formattedVariant} badge-${size}`}>
      {children}
    </span>
  );
};
