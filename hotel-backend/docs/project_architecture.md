# Project Architecture & Clean Layered Design (Go)

This document provides the clean architectural breakdown, directory layout, layer responsibilities, data flow, and dependency injection mechanics for the **Hotel Management System Backend**.

---

## 1. Complete Project Directory Layout

```
hotel-backend/
├── cmd/
│   └── api/
│       └── main.go                     # Application bootstrap & dependency injection root
├── internal/
│   ├── config/
│   │   └── config.go                   # Environment variable loader and validator
│   ├── database/
│   │   ├── db.go                       # GORM / PostgreSQL connection & migrations
│   │   └── seeder.go                   # Default admin user and initial room inventory
│   ├── domain/                         # Domain Entities & DTOs
│   │   ├── user.go                     # User entity & role definitions (Admin, Receptionist, Housekeeper)
│   │   ├── room.go                     # Room entity & statuses (Available, Booked, Occupied, Cleaning)
│   │   ├── guest.go                    # Guest identity & contact entity
│   │   ├── booking.go                  # Reservation entity & lifecycle states
│   │   └── payment.go                  # Payment transaction entity & invoice structures
│   ├── repository/                     # Data Access Layer (GORM queries & SQL)
│   │   ├── interfaces.go               # Repository interfaces (for mock testing)
│   │   ├── user_repo.go                # User persistence operations
│   │   ├── room_repo.go                # Room queries & date overlap availability checks
│   │   ├── guest_repo.go               # Guest persistence & search queries
│   │   ├── booking_repo.go             # Booking transactions & date conflict locks
│   │   └── report_repo.go              # Revenue & occupancy aggregation queries
│   ├── service/                        # Business Logic Layer (Use cases & workflows)
│   │   ├── auth_service.go             # Login authentication & token issuance
│   │   ├── user_service.go             # Staff CRUD & access administration
│   │   ├── room_service.go             # Room management & date validation
│   │   ├── guest_service.go            # Guest profile lifecycle
│   │   ├── booking_service.go          # Availability check, reservation creation, check-in/out
│   │   └── report_service.go           # Financial reporting & occupancy analytics
│   ├── handler/                        # Presentation Layer (Fiber HTTP Controllers)
│   │   ├── auth_handler.go             # Login, register, logout endpoints
│   │   ├── user_handler.go             # Staff management endpoints
│   │   ├── room_handler.go             # Room endpoints & status patches
│   │   ├── guest_handler.go            # Guest management endpoints
│   │   ├── booking_handler.go          # Booking, check-in, check-out, availability endpoints
│   │   └── report_handler.go           # Revenue and occupancy endpoints
│   ├── middleware/                     # HTTP Interceptors & Security Filters
│   │   ├── auth.go                     # JWT validation & context population
│   │   ├── roles.go                    # Role-Based Access Control (RBAC) guard
│   │   ├── cors.go                     # Cross-Origin Resource Sharing settings
│   │   └── logger.go                   # Structured request logging
│   └── router/
│       └── router.go                   # Fiber route definitions & middleware wiring
├── pkg/                                # Reusable Utilities & Shared Helpers
│   └── utils/
│       ├── response.go                 # Standard JSON response formatting
│       ├── validator.go                # Request validation helpers
│       └── jwt.go                      # JWT signing and Bcrypt password hashing
├── migrations/                         # SQL Schema Migrations (Docker entrypoint)
│   ├── 001_initial_schema.sql          # Base tables, foreign keys, and indexes
│   └── 002_seed_data.sql               # Initial seed data
├── scripts/                            # Operational & Containerization Scripts
│   ├── wait-for-db.sh                  # TCP readiness check for Postgres before app start
│   └── init-db.sh                      # Postgres extension setup
├── tests/                              # Automated Test Suites
│   ├── unit/                           # Isolated service & utility tests
│   └── integration/                    # Database & HTTP endpoint tests
├── .air.toml                           # Live reload configuration for local development
├── .env.example                        # Template environment variables
├── .env                                # Local configuration file
├── .dockerignore                       # Docker build exclusions
├── Dockerfile                          # Multi-stage build (Dev with Air + Lean Alpine Prod)
├── docker-compose.yml                  # Postgres, Go App, and Adminer service orchestration
├── Makefile                            # Developer command shortcuts
├── go.mod                              # Go module definition
├── go.sum                              # Checksum database
└── README.md                           # Quickstart guide
```

---

## 2. Layer Responsibilities & Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  - Fiber Handlers (auth_handler, booking_handler, etc.)     │
│  - Parses HTTP JSON body / query params                     │
│  - Returns standardized JSON envelopes and HTTP status codes│
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                          │
│  - Business logic, invariants, state transitions            │
│  - Transaction orchestration (e.g. Check-in + Room Status)  │
│  - Date range overlap checks & price calculations           │
│  - No knowledge of HTTP or Fiber (Clean Go structs)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Calls (via Interfaces)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    REPOSITORY LAYER                         │
│  - Pure data access with GORM / SQL                         │
│  - Auto-migrations, indexing, eager-loading (Preload)       │
│  - Database queries & transactional locks                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Reads/Writes
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                    │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Component | Core Responsibility |
|---|---|---|
| **Domain** | `internal/domain` | Plain Go structs representing database entities, status constants, and request/response DTOs. |
| **Repository** | `internal/repository` | Executes queries, filtering, and transactional operations against PostgreSQL. Defined via Go `interfaces` to allow mocking during unit testing. |
| **Service** | `internal/service` | Core business logic, pricing computations, date overlap verification, check-in/out state transitions, and password encryption. |
| **Handler** | `internal/handler` | Binds HTTP request bodies, handles URL parameters, invokes appropriate services, and returns standardized JSON responses. |
| **Middleware** | `internal/middleware` | Enforces JWT token validity, extracts authenticated user claims, and blocks unauthorized roles with `401`/`403`. |
| **Router** | `internal/router` | Registers RESTful routes, applies global middlewares (CORS, Recover, Logger), and groups protected endpoints. |

---

## 3. End-to-End Request Data Flow

The diagram below illustrates the exact execution path of an incoming HTTP request (e.g., `POST /api/check-in/4`):

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client (React)
    participant Router as Fiber Router (router.go)
    participant AuthMW as JWT & Role Middleware (auth.go, roles.go)
    participant Handler as Booking Handler (booking_handler.go)
    participant Service as Booking Service (booking_service.go)
    participant Repo as Booking & Room Repos (booking_repo.go)
    participant DB as PostgreSQL Database

    Client->>Router: POST /api/check-in/4 (Header: Bearer <jwt>)
    Router->>AuthMW: Intercept & verify JWT token
    AuthMW->>AuthMW: Check role is "admin" or "receptionist"
    AuthMW->>Handler: Forward request with c.Locals("user_id")
    Handler->>Handler: Parse URL parameter :bookingId = 4
    Handler->>Service: CheckIn(bookingID = 4)
    Service->>Repo: FindByID(4)
    Repo->>DB: SELECT * FROM bookings WHERE id = 4
    DB-->>Repo: Booking Record (Status: confirmed, RoomID: 101)
    Repo-->>Service: Booking Entity
    
    rect rgb(240, 248, 255)
        Note over Service, DB: Database Transaction
        Service->>Service: Set Booking Status = "checked-in", actual_check_in = NOW()
        Service->>Repo: Update Booking & Set Room 101 Status = "occupied"
        Repo->>DB: UPDATE bookings SET status='checked-in' WHERE id=4;
        Repo->>DB: UPDATE rooms SET status='occupied' WHERE id=101;
    end

    Repo-->>Service: Updated Entities
    Service-->>Handler: Complete Booking DTO
    Handler->>>Client: 200 OK { success: true, message: "Guest checked in", data: booking }
```

---

## 4. Dependency Injection & Testability

The architecture uses **Constructor-Based Dependency Injection** in `cmd/api/main.go`. Higher-level components depend on interfaces rather than concrete implementations:

```go
// 1. Initialize Database
db, err := database.InitDB(cfg)

// 2. Instantiate Repositories (implements Repository interfaces)
userRepo := repository.NewUserRepository(db)
roomRepo := repository.NewRoomRepository(db)
bookingRepo := repository.NewBookingRepository(db)

// 3. Inject Repositories into Services
bookingService := service.NewBookingService(bookingRepo, roomRepo, guestRepo)

// 4. Inject Services into Handlers
bookingHandler := handler.NewBookingHandler(bookingService)

// 5. Mount Handlers in Router
router.SetupRouter(app, &router.RouterDependencies{
    BookingHandler: bookingHandler,
    // ...
})
```

### Why this benefits the project:
1. **Zero Tight Coupling**: Handlers do not touch the database; services do not know about HTTP context.
2. **Effortless Mocking**: In unit tests, repository interfaces can be replaced with in-memory mock structs without requiring a live PostgreSQL instance.
3. **Future Scalability**: Adding caching (Redis) or message queues (RabbitMQ) only requires updating the service or repository layer without changing handlers.
