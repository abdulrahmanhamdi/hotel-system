import apiClient from "./client";
import type { ApiResponse, User, CreateStaffRequest, UpdateStaffRequest } from "../types";

export const staffApi = {
  getAllStaff: async (): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>("/staff");
    return response.data.data || [];
  },

  getStaffById: async (id: number): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/staff/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || "Staff member not found");
    }
    return response.data.data;
  },

  createStaff: async (data: CreateStaffRequest): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>("/staff", data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to create staff member");
    }
    return response.data.data;
  },

  updateStaff: async (id: number, data: UpdateStaffRequest): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>(`/staff/${id}`, data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to update staff member");
    }
    return response.data.data;
  },

  deleteStaff: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/staff/${id}`);
  },
};
