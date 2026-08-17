import apiClient from "./client";
import type {
  ApiResponse,
  Room,
  RoomType,
  RoomStatus,
  CreateRoomRequest,
  UpdateRoomRequest,
} from "../types";

export interface GetRoomsParams {
  status?: RoomStatus | "";
  floor?: number;
  room_type_id?: number;
}

export interface CheckAvailabilityParams {
  check_in: string;
  check_out: string;
  room_type_id?: number;
  capacity?: number;
}

export const roomsApi = {
  getAllRooms: async (params?: GetRoomsParams): Promise<Room[]> => {
    const queryParams: Record<string, any> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.floor) queryParams.floor = params.floor;
    if (params?.room_type_id) queryParams.room_type_id = params.room_type_id;

    const response = await apiClient.get<ApiResponse<Room[]>>("/rooms", {
      params: queryParams,
    });
    return response.data.data || [];
  },

  getRoomById: async (id: number): Promise<Room> => {
    const response = await apiClient.get<ApiResponse<Room>>(`/rooms/${id}`);
    if (!response.data.data) {
      throw new Error(response.data.message || "Room not found");
    }
    return response.data.data;
  },

  createRoom: async (data: CreateRoomRequest): Promise<Room> => {
    const response = await apiClient.post<ApiResponse<Room>>("/rooms", data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to create room");
    }
    return response.data.data;
  },

  updateRoom: async (id: number, data: UpdateRoomRequest): Promise<Room> => {
    const response = await apiClient.put<ApiResponse<Room>>(`/rooms/${id}`, data);
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to update room");
    }
    return response.data.data;
  },

  updateRoomStatus: async (id: number, status: RoomStatus): Promise<{ room_id: number; status: RoomStatus }> => {
    const response = await apiClient.patch<ApiResponse<{ room_id: number; status: RoomStatus }>>(
      `/rooms/${id}/status`,
      { status }
    );
    return response.data.data || { room_id: id, status };
  },

  deleteRoom: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/rooms/${id}`);
  },

  checkAvailability: async (params: CheckAvailabilityParams): Promise<Room[]> => {
    const response = await apiClient.get<ApiResponse<Room[]>>("/rooms/available", {
      params,
    });
    return response.data.data || [];
  },

  getAllRoomTypes: async (): Promise<RoomType[]> => {
    const response = await apiClient.get<ApiResponse<RoomType[]>>("/room-types");
    return response.data.data || [];
  },
};
