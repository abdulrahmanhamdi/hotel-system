export type UserRole = "admin" | "receptionist" | "housekeeping";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type RoomStatus = "available" | "booked" | "occupied" | "cleaning" | "maintenance";

export interface RoomType {
  id: number;
  name: string;
  base_price_per_night: number;
  capacity: number;
  description?: string;
  amenities?: string;
}

export interface Room {
  id: number;
  room_number: string;
  room_type_id: number;
  room_type?: RoomType;
  floor: number;
  status: RoomStatus;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  id_card_or_passport: string;
  address?: string;
  created_at?: string;
}

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";

export interface Booking {
  id: number;
  booking_reference: string;
  guest_id: number;
  guest?: Guest;
  room_id: number;
  room?: Room;
  check_in_date: string;
  check_out_date: string;
  actual_check_in?: string;
  actual_check_out?: string;
  total_price: number;
  status: BookingStatus;
  special_requests?: string;
  created_by_id: number;
  created_by?: User;
  created_at?: string;
}

export interface OccupancyReport {
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  cleaning_rooms: number;
  maintenance_rooms: number;
  occupancy_rate_percentage: number;
}

export interface RevenueReport {
  total_revenue: number;
  total_bookings: number;
  completed_stays: number;
  cancelled_stays: number;
  cash_revenue: number;
  card_revenue: number;
  transfer_revenue: number;
}
