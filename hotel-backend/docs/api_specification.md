# RESTful API Endpoints Specification

Base URL: `http://localhost:8080/api/v1`

---

## 1. Authentication (`/auth`)

### `POST /auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@hotel.com",
  "password": "Admin@123456"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "System Administrator",
      "email": "admin@hotel.com",
      "role": "admin",
      "is_active": true,
      "created_at": "2026-08-16T14:30:00Z"
    }
  }
}
```

### `GET /auth/me`
- **Access**: Bearer Token required
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": 1,
    "name": "System Administrator",
    "email": "admin@hotel.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-08-16T14:30:00Z"
  }
}
```

---

## 2. Staff Management (`/staff`)
*All `/staff` endpoints require role `admin`.*

### `POST /staff`
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah@hotel.com",
  "password": "Password123!",
  "role": "receptionist"
}
```

### `GET /staff`
- **Response (200 OK)**: Returns list of staff members.

### `PUT /staff/:id`
- **Request Body**:
```json
{
  "name": "Sarah Connor Updated",
  "role": "housekeeping",
  "is_active": true
}
```

### `DELETE /staff/:id`
- **Response (200 OK)**: Soft-deletes/deactivates staff member.

---

## 3. Room Types & Rates (`/room-types`)

### `GET /room-types`
- **Access**: Authenticated (`admin`, `receptionist`, `housekeeping`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Single Standard",
      "base_price_per_night": 75.0,
      "capacity": 1,
      "description": "Cozy single room with desk",
      "amenities": "Wi-Fi, AC, TV"
    }
  ]
}
```

### `POST /room-types`
- **Access**: `admin`
- **Request Body**:
```json
{
  "name": "Presidential Penthouse",
  "base_price_per_night": 500.0,
  "capacity": 6,
  "description": "Top floor luxury penthouse",
  "amenities": "Private Pool, Butler, Wi-Fi, Jacuzzi"
}
```

---

## 4. Rooms & Availability (`/rooms`)

### `GET /rooms`
- **Query Params**: `status` (available, occupied, cleaning, maintenance), `floor`, `room_type_id`.
- **Access**: Authenticated

### `GET /rooms/available`
- **Access**: Authenticated
- **Query Params**:
  - `check_in` (required, `YYYY-MM-DD`)
  - `check_out` (required, `YYYY-MM-DD`)
  - `room_type_id` (optional)
  - `capacity` (optional)
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Available rooms retrieved",
  "data": [
    {
      "id": 1,
      "room_number": "101",
      "room_type_id": 1,
      "room_type": {
        "id": 1,
        "name": "Single Standard",
        "base_price_per_night": 75.0,
        "capacity": 1
      },
      "floor": 1,
      "status": "available",
      "is_active": true
    }
  ]
}
```

### `PATCH /rooms/:id/status`
- **Access**: `admin`, `receptionist`, `housekeeping`
- **Request Body**:
```json
{
  "status": "available"
}
```

---

## 5. Guests (`/guests`)
*Access: `admin`, `receptionist`*

### `POST /guests`
- **Request Body**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0199",
  "id_card_or_passport": "P12345678",
  "address": "123 Main St, Springfield"
}
```

### `GET /guests`
- **Query Params**: `search` (searches first/last name, email, phone, or passport).

---

## 6. Bookings & Operations (`/bookings`)
*Access: `admin`, `receptionist`*

### `POST /bookings`
- **Request Body**:
```json
{
  "guest_id": 1,
  "room_id": 1,
  "check_in_date": "2026-09-01",
  "check_out_date": "2026-09-05",
  "special_requests": "Quiet room, extra pillow",
  "initial_payment": {
    "amount": 300.0,
    "payment_method": "credit_card"
  }
}
```

### `POST /bookings/:id/check-in`
- **Response (200 OK)**: Checks in guest, records `actual_check_in`, and sets room status to `occupied`.

### `POST /bookings/:id/check-out`
- **Response (200 OK)**: Checks out guest, records `actual_check_out`, and sets room status to `cleaning`.

### `POST /bookings/:id/cancel`
- **Response (200 OK)**: Cancels reservation and releases room locks.

### `POST /bookings/payments`
- **Request Body**:
```json
{
  "booking_id": 1,
  "amount": 150.0,
  "payment_method": "cash",
  "notes": "Balance settled at front desk"
}
```

---

## 7. Reports & Analytics (`/reports`)

### `GET /reports/revenue`
- **Access**: `admin`
- **Query Params**: `from` (`YYYY-MM-DD`), `to` (`YYYY-MM-DD`)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_revenue": 14500.0,
    "total_bookings": 48,
    "completed_stays": 42,
    "cancelled_stays": 3,
    "cash_revenue": 3200.0,
    "card_revenue": 9800.0,
    "transfer_revenue": 1500.0
  }
}
```

### `GET /reports/occupancy`
- **Access**: `admin`, `receptionist`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_rooms": 25,
    "available_rooms": 15,
    "occupied_rooms": 7,
    "cleaning_rooms": 2,
    "maintenance_rooms": 1,
    "occupancy_rate_percentage": 28.0
  }
}
```
