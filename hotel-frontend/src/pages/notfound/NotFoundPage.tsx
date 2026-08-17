import React from "react";
import { Link } from "react-router-dom";
import { FaCompass, FaArrowLeft } from "react-icons/fa";
import "./NotFoundPage.css";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-icon-box">
          <FaCompass />
        </div>
        <span className="not-found-code">404</span>
        <h1>Page Not Found</h1>
        <p>
          The page or operational resource you are attempting to access does not
          exist or has been relocated.
        </p>
        <Link to="/dashboard" className="return-home-btn">
          <FaArrowLeft />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
