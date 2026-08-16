# Security Architecture & Best Practices Guide

This document details the security layers, vulnerability defenses, OWASP security header implementations, rate-limiting policies, and audit trails for the **Hotel Management System Backend**.

---

## 1. Multi-Layer Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React App)                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS (TLS 1.3)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                 │
│  - SSL Termination                                              │
│  - IP Whitelisting & DDoS Filtering                            │
│  - Rate Limiting Gateway (1000 req/min Public)                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FIBER MIDDLEWARE LAYER                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  1. Panic Recovery Middleware (Fault Tolerance)         │  │
│  │  2. CORS Security (Restricted Origin Whitelist)          │  │
│  │  3. Security Headers (HSTS, CSP, X-Frame-Options, etc.) │  │
│  │  4. Audit Logger (Masked Sensitive Data, IP, Latency)   │  │
│  │  5. Rate Limiter (20 req/min Auth, 100 req/min API)     │  │
│  │  6. JWT Authentication (HS256 Bearer Token Verification) │  │
│  │  7. RBAC Authorization Guard (Admin, Recept, Housekeep)  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION HANDLERS                        │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐  │
│  │ Auth        │  │ Bookings    │  │ Reports               │  │
│  │ Handler     │  │ Handler     │  │ Handler               │  │
│  └─────────────┘  └─────────────┘  └───────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                     │
│  - Parameterized Queries (SQL Injection Prevention)             │
│  - Bcrypt Password Hashes (Cost 10, never plain text)           │
│  - Referential Integrity & Overlap Constraints                  │
│  - ACID Transactions (Rollback on Failure)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. JWT Authentication & Refresh Flow

```
┌──────────────┐                    ┌──────────────┐
│   Client     │                    │    Server    │
│   (React)    │                    │    (API)     │
└──────┬───────┘                    └──────┬───────┘
       │                                    │
       │  1. POST /api/v1/auth/login        │
       │  { email, password }               │
       │───────────────────────────────────>│
       │                                    │
       │  2. Verify credentials             │
       │     Bcrypt.Compare(password, hash) │
       │                                    │
       │  3. Generate JWT Token Pair        │
       │     - Access Token (24 hours)      │
       │     - Refresh Token (7 days)       │
       │                                    │
       │  4. Return Tokens                  │
       │  { access_token, refresh_token }   │
       │<───────────────────────────────────│
       │                                    │
       │  5. Store Tokens Securely          │
       │     (HttpOnly Secure Cookie)       │
       │                                    │
       │  6. Request Protected Endpoint     │
       │  GET /api/v1/bookings              │
       │  Authorization: Bearer <token>     │
       │───────────────────────────────────>│
       │                                    │
       │  7. Validate JWT                   │
       │     Check signature, expiry, role  │
       │                                    │
       │  8. Return 200 OK Response         │
       │<───────────────────────────────────│
```

---

## 3. OWASP Security Headers Matrix

The [security_headers.go](file:///c:/Users/yukatech/hotel-system/hotel-backend/internal/middleware/security_headers.go) middleware automatically applies these headers to all HTTP responses:

| Header Name | Value | Purpose |
|---|---|---|
| **`X-Content-Type-Options`** | `nosniff` | Prevents browsers from MIME-sniffing away from declared Content-Type. |
| **`X-Frame-Options`** | `DENY` | Prevents Clickjacking attacks by forbidding embedding within `<iframe>` or `<frame>`. |
| **`X-XSS-Protection`** | `1; mode=block` | Activates browser XSS filtering and blocks rendering on attack detection. |
| **`Strict-Transport-Security`** | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS communication for 1 full year. |
| **`Content-Security-Policy`** | `default-src 'self'` | Restricts executable scripts and resources strictly to the origin. |
| **`Referrer-Policy`** | `strict-origin-when-cross-origin` | Protects referrer metadata leakage across non-HTTPS boundaries. |
| **`Cache-Control`** | `no-store, no-cache, must-revalidate` | Prevents caching sensitive API responses on intermediate proxies or browsers. |

---

## 4. Rate Limiting Strategy

| Endpoint Group | Rate Limit Rule | Implementation |
|---|---|---|
| **Authentication (`/auth/login`)** | **20 req / minute** per IP | Prevents brute-force credential stuffing and password spraying attacks. |
| **Authenticated API (`/api/v1/*`)** | **100 req / minute** per User/IP | Prevents server overload, scraping, and denial-of-service. |
| **Public Endpoints (`/`)** | **1000 req / minute** per IP | Ensures baseline availability for health checks and status pages. |

---

## 5. Audit Logging & Security Event Monitoring

The [audit_logger.go](file:///c:/Users/yukatech/hotel-system/hotel-backend/internal/middleware/audit_logger.go) middleware logs:
1. **Security Warnings (`401 Unauthorized`, `403 Forbidden`)**:
   - `[SECURITY WARNING] Status: 403 | Method: GET | Path: /api/v1/reports/revenue | IP: 192.168.1.5 | UserID: 3 | Role: housekeeping`
2. **Audit Trails for State Modifying Actions (`POST`, `PUT`, `DELETE`, `PATCH`)**:
   - `[AUDIT TRAIL] Action: POST | Path: /api/v1/bookings/1/check-in | Status: 200 | UserID: 2 | Role: receptionist`
3. **Data Masking Guarantee**:
   - Passwords and plain authorization tokens are **never** logged or included in response payloads.
