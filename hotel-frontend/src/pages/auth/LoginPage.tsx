import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHotel, FaEye, FaEyeSlash, FaShieldAlt, FaCalendarCheck, FaChartPie } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import "./LoginPage.css";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState<string>(() => localStorage.getItem("hotel_remember_email") || "");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(() => !!localStorage.getItem("hotel_remember_email"));
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // If already authenticated, redirect to destination or dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      await login({ email: trimmedEmail, password });

      if (rememberMe) {
        localStorage.setItem("hotel_remember_email", trimmedEmail);
      } else {
        localStorage.removeItem("hotel_remember_email");
      }

      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Visual Brand Side */}
      <section className="login-brand-panel">
        <div className="brand-overlay" />
        <div className="brand-inner-content">
          <div className="brand-header">
            <div className="brand-icon-box">
              <FaHotel />
            </div>
            <div>
              <span className="brand-kicker">HOTEL MANAGEMENT SYSTEM</span>
              <h1 className="brand-main-title">Grand Horizon</h1>
            </div>
          </div>

          <div className="brand-headline">
            <h2>Seamless Operations, Exceptional Hospitality.</h2>
            <p>
              Integrated suite for front desk operations, real-time room availability,
              guest management, and role-based staff administration.
            </p>
          </div>

          <div className="brand-highlights">
            <div className="highlight-item">
              <div className="highlight-icon">
                <FaCalendarCheck />
              </div>
              <div>
                <strong>Atomic Availability</strong>
                <span>Zero double-booking guarantee</span>
              </div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">
                <FaShieldAlt />
              </div>
              <div>
                <strong>Role-Based Access</strong>
                <span>Admin, Reception, Housekeeping</span>
              </div>
            </div>
            <div className="highlight-item">
              <div className="highlight-icon">
                <FaChartPie />
              </div>
              <div>
                <strong>Live Business Intelligence</strong>
                <span>Instant occupancy & revenue tracking</span>
              </div>
            </div>
          </div>

          <div className="brand-footer-text">
            <span>HMS Enterprise Edition • Secured with JWT</span>
          </div>
        </div>
      </section>

      {/* Login Form Side */}
      <section className="login-form-panel">
        <div className="login-card-wrapper">
          <div className="login-mobile-header">
            <div className="mobile-brand-icon">
              <FaHotel />
            </div>
            <h2>Grand Horizon HMS</h2>
          </div>

          <div className="login-card-header">
            <span className="login-subtitle">STAFF PORTAL</span>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access your hotel workspace.</p>
          </div>

          {error && (
            <div className="login-alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-field-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="staff@hotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-reveal-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-actions-row">
              <label className="remember-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember my email</span>
              </label>
            </div>

            <button type="submit" className="submit-login-btn" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In to Workspace"}
            </button>
          </form>

          <footer className="login-card-footer">
            <p>Authorized hotel staff only. All activities are logged and monitored.</p>
          </footer>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
