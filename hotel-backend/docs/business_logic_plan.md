# Business Logic Architecture & Operational Plan

This document details the business logic, state machines, validation rules, transaction management, and sequence workflows for the **Hotel Management System Service Layer**.

---

## 1. Core State Machines & Lifecycles

### 1.1 Room Status Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> Available : Initial Creation
    Available --> Booked : Advance Booking Confirmed
    Available --> Occupied : Walk-in Check-in
    Booked --> Occupied : Guest Check-in
    Occupied --> Cleaning : Guest Check-out
    Cleaning --> Available : Housekeeping Clean Complete
    Available --> Maintenance : Issue Reported
    Occupied --> Maintenance : Urgent Repair
    Maintenance --> Cleaning : Repair Complete
    Booked --> Available : Booking Cancelled / No-show
```

### 1.2 Booking Status Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> Pending : Draft Reservation Created
    Pending --> Confirmed : Deposit Paid / Confirmed by Staff
    Confirmed --> CheckedIn : Guest Arrives (POST /check-in)
    Confirmed --> Cancelled : Cancelled (>24h prior)
    Pending --> Cancelled : Payment Expired / Cancelled
    CheckedIn --> CheckedOut : Bill Settled & Keys Returned (POST /check-out)
    CheckedOut --> [*]
    Cancelled --> [*]
```

---

## 2. Sequence Diagrams for Core Business Operations

### 2.1 Checking Room Availability Flow

```mermaid
sequenceDiagram
    autonumber
    actor Receptionist as Front Desk / Guest
    participant Handler as RoomHandler
    participant Service as RoomService
    participant Repo as RoomRepository
    participant DB as PostgreSQL DB

    Receptionist->>Handler: GET /api/rooms/available?check_in=2026-09-01&check_out=2026-09-05
    Handler->>Service: GetAvailableRooms("2026-09-01", "2026-09-05")
    
    Service->>Service: Validate: check_in >= Today, check_out > check_in, duration 1-30 days
    alt Invalid Date Range
        Service-->>Handler: Error (400 Bad Request)
        Handler-->>Receptionist: 400 Bad Request { "error": "Invalid date range" }
    else Valid Range
        Service->>Repo: FindAvailableRooms(checkIn, checkOut, typeID, minCapacity)
        Repo->>DB: Query rooms excluding IDs in active bookings (status: confirmed/checked-in/pending)
        DB-->>Repo: Available Room Records
        Repo-->>Service: []models.Room
        Service-->>Handler: Formatted Room DTOs
        Handler-->>Receptionist: 200 OK { success: true, data: rooms }
    end
```

---

### 2.2 Creating a New Booking Flow (Concurrency & Double-Booking Prevention)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Front Desk Staff / React UI
    participant Handler as BookingHandler
    participant Service as BookingService
    participant Repo as BookingRepository
    participant DB as PostgreSQL DB

    Client->>Handler: POST /api/bookings { guest_id, room_id, check_in_date, check_out_date, initial_payment }
    Handler->>Service: CreateBooking(userID, requestPayload)
    
    Service->>Service: 1. Validate Business Invariants (min 1 night, max 30 nights)
    Service->>Repo: 2. CheckRoomConflict(room_id, check_in, check_out)
    Repo->>DB: SELECT COUNT(*) FROM bookings WHERE room_id = $1 AND status IN ('confirmed', 'checked_in') AND (check_in_date < $3 AND check_out_date > $2)
    DB-->>Repo: count
    
    alt Overlap Detected (count > 0)
        Repo-->>Service: Conflict = true
        Service-->>Handler: Error: Room already reserved
        Handler-->>Client: 409 Conflict { "error": "Selected room is booked for these dates" }
    else No Overlap
        Service->>Service: 3. Calculate Total Price = Nights * RoomType.BasePrice
        Service->>Service: 4. Generate Booking Reference (e.g. BK-2026-XXXX)
        
        rect rgb(240, 248, 255)
            Note over Service, DB: Atomic Database Transaction
            Service->>Repo: Begin DB Transaction
            Repo->>DB: INSERT INTO bookings (...)
            alt Initial Payment Attached
                Repo->>DB: INSERT INTO payments (...)
            end
            Repo->>DB: INSERT INTO room_assignments (booking_id, room_id)
            Repo->>DB: Commit Transaction
        end
        
        Service-->>Handler: Full Booking Record with Payment
        Handler-->>Client: 201 Created { success: true, data: booking }
    end
```

---

### 2.3 Check-In Process Flow

```mermaid
sequenceDiagram
    autonumber
    actor Receptionist as Front Desk Staff
    participant Handler as BookingHandler
    participant Service as BookingService
    participant Repo as BookingRepository
    participant DB as PostgreSQL DB

    Receptionist->>Handler: POST /api/check-in/:bookingId
    Handler->>Service: CheckIn(bookingID)
    
    Service->>Repo: FindByID(bookingID)
    Repo->>DB: Fetch booking & assigned room
    DB-->>Repo: Booking Entity
    
    alt Booking Not Found or Not Confirmed
        Service-->>Handler: Error (400 / 404)
        Handler-->>Receptionist: Error Response
    else Valid Check-In
        rect rgb(240, 248, 255)
            Note over Service, DB: Atomic State Transition Transaction
            Service->>Service: Set booking.status = 'checked-in', actual_check_in = time.Now()
            Service->>Repo: Update booking record
            Repo->>DB: UPDATE bookings SET status='checked-in', actual_check_in=NOW() WHERE id=$1
            Service->>Repo: Update room status = 'occupied'
            Repo->>DB: UPDATE rooms SET status='occupied' WHERE id=$room_id
        end
        Service-->>Handler: Updated Booking Data
        Handler-->>Receptionist: 200 OK { "message": "Guest checked in", "data": booking }
    end
```

---

### 2.4 Check-Out & Invoice Generation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Receptionist as Front Desk Staff
    participant Handler as BookingHandler
    participant Service as BookingService
    participant Repo as BookingRepository
    participant DB as PostgreSQL DB

    Receptionist->>Handler: POST /api/check-out/:bookingId
    Handler->>Service: CheckOut(bookingID)
    
    Service->>Repo: FindByID(bookingID)
    Repo->>DB: Fetch booking, room, and payments
    DB-->>Repo: Booking + Payments list
    
    alt Booking Status != 'checked-in'
        Service-->>Handler: Error: Booking is not currently checked-in
        Handler-->>Receptionist: 400 Bad Request
    else Valid Check-Out
        Service->>Service: Calculate Total Paid vs Total Price (Balance Due)
        rect rgb(240, 248, 255)
            Note over Service, DB: Atomic Check-Out Transaction
            Service->>Service: Set booking.status = 'checked-out', actual_check_out = time.Now()
            Repo->>DB: UPDATE bookings SET status='checked-out', actual_check_out=NOW() WHERE id=$1
            Service->>Repo: Transition room status = 'cleaning' (Queued for housekeeping)
            Repo->>DB: UPDATE rooms SET status='cleaning' WHERE id=$room_id
        end
        Service-->>Handler: Invoice Summary (Total, Paid, Balance, Room Status)
        Handler-->>Receptionist: 200 OK { "message": "Guest checked out", "invoice": invoiceData }
    end
```

---

## 3. Hotel Business Rules & Validation Invariants

| Invariant / Rule | Constraint | Enforcement Point |
|---|---|---|
| **Minimum Stay** | 1 night minimum stay required | `BookingService.CreateBooking` / `UpdateBooking` |
| **Maximum Stay** | 30 nights maximum duration per single reservation | `BookingService.CreateBooking` |
| **Check-in Standard Window** | Standard check-in starts at `14:00 (2:00 PM)` | Front desk business rules & notifications |
| **Check-out Standard Window**| Standard check-out deadline is `12:00 (12:00 PM)` | Late checkout flag if timestamp > 12:00 PM |
| **Cancellation Policy** | Cancellations permitted without penalty if $\ge 24\text{ hours}$ before check-in date | `BookingService.CancelBooking` |
| **Double-Booking Guarantee** | No overlapping active bookings for the same room | DB Overlap Query + ACID Transactions |
| **Housekeeping Turnaround** | Checking out automatically changes room to `cleaning` | `BookingService.CheckOut` |
| **Occupancy Access** | Rooms in `maintenance` status are excluded from available listings | `RoomRepository.FindAvailableRooms` |
