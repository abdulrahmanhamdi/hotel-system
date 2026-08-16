# Technology Stack & Architecture Decisions

## 1. Core Technologies

| Layer / Concern | Technology | Version / Tooling | Rationale |
|---|---|---|---|
| **Language** | Go (Golang) | `1.24+` / `1.26` | Compiled performance, ultra-low memory footprint, high concurrency goroutines. |
| **Web Framework** | Fiber v2 | `github.com/gofiber/fiber/v2` | Fast HTTP routing built on Fasthttp, zero-memory allocation philosophy, Express-like ergonomics for frontend teams. |
| **ORM / Data Access** | GORM | `gorm.io/gorm` | Schema auto-migrations, composable eager-loading (`Preload`), transactions, soft-deletes. |
| **Database** | PostgreSQL / SQLite | `16-alpine` (Docker) | Relational integrity, ACID compliance, concurrent booking locks, date indexing. |
| **Auth & Security** | JWT & Bcrypt | `golang-jwt/jwt/v5`, `golang.org/x/crypto` | Stateless authentication, claims-based role authorization (`admin`, `receptionist`, `housekeeping`). |
| **Containerization** | Docker & Compose | Multi-stage Alpine build | Isolated local development, fast build pipelines, containerized PostgreSQL database. |

---

## 2. Architectural Design Principles

1. **Layered Separation of Concerns**:
   - `models`: Domain structures and validation tags.
   - `repository`: Pure database querying and GORM queries.
   - `service`: Business logic, state transitions, date conflict calculations, transaction scoping.
   - `handler`: HTTP context extraction, input validation, status responses.
   - `middleware`: Security boundaries (JWT verification, role authorization).
2. **Deterministic Response Structure**:
   - Uniform JSON envelope `{ success: bool, message: string, data: object, error: object }`.
   - Simplifies React client-side error handling and response parsing.
3. **Data Integrity & Concurrency**:
   - Database transactions for multi-step operations (e.g. creating a booking + recording initial deposit).
   - Date range overlap subqueries prevent double-booking collisions.
