import React from "react";
import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md", text }) => {
  return (
    <div className="spinner-container">
      <div className={`spinner spinner-${size}`} />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
};
