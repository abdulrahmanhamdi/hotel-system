import apiClient from "./client";
import type {
  ApiResponse,
  Booking,
  BookingStatus,
  CreateBookingRequest,
  UpdateBookingRequest,
  Payment,
  CreatePaymentRequest,
} from "../types";

export interface GetBookingsParams {
  status?: BookingStatus | "";
  guest_id?: number;
  from?: string;
  to?: string;
}

export const bookingsApi = {
  getAllBookings: async (params?: GetBookingsParams): Promise<Booking[]> => {
    const queryParams: Record<string, any> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.guest_id) queryParams.guest_id = params.guest_id;
    if (params?.from) queryParams.from = params.from;
    if (params?.to) queryParams.to = params.to;

    const response = await apiClient.get<ApiResponse<Booking[]>>("/bookings", {
      params: queryParams,
    });
    return response.data.data || [];
  },

  getBookingById: async (id: number): Promise<Booking> => {
    const response = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || "Booking not found");
    }
    return response.data.data;
  },

  getBookingByReference: async (reference: string): Promise<Booking> => {
    const response = await apiClient.get<ApiResponse<Booking>>(
      `/bookings/reference/${encodeURIComponent(reference.trim())}`
    );
    if (!response.data.data) {
      throw new Error(response.data.message || "Booking not found");
    }
    return response.data.data;
  },

  createBooking: async (data: CreateBookingRequest): Promise<Booking> => {
    const response = await apiClient.post<ApiResponse<Booking>>("/bookings", data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to create booking");
    }
    return response.data.data;
  },

  updateBooking: async (id: number, data: UpdateBookingRequest): Promise<Booking> => {
    const response = await apiClient.put<ApiResponse<Booking>>(`/bookings/${id}`, data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to update booking");
    }
    return response.data.data;
  },

  checkIn: async (id: number): Promise<Booking> => {
    const response = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/check-in`);
    if (!response.data.data) {
      throw new Error(response.data.message || "Check-in failed");
    }
    return response.data.data;
  },

  checkOut: async (id: number): Promise<Booking> => {
    const response = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/check-out`);
    if (!response.data.data) {
      throw new Error(response.data.message || "Check-out failed");
    }
    return response.data.data;
  },

  cancelBooking: async (id: number): Promise<Booking> => {
    const response = await apiClient.post<ApiResponse<Booking>>(`/bookings/${id}/cancel`);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to cancel booking");
    }
    return response.data.data;
  },

  addPayment: async (data: CreatePaymentRequest): Promise<Payment> => {
    const response = await apiClient.post<ApiResponse<Payment>>("/bookings/payments", data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to record payment");
    }
    return response.data.data;
  },
};
