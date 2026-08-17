import apiClient from "./client";
import type { ApiResponse, AuthResponse, LoginCredentials, User } from "../types";

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials
    );
    if (!response.data.data) {
      throw new Error(response.data.message || "Login failed");
    }
    return response.data.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/auth/me");
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to retrieve profile");
    }
    return response.data.data;
  },
};
