# 🏨 Hotel Management System - Backend RESTful API

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/hotel-backend)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)](https://github.com/your-org/hotel-backend)
[![Go Version](https://img.shields.io/badge/go-1.24%2B-blue.svg)](https://golang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com)

A high-performance, production-ready RESTful API backend for a modern **Hotel Management System**. Built with **Go (Golang)**, **Fiber v2**, **GORM**, **PostgreSQL**, and **JWT Authentication with Role-Based Access Control (RBAC)**.

---

## 📑 Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Technology Stack](#2-technology-stack)
- [3. Clean Architecture & Request Flow](#3-clean-architecture--request-flow)
- [4. Project Structure](#4-project-structure)
- [5. Getting Started & Setup](#5-getting-started--setup)
- [6. API Endpoints Catalog](#6-api-endpoints-catalog)
- [7. Database Schema & ERD](#7-database-schema--erd)
- [8. Authentication & Authorization (RBAC)](#8-authentication--authorization-rbac)
- [9. Testing & Quality Assurance](#9-testing--quality-assurance)
- [10. Environment Variables](#10-environment-variables)
- [11. Available Makefile Commands](#11-available-makefile-commands)
- [12. Deployment Guide](#12-deployment-guide)
- [13. CI/CD Pipeline](#13-cicd-pipeline)
- [14. Contributing Guidelines](#14-contributing-guidelines)
- [15. License](#15-license)

---

## 1. Project Overview

The **Hotel Management System API** serves as the central backend engine for hotel management operations, designed to seamlessly power a React-based frontend single-page application (SPA) and third-party booking integrations.

### Key Capabilities:
- 🛏️ **Room & Category Inventory**: Full CRUD for physical rooms and categories with live status tracking (`available`, `booked`, `occupied`, `cleaning`, `maintenance`).
- 🔍 **Real-Time Room Availability**: Date-range overlap checks ensuring double-booking prevention.
- 👥 **Guest Profile Management**: Secure customer contact and identification records (Passport/National ID) with instant lookup.
- 📅 **Reservation Management & Operations**: Complete booking lifecycle management with atomic transactions.
- 🔑 **Check-In & Check-Out State Machines**: Automated transitions (`checked_in` $\to$ `occupied`, `checked_out` $\to$ `cleaning`, balance settlements).
- 🛡️ **Role-Based Security**: Granular RBAC (`admin`, `receptionist`, `housekeeping`) backed by stateless JWT authentication and Bcrypt hashing.
- 📊 **Financial & Occupancy Reporting**: Revenue breakdown across payment methods (`cash`, `credit_card`, `bank_transfer`) and real-time room occupancy metrics.

**Target Users**: Hotel Administrators, Front Desk Receptionists, Housekeeping Staff, and Management.

---

## 2. Technology Stack

| Layer / Concern | Technology | Description |
|---|---|---|
| **Language** | **Go (Golang)** `v1.24+` | Compiled performance, type safety, low memory overhead, and high concurrency. |
| **Web Framework** | **Fiber v2** (`github.com/gofiber/fiber/v2`) | Express-inspired HTTP router built on Fasthttp. |
| **ORM / Data Access** | **GORM** (`gorm.io/gorm`) | Schema auto-migrations, composable associations (`Preload`), and ACID transactions. |
| **Database Engine** | **PostgreSQL 15/16** | Relational integrity, foreign key constraints, and multi-column B-Tree date indexing. |
| **Authentication** | **JWT & Bcrypt** (`golang-jwt/jwt/v5`, `golang.org/x/crypto`) | Stateless bearer token authentication and salted password encryption (cost 10). |
| **Containerization** | **Docker & Docker Compose** | Multi-stage lightweight builds (Alpine) and isolated database orchestration. |
| **Development Tooling** | **Air** (`github.com/air-verse/air`) | Instant hot-reloading on source code edits. |
| **Testing & Benchmarking**| **Go Test, Testify, k6** | Unit tests, mock databases, table-driven tests, and load testing. |

---

## 3. Clean Architecture & Request Flow

The backend adheres strictly to **Clean Layered Architecture**, enforcing separation of concerns, easy mock testability, and constructor-based dependency injection.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HTTP REQUEST                                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ROUTER & MIDDLEWARE LAYER                            │
│  - Panic Recovery                                                       │
│  - Security Headers (OWASP HSTS, CSP, X-Frame-Options: DENY)            │
│  - Rate Limiter (20 req/min auth, 100 req/min API)                      │
│  - CORS Configuration (Restricted Origin Whitelist)                     │
│  - JWT Authentication Guard (Token Signature & Expiration)              │
│  - RBAC Guard (Admin, Receptionist, Housekeeping)                       │
│  - Structured Audit Logger (Masked Sensitive Data, Latency)             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      HANDLER LAYER (Controllers)                        │
│  - Parses HTTP JSON body, query parameters, URL params                  │
│  - Validates request format and invokes appropriate Service             │
│  - Formats uniform JSON envelopes: { success, message, data, error }    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER (Use Cases)                          │
│  - Encapsulates Core Business Logic & State Machines                    │
│  - Date Overlap Conflict Detection (Double-Booking Prevention)          │
│  - Price Calculations (Nights × Base Price)                             │
│  - Check-in & Check-out State Machine Transitions                       │
│  - Zero knowledge of HTTP context (Pure Go Structs)                     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER (Data Access)                        │
│  - Defined via Go Interfaces for seamless Unit Test Mocking             │
│  - Executes GORM Queries, Parameterized SQL, and Preload Joins          │
│  - Atomic Database Transactions (ROLLBACK on failure)                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Project Structure

```
hotel-backend/
├── cmd/
│   └── api/
│       └── main.go                     # Application entrypoint & Dependency Injection root
├── internal/
│   ├── config/
│   │   └── config.go                   # Environment configuration loader
│   ├── database/
│   │   ├── database.go                 # Database connection & Auto-migrations
│   │   └── seeder.go                   # Database seeder (Admin user, room types, sample rooms)
│   ├── models/                         # Domain Entities, DTOs & Validation Tags
│   │   ├── user.go                     # Staff accounts & roles
│   │   ├── room_type.go                # Room categories & base pricing
│   │   ├── room.go                     # Physical rooms & status definitions
│   │   ├── guest.go                    # Customer profiles & identity documents
│   │   ├── booking.go                  # Reservations & lifecycle states
│   │   └── payment.go                  # Payment records & invoice models
│   ├── repository/                     # Database Access Layer (GORM queries)
│   │   ├── user_repo.go
│   │   ├── room_repo.go
│   │   ├── guest_repo.go
│   │   ├── booking_repo.go
│   │   └── report_repo.go
│   ├── service/                        # Business Logic Layer
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── room_service.go
│   │   ├── guest_service.go
│   │   ├── booking_service.go
│   │   ├── report_service.go
│   │   └── service_test.go             # Table-driven unit and integration test suite
│   ├── handler/                        # HTTP Presentation Handlers (Fiber)
│   │   ├── auth_handler.go
│   │   ├── user_handler.go
│   │   ├── room_handler.go
│   │   ├── guest_handler.go
│   │   ├── booking_handler.go
│   │   └── report_handler.go
│   ├── middleware/                     # Interceptors & Security Guards
│   │   ├── auth.go                     # JWT validation
│   │   ├── rbac.go                     # Role-Based Access Control
│   │   ├── ratelimit.go                # Rate limiting (brute-force defense)
│   │   ├── security_headers.go         # OWASP security headers
│   │   └── audit_logger.go             # Audit logs with email masking
│   └── router/
│       └── router.go                   # Route registration & middleware pipeline wiring
├── pkg/
│   ├── response/
│   │   └── response.go                 # Standard JSON response formatting
│   └── utils/
│       └── token.go                    # JWT token pair generation, validation, & Bcrypt hashing
├── migrations/
│   ├── 001_initial_schema.sql          # PostgreSQL DDL table definitions & indexes
│   └── 002_seed_data.sql               # Initial seed data for container startup
├── scripts/
│   ├── wait-for-db.sh                  # TCP barrier awaiting PostgreSQL readiness
│   └── init-db.sh                      # Postgres extension setup
├── tests/
│   └── load/
│       └── k6_load_test.js             # K6 load testing script
├── docs/                               # Architecture, QA, Security, and API documentation
│   ├── api_specification_v2.md
│   ├── database_schema_design.md
│   ├── project_architecture.md
│   ├── business_logic_plan.md
│   ├── api_integration_guide.md
│   ├── security_best_practices.md
│   ├── comprehensive_testing_strategy.md
│   ├── security_vulnerability_assessment.md
│   ├── performance_and_load_testing.md
│   └── hotel_api_postman_collection.json
├── .github/
│   └── workflows/
│       └── ci.yml                      # CI/CD Automated Testing Pipeline
├── .air.toml                           # Live hot-reload watcher configuration
├── .dockerignore
├── .env.example
├── .env
├── Dockerfile                          # Multi-stage Docker build (Dev + Prod)
├── docker-compose.yml                  # Postgres, Go API, and Adminer service stack
├── Makefile                            # Developer shortcut commands
├── go.mod
└── go.sum
```

---

## 5. Getting Started & Setup

### Prerequisites
- **Go**: `v1.21` or higher (`go version`)
- **Docker**: `v24.0+` & **Docker Compose**
- **Git**

### Step-by-Step Quickstart

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/hotel-backend.git
   cd hotel-backend
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Start the complete stack with Docker Compose**:
   ```bash
   docker-compose up -d --build
   # OR using Makefile:
   make up
   ```

4. **Verify running services**:
   - **RESTful API**: `http://localhost:8080`
   - **Adminer DB Manager**: `http://localhost:8081` *(System: PostgreSQL, Server: `postgres`, DB: `hotel_db`, User: `hotel_user`, Pass: `hotel_secure_password`)*

5. **Default Pre-Seeded Accounts**:
   | Role | Email | Password |
   |---|---|---|
   | **Admin** | `admin@hotel.com` | `Admin@123456` |
   | **Receptionist** | `reception@hotel.com` | `Reception@123456` |
   | **Housekeeping** | `housekeeping@hotel.com` | `Housekeeper@123456` |

---

## 6. API Endpoints Catalog

Base URL: `http://localhost:8080/api/v1`

### 🔑 Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public (Rate-limited) | Login and receive Access Token (24h) + user profile |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile |

### 👥 Staff User Management (`/staff`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/staff` | `Admin` | Create a new staff account (`admin`, `receptionist`, `housekeeping`) |
| `GET` | `/api/v1/staff` | `Admin` | List all staff members |
| `GET` | `/api/v1/staff/:id` | `Admin` | Get staff user by ID |
| `PUT` | `/api/v1/staff/:id` | `Admin` | Update staff details, role, or active status |
| `DELETE` | `/api/v1/staff/:id` | `Admin` | Soft-delete / deactivate staff account |

### 🛏️ Rooms & Categories (`/rooms`, `/room-types`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/room-types` | Authenticated | List all room categories & nightly base rates |
| `POST` | `/api/v1/room-types` | `Admin` | Create a new room type |
| `GET` | `/api/v1/rooms` | Authenticated | List rooms (filterable by `status`, `floor`, `room_type_id`) |
| `GET` | `/api/v1/rooms/available` | Authenticated | Query available rooms for date range (`check_in`, `check_out`) |
| `POST` | `/api/v1/rooms` | `Admin` | Create a new physical room |
| `PUT` | `/api/v1/rooms/:id` | `Admin` | Update room number, floor, or category |
| `PATCH`| `/api/v1/rooms/:id/status` | `Admin, Receptionist, Housekeeping` | Update status (e.g. `cleaning` $\to$ `available`) |
| `DELETE`| `/api/v1/rooms/:id` | `Admin` | Decommission / delete room |

### 👤 Guest Management (`/guests`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/guests` | `Admin, Receptionist` | Register a new guest profile (Name, Email, Phone, Passport/ID) |
| `GET` | `/api/v1/guests` | `Admin, Receptionist` | List all guests (with text `search` query) |
| `GET` | `/api/v1/guests/:id` | `Admin, Receptionist` | Get guest profile & booking history |
| `PUT` | `/api/v1/guests/:id` | `Admin, Receptionist` | Update guest contact or identity information |
| `DELETE`| `/api/v1/guests/:id` | `Admin` | Delete guest record |

### 📅 Bookings & Front Desk Operations (`/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/bookings` | `Admin, Receptionist` | Create reservation (with date overlap check & deposit) |
| `GET` | `/api/v1/bookings` | `Admin, Receptionist` | List bookings (filterable by `status`, `guest_id`, `from`, `to`) |
| `GET` | `/api/v1/bookings/:id` | `Admin, Receptionist` | Get reservation details & payment transactions |
| `GET` | `/api/v1/bookings/reference/:ref` | `Admin, Receptionist` | Find booking by reference code (e.g. `BK-2026-XXXX`) |
| `PUT` | `/api/v1/bookings/:id` | `Admin, Receptionist` | Modify booking dates or room allocation |
| `POST` | `/api/v1/bookings/:id/check-in` | `Admin, Receptionist` | Check-in guest (sets room to `occupied`) |
| `POST` | `/api/v1/bookings/:id/check-out` | `Admin, Receptionist` | Check-out guest (sets room to `cleaning`, returns bill) |
| `POST` | `/api/v1/bookings/:id/cancel` | `Admin, Receptionist` | Cancel reservation & release room lock |
| `POST` | `/api/v1/bookings/payments` | `Admin, Receptionist` | Record payments (`cash`, `credit_card`, `bank_transfer`) |

### 📊 Analytics & Reports (`/reports`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/reports/occupancy` | `Admin, Receptionist` | Real-time occupancy percentages & room breakdown |
| `GET` | `/api/v1/reports/revenue` | `Admin` | Total revenue, breakdown by payment method, and stay stats |

---

## 7. Database Schema & ERD

### Entity-Relationship Diagram (ASCII)

```
  ┌──────────────────┐               ┌──────────────────┐
  │      USERS       │               │    ROOM_TYPES    │
  ├──────────────────┤               ├──────────────────┤
  │ id (PK)          │               │ id (PK)          │
  │ name             │               │ name (UK)        │
  │ email (UK)       │               │ base_price       │
  │ password_hash    │               │ capacity         │
  │ role             │               │ description      │
  │ is_active        │               └────────┬─────────┘
  └────────┬─────────┘                        │ 1:N
           │ 1:N                              ▼
           │                         ┌──────────────────┐
           │                         │      ROOMS       │
           │                         ├──────────────────┤
           │                         │ id (PK)          │
           │                         │ room_number (UK) │
           │                         │ room_type_id(FK) │
           │                         │ price            │
           │                         │ floor            │
           │                         │ status           │
           │                         │ is_active        │
           │                         └────────┬─────────┘
           │                                  │ 1:N
           ▼                                  ▼
  ┌─────────────────────────────────────────────────────┐
  │                      BOOKINGS                       │
  ├─────────────────────────────────────────────────────┤
  │ id (PK)                                             │
  │ booking_reference (UK)                              │
  │ guest_id (FK -> GUESTS.id)                          │
  │ room_id (FK -> ROOMS.id)                            │
  │ check_in_date (Index)                               │
  │ check_out_date (Index)                              │
  │ actual_check_in / actual_check_out                  │
  │ total_price                                         │
  │ status (pending | confirmed | checked_in | ...)     │
  │ created_by_id (FK -> USERS.id)                      │
  └───────────┬─────────────────────────────────────────┘
              │ 1:N                      ▲
              ▼                          │ 1:N
  ┌───────────────────────┐    ┌─────────┴────────────┐
  │       PAYMENTS        │    │        GUESTS        │
  ├───────────────────────┤    ├──────────────────────┤
  │ id (PK)               │    │ id (PK)              │
  │ booking_id (FK)       │    │ first_name           │
  │ amount                │    │ last_name            │
  │ payment_method        │    │ email (Index)        │
  │ payment_status        │    │ phone                │
  │ transaction_code (UK) │    │ id_card_or_passport  │
  │ created_at            │    │ address              │
  └───────────────────────┘    └──────────────────────┘
```

### Table Definitions & Key Constraints
1. **`users`**: Staff accounts with unique email, Bcrypt hash, and role constraint (`admin`, `receptionist`, `housekeeping`).
2. **`room_types`**: Master categories (`Single`, `Double Deluxe`, `Executive Suite`) with capacity and base rate.
3. **`rooms`**: Physical rooms with unique `room_number`, FK to `room_types`, and `status` (`available`, `booked`, `occupied`, `cleaning`, `maintenance`).
4. **`guests`**: Customer records with unique/indexed `email` and `id_card_or_passport`.
5. **`bookings`**: Reservations with unique `booking_reference`, `check_in_date`, `check_out_date`, composite overlap indexes, and lifecycle statuses.
6. **`payments`**: Transaction records linked via FK to `bookings` (`amount`, `payment_method`, `payment_status`).

---

## 8. Authentication & Authorization (RBAC)

Authentication is handled via signed **JSON Web Tokens (JWT)** using `HMAC-SHA256` (`HS256`).

### Including JWT in Protected Requests
Send the token in the standard HTTP `Authorization` header:
```http
Authorization: Bearer <your-jwt-access-token>
```

### Role-Based Access Control Matrix
| Resource / Action | Admin | Receptionist | Housekeeping |
|---|:---:|:---:|:---:|
| **Staff Management** (`/api/v1/staff`) | ✅ Full | ❌ | ❌ |
| **Room Types CRUD** (`/api/v1/room-types`) | ✅ Full | 👁️ Read Only | 👁️ Read Only |
| **Rooms CRUD** (`/api/v1/rooms`) | ✅ Full | 👁️ Read Only | 👁️ Read Only |
| **Room Status Updates** (`/api/v1/rooms/:id/status`)| ✅ Full | ✅ Update | ✅ Update |
| **Guest Management** (`/api/v1/guests`) | ✅ Full | ✅ Full | ❌ |
| **Booking & Check-in / Out** (`/api/v1/bookings`) | ✅ Full | ✅ Full | ❌ |
| **Occupancy Reports** (`/api/v1/reports/occupancy`)| ✅ Full | ✅ Full | ❌ |
| **Revenue Analytics** (`/api/v1/reports/revenue`) | ✅ Full | ❌ | ❌ |

---

## 9. Testing & Quality Assurance

The test suite covers unit tests, repository integration tests, state transitions, security tests, and performance benchmarks.

### Testing Pyramid Distribution
- **Unit Tests (70%)**: Table-driven tests for pricing, validation rules, token signing, and business logic.
- **Integration Tests (20-30%)**: Database transactions, date overlap collision checks, and foreign key integrity.
- **API Tests (10%)**: End-to-end HTTP tests with `httptest` validating headers and status codes.

### Running Tests
```bash
# Run all unit and integration tests
make test
# OR directly with go:
go test -v -race ./...

# Run tests with HTML coverage report
make test-cover
```

---

## 10. Environment Variables

All configurations are driven by environment variables:

```env
# Application Server
PORT=8080
APP_PORT=8080
ENV=development

# PostgreSQL Database Configuration
DB_DRIVER=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USER=hotel_user
DB_PASSWORD=hotel_secure_password
DB_NAME=hotel_db
DB_SSLMODE=disable

# JWT Authentication & Expiration
JWT_SECRET=super-secret-hotel-jwt-token-key-2026
JWT_EXPIRATION_HOURS=24
```

---

## 11. Available Makefile Commands

```bash
make up          # Start all containers in the background
make down        # Stop and remove all Docker containers
make logs        # Tail real-time Go server & Air hot-reload logs
make test        # Run the complete test suite with race detection
make test-cover  # Generate and view test coverage HTML report
make lint        # Run golangci-lint static analysis
make build       # Compile optimized static Linux binary to bin/
make rebuild     # Rebuild container images from scratch and restart
make clean       # Destroy containers and wipe persistent database volumes
```

---

## 12. Deployment Guide

### Standalone Docker Deployment
```bash
# 1. Build optimized production image
docker build --target prod -t hotel-api:latest .

# 2. Run standalone container
docker run -d \
  -p 8080:8080 \
  --name hotel_api \
  --env-file .env \
  hotel-api:latest
```

### Production Hardening Checklist
- [x] Configure strict CORS domains (disable wildcard `*`).
- [x] Enforce TLS / HTTPS termination on reverse proxy (Nginx / Cloudflare / Traefik).
- [x] Enable OWASP security headers (HSTS, CSP, X-Frame-Options: DENY).
- [x] Set strong, randomly generated `JWT_SECRET` (at least 32 characters).
- [x] Enable rate limiting on auth endpoints (20 req/min).

---

## 13. CI/CD Pipeline

The project includes an automated **GitHub Actions** workflow ([.github/workflows/ci.yml](file:///c:/Users/yukatech/hotel-system/hotel-backend/.github/workflows/ci.yml)):

```
┌─────────────────────────────────────────────────────────────┐
│                 GitHub Actions CI/CD Pipeline               │
│                                                             │
│  1. Code Checkout & Go 1.24 Setup                           │
│  2. golangci-lint Static Code Inspection                    │
│  3. gosec Automated AST Security Vulnerability Scan         │
│  4. Automated Test Suite execution with Race Detection      │
│  5. Code Coverage Gate Check (Must be >= 80%)               │
│  6. Production Static Binary Compilation Verification       │
└─────────────────────────────────────────────────────────────┘
```

---

## 14. Contributing Guidelines

1. **Branch Naming**:
   - Features: `feature/short-description` (e.g. `feature/room-amenities-filter`)
   - Bugfixes: `fix/short-description` (e.g. `fix/checkin-timestamp-null`)
2. **Commit Conventions**: Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add room availability cache`
   - `fix: correct check-out invoice balance calculation`
   - `test: add unit test for password complexity`
3. **Pull Request Checklist**:
   - [ ] All unit and integration tests pass (`make test`).
   - [ ] Linter reports zero issues (`make lint`).
   - [ ] New features include corresponding unit tests.

---

## 15. License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
