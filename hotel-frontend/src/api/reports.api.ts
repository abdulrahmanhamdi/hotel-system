import apiClient from "./client";
import type { ApiResponse, OccupancyReport, RevenueReport } from "../types";

export const reportsApi = {
  getOccupancyReport: async (): Promise<OccupancyReport> => {
    const response = await apiClient.get<ApiResponse<OccupancyReport>>("/reports/occupancy");
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to retrieve occupancy report");
    }
    return response.data.data;
  },

  getRevenueReport: async (from?: string, to?: string): Promise<RevenueReport> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const response = await apiClient.get<ApiResponse<RevenueReport>>("/reports/revenue", {
      params,
    });
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to retrieve revenue report");
    }
    return response.data.data;
  },
};
