import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaHotel } from "react-icons/fa";
import apiClient from "../api/client";
import type { User } from "../types";
import "../styles/LoginPage.css";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
  error: string | null;
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("hotel_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const token = localStorage.getItem("token") || localStorage.getItem("hotel_token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await apiClient.post<LoginResponse>("/auth/login", {
        email: email.trim(),
        password: password,
      });

      if (response.data && response.data.success && response.data.data) {
        const { token, user } = response.data.data;

        localStorage.setItem("token", token);
        localStorage.setItem("hotel_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("hotel_user", JSON.stringify(user));

        if (rememberMe) {
          localStorage.setItem("hotel_remember_email", email.trim());
        } else {
          localStorage.removeItem("hotel_remember_email");
        }

        navigate("/dashboard", { replace: true });
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Login failed. Please check your credentials.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-content">
          <div className="brand-logo">
            <FaHotel />
          </div>

          <p className="brand-label">HOTEL MANAGEMENT SYSTEM</p>

          <h1>
            Welcome to your
            <span> hotel workspace.</span>
          </h1>

          <p className="brand-description">
            Manage rooms, reservations, guests and hotel operations from one
            secure platform.
          </p>

          <div className="brand-features">
            <div>
              <strong>Real-time</strong>
              <span>Room availability</span>
            </div>

            <div>
              <strong>Secure</strong>
              <span>Role-based access</span>
            </div>

            <div>
              <strong>Simple</strong>
              <span>Daily operations</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-section">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="mobile-logo">
            <FaHotel />
          </div>

          <div className="login-header">
            <p>WELCOME BACK</p>
            <h2>Sign in to your account</h2>
            <span>Enter your staff credentials to continue.</span>
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="name@hotel.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label="Show or hide password"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="login-footer">
            Secure access for authorized hotel staff only.
          </p>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
