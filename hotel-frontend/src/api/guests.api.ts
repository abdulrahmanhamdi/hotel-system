import apiClient from "./client";
import type { ApiResponse, Guest, CreateGuestRequest, UpdateGuestRequest } from "../types";

export const guestsApi = {
  getAllGuests: async (search?: string): Promise<Guest[]> => {
    const params: Record<string, string> = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await apiClient.get<ApiResponse<Guest[]>>("/guests", { params });
    return response.data.data || [];
  },

  getGuestById: async (id: number): Promise<Guest> => {
    const response = await apiClient.get<ApiResponse<Guest>>(`/guests/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || "Guest not found");
    }
    return response.data.data;
  },

  createGuest: async (data: CreateGuestRequest): Promise<Guest> => {
    const response = await apiClient.post<ApiResponse<Guest>>("/guests", data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to register guest");
    }
    return response.data.data;
  },

  updateGuest: async (id: number, data: UpdateGuestRequest): Promise<Guest> => {
    const response = await apiClient.put<ApiResponse<Guest>>(`/guests/${id}`, data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to update guest");
    }
    return response.data.data;
  },

  deleteGuest: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/guests/${id}`);
  },
};
