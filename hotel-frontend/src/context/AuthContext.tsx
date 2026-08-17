import React, { useState, useEffect, useCallback } from "react";
import type { User, LoginCredentials } from "../types";
import { authApi } from "../api/auth.api";
import { AuthContext } from "./auth.context";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // Restore and verify session on initial load
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
        } catch {
          // Token is invalid/expired
          logout();
        }
      } else {
        logout();
      }
      setIsLoading(false);
    };

    restoreSession();
  }, [logout]);

  const login = async (credentials: LoginCredentials) => {
    const authData = await authApi.login(credentials);
    localStorage.setItem("token", authData.token);
    localStorage.setItem("user", JSON.stringify(authData.user));
    setToken(authData.token);
    setUser(authData.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
