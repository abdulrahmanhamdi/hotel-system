# Database Schema & Entity Design

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "creates"
    ROOM_TYPES ||--o{ ROOMS : "categorizes"
    ROOMS ||--o{ BOOKINGS : "reserved_in"
    GUESTS ||--o{ BOOKINGS : "books"
    BOOKINGS ||--o{ PAYMENTS : "paid_by"

    USERS {
        uint id PK
        string name
        string email UK
        string password_hash
        enum role "admin | receptionist | housekeeping"
        bool is_active
        datetime created_at
        datetime updated_at
    }

    ROOM_TYPES {
        uint id PK
        string name UK
        decimal base_price_per_night
        int capacity
        text description
        text amenities
        datetime created_at
    }

    ROOMS {
        uint id PK
        string room_number UK
        uint room_type_id FK
        int floor
        enum status "available | occupied | cleaning | maintenance"
        bool is_active
        datetime created_at
    }

    GUESTS {
        uint id PK
        string first_name
        string last_name
        string email
        string phone
        string id_card_or_passport
        text address
        datetime created_at
    }

    BOOKINGS {
        uint id PK
        string booking_reference UK
        uint guest_id FK
        uint room_id FK
        date check_in_date
        date check_out_date
        datetime actual_check_in
        datetime actual_check_out
        decimal total_price
        enum status "pending | confirmed | checked_in | checked_out | cancelled"
        text special_requests
        uint created_by_id FK
        datetime created_at
    }

    PAYMENTS {
        uint id PK
        uint booking_id FK
        decimal amount
        enum payment_method "cash | credit_card | debit_card | bank_transfer"
        enum payment_status "completed | pending | refunded"
        string transaction_code UK
        text notes
        datetime created_at
    }
```

---

## 2. Integrity & Concurrency Rules

1. **Room Availability Conflict Guarantee**:
   - A room cannot have overlapping bookings if its status is in (`confirmed`, `checked_in`, `pending`).
   - Overlap query rule: `booking.check_in_date < RequestedCheckOut AND booking.check_out_date > RequestedCheckIn`.
2. **State Transition Lifecycle**:
   - **Booking Creation** $\rightarrow$ Status: `confirmed`.
   - **Check-in** $\rightarrow$ Booking: `checked_in`, Room: `occupied`, sets `actual_check_in`.
   - **Check-out** $\rightarrow$ Booking: `checked_out`, Room: `cleaning`, sets `actual_check_out`.
   - **Housekeeping Finish** $\rightarrow$ Room: `available`.
   - **Cancellation** $\rightarrow$ Booking: `cancelled`, Room: released to `available`.
3. **Cascade & Deletion Safeguards**:
   - Soft deletes (`gorm.DeletedAt`) preserve historical reports and audits.
   - Deleting a room type is protected if active rooms reference it.
