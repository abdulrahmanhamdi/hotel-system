-- 2. Seed Data Migration
-- Prepopulates default staff users, room types, sample rooms, and sample guest bookings

-- Seed Users (Bcrypt hashed passwords for default login: Admin@123456, Reception@123456, Housekeeper@123456)
INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES
(1, 'System Administrator', 'admin@hotel.com', '$2a$10$w8qP44XJb...adminhash', 'admin', TRUE),
(2, 'Jane Receptionist', 'reception@hotel.com', '$2a$10$d8fK92La...recephash', 'receptionist', TRUE),
(3, 'Bob Housekeeper', 'housekeeping@hotel.com', '$2a$10$p1lM83Ka...cleanhash', 'housekeeping', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Seed Room Types
INSERT INTO room_types (id, name, base_price, capacity, description, amenities) VALUES
(1, 'Single Standard', 80.00, 1, 'Cozy single room with high-speed Wi-Fi, work desk, and ensuite bathroom.', 'Wi-Fi, Air Conditioning, TV, Desk, Shower'),
(2, 'Double Deluxe', 140.00, 2, 'Spacious double bed room with balcony, minibar, and premium bedding.', 'Wi-Fi, King Bed, Balcony, Mini Bar, TV, Room Service'),
(3, 'Executive Suite', 280.00, 4, 'Luxury 2-bedroom suite with private lounge, jacuzzi, and city view.', 'Wi-Fi, Jacuzzi, Living Room, Kitchenette, 2 Smart TVs, Butler Service')
ON CONFLICT (name) DO NOTHING;

-- Seed Rooms
INSERT INTO rooms (id, number, room_type_id, price, floor, status, is_active) VALUES
(1, '101', 1, 80.00, 1, 'available', TRUE),
(2, '102', 1, 80.00, 1, 'available', TRUE),
(3, '201', 2, 140.00, 2, 'occupied', TRUE),
(4, '202', 2, 140.00, 2, 'available', TRUE),
(5, '301', 3, 280.00, 3, 'available', TRUE)
ON CONFLICT (number) DO NOTHING;

-- Seed Guests
INSERT INTO guests (id, name, email, phone, address, id_number) VALUES
(1, 'John Doe', 'john.doe@email.com', '+1-555-0101', '123 Maple Ave, Springfield, USA', 'PASS-USA-987654'),
(2, 'Emma Watson', 'emma.watson@email.com', '+44-20-7946-0912', '45 Oxford St, London, UK', 'PASS-GBR-123456'),
(3, 'Carlos Santana', 'carlos.s@email.com', '+34-91-123-4567', 'Gran Via 28, Madrid, Spain', 'ID-ESP-789012')
ON CONFLICT DO NOTHING;

-- Seed Sample Booking
INSERT INTO bookings (id, booking_reference, guest_id, check_in_date, check_out_date, total_price, status, special_requests, created_by_id) VALUES
(1, 'BK-2026-001', 1, '2026-09-01', '2026-09-04', 240.00, 'confirmed', 'Late check-in requested', 2),
(2, 'BK-2026-002', 2, '2026-08-16', '2026-08-19', 420.00, 'checked-in', 'Quiet room preferred', 2)
ON CONFLICT (booking_reference) DO NOTHING;

-- Seed Room Assignment
INSERT INTO room_assignments (id, booking_id, room_id, assigned_at, released_at, notes) VALUES
(1, 1, 1, '2026-08-15 10:00:00+00', NULL, 'Allocated room 101'),
(2, 2, 3, '2026-08-16 14:00:00+00', NULL, 'Allocated room 201 on check-in')
ON CONFLICT DO NOTHING;

-- Seed Payment
INSERT INTO payments (id, booking_id, amount, payment_method, payment_status, transaction_code, notes) VALUES
(1, 1, 120.00, 'credit_card', 'completed', 'TXN-20260815-001', '50% advance deposit'),
(2, 2, 420.00, 'credit_card', 'completed', 'TXN-20260816-002', 'Full payment upon check-in')
ON CONFLICT (transaction_code) DO NOTHING;
