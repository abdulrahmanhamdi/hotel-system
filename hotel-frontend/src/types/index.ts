// API Response Envelope
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | null;
}

// 1. User & Authentication
export type UserRole = "admin" | "receptionist" | "housekeeping";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateStaffRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// 2. Room & Room Types
export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance" | "booked";

export interface RoomType {
  id: number;
  name: string;
  base_price_per_night: number;
  capacity: number;
  description?: string;
  amenities?: string;
}

export interface CreateRoomTypeRequest {
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
  created_at: string;
  updated_at?: string;
}

export interface CreateRoomRequest {
  room_number: string;
  room_type_id: number;
  floor: number;
  status?: RoomStatus;
}

export interface UpdateRoomRequest {
  room_number?: string;
  room_type_id?: number;
  floor?: number;
  status?: RoomStatus;
  is_active?: boolean;
}

export interface UpdateRoomStatusRequest {
  status: RoomStatus;
}

// 3. Guest Profile
export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  id_card_or_passport: string;
  address?: string;
  created_at: string;
  updated_at?: string;
  bookings?: Booking[];
}

export interface CreateGuestRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  id_card_or_passport: string;
  address?: string;
}

export interface UpdateGuestRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  id_card_or_passport?: string;
  address?: string;
}

// 4. Booking & Lifecycle
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
  payments?: Payment[];
  created_at: string;
  updated_at?: string;
}

export interface CreateBookingRequest {
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  special_requests?: string;
  initial_payment?: {
    amount: number;
    payment_method: PaymentMethod;
  };
}

export interface UpdateBookingRequest {
  room_id?: number;
  check_in_date?: string;
  check_out_date?: string;
  special_requests?: string;
}

// 5. Payments & Invoicing
export type PaymentMethod = "cash" | "credit_card" | "debit_card" | "bank_transfer";
export type PaymentStatus = "pending" | "completed" | "refunded";

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_code: string;
  notes?: string;
  created_at: string;
}

export interface CreatePaymentRequest {
  booking_id: number;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
}

// 6. Reporting Models
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
