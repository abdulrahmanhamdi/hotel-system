# Comprehensive Testing Strategy & QA Plan

This document details the multi-level testing architecture, test coverage enforcement, table-driven unit tests, integration testing with database engines, security penetration tests, performance benchmarks with k6, and GitHub Actions CI/CD pipelines.

---

## 1. Testing Architecture & Test Level Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CI/CD Pipeline (GitHub Actions)             │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │ 1. Lint & Static Analysis (golangci-lint)        │  │   │
│  │  │ 2. Unit Tests (Table-Driven Service Logic)       │  │   │
│  │  │ 3. Integration Tests (PostgreSQL / Test DB)      │  │   │
│  │  │ 4. API Tests (HTTP Handlers & httptest)          │  │   │
│  │  │ 5. Security Scan (gosec AST scanner)             │  │   │
│  │  │ 6. Coverage Report (Enforce >= 80% Gate)         │  │   │
│  │  │ 7. Performance Tests (k6 Benchmarks)             │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              TEST ENVIRONMENTS                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │ Test DB      │  │ Mock DB      │  │ Test API     │ │   │
│  │  │ (Postgres/CI)│  │ (In-Memory)  │  │ (httptest)   │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              TEST TYPES                                 │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │ Unit Tests   │  │ Integration  │  │ API / E2E    │ │   │
│  │  │ (Service)    │  │ (Repository) │  │ (Handlers)   │ │   │
│  │  │ 70% Effort   │  │ 20% Effort   │  │ 10% Effort   │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Test Coverage Goals & Target Metrics

| Layer / Package | Target Line Coverage | Critical Path Verification |
|---|:---:|---|
| **Service Layer** (`internal/service`) | $\mathbf{\ge 90\%}$ | Availability date collisions, check-in/out transitions, price calculations |
| **Handler Layer** (`internal/handler`) | $\mathbf{\ge 80\%}$ | JSON binding, HTTP status codes, validation response envelopes |
| **Repository Layer** (`internal/repository`) | $\mathbf{\ge 75\%}$ | SQL query filters, eager loading (Preload), soft-deletes |
| **Security & Utilities** (`pkg/utils`, `middleware`) | $\mathbf{\ge 90\%}$ | Bcrypt hashing, token issuance/refresh, RBAC role guard |
| **Overall Codebase Target** | $\mathbf{\ge 80\%}$ | Coverage gate verified in CI/CD pipeline |

---

## 3. Implemented Test Suites

### 3.1 Unit Testing (Table-Driven Pricing & Dates)
Implemented in [service_test.go](file:///c:/Users/yukatech/hotel-system/hotel-backend/internal/service/service_test.go):
- Valid standard multi-night bookings across room types.
- Strict rejection of zero-night reservations (`check_in == check_out`).
- Strict rejection of inverted date ranges (`check_out < check_in`).

### 3.2 System Workflow & Repository Integration Testing
- **Staff Provisioning & Login**: Creates admin user, hashes password via Bcrypt, and validates signed JWT token.
- **Room & Inventory Setup**: Creates Room Type and physical Room.
- **Guest Registration**: Creates guest record with passport index.
- **Double-Booking Collision Prevention**: Creates booking, then attempts an overlapping booking during the same dates $\to$ verifies error return.
- **Full Operational Lifecycle**:
  - `CheckIn()` transitions booking to `checked-in` and sets room to `occupied`.
  - `CheckOut()` transitions booking to `checked-out`, sets room to `cleaning`, and generates bill.
  - `UpdateRoomStatus()` transitions room from `cleaning` $\to$ `available`.
- **Revenue & Occupancy Analytics**: Verifies income summation and real-time occupancy counts.

### 3.3 Security & JWT Refresh Testing
- Rejection of weak passwords lacking required character complexity.
- Acceptance of strong passwords with uppercase, lowercase, numbers, and symbols.
- Issue and validation of dual **Access Token (24h)** and **Refresh Token (7d)** pairs.

---

## 4. Performance & Load Testing with k6

High-throughput benchmarks simulate peak reservation traffic:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp up to 20 virtual users
        { duration: '1m', target: 50 },  // Sustained load at 50 users
        { duration: '30s', target: 0 },  // Ramp down to 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<200'], // 95% of requests must complete under 200ms
        http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
    },
};

export default function () {
    const res = http.get('http://localhost:8080/api/v1/rooms/available?check_in=2026-09-01&check_out=2026-09-05');
    check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 200ms': (r) => r.timings.duration < 200,
    });
    sleep(1);
}
```

### Performance Benchmarks Target Thresholds
- **Room Availability Queries**: $< 100\text{ ms}$ (enforced by `(check_in_date, check_out_date)` index).
- **Booking Creation Transaction**: $< 500\text{ ms}$ (including payment recording and atomic room lock).
- **30-Day Revenue Report Generation**: $< 2.0\text{ s}$.

---

## 5. CI/CD Automation Pipeline Configuration

The GitHub Actions workflow in [.github/workflows/ci.yml](file:///c:/Users/yukatech/hotel-system/hotel-backend/.github/workflows/ci.yml) automates:
1. **Linting**: `golangci-lint` enforces code styling and static rules.
2. **Security Auditing**: `gosec` static AST scanner checks for SQL injection risks and insecure dependencies.
3. **Automated Testing**: Executes `go test -v -race -coverprofile=coverage.out ./...` against a live PostgreSQL service container.
4. **Coverage Reporting**: Generates line coverage reports and validates the $\ge 80\%$ coverage threshold.
5. **Compilation Verification**: Verifies static Linux production binary builds cleanly (`go build -ldflags="-w -s"`).
