# Docker Build & Run Execution Guide

This document provides the exact commands and verification steps to build and launch the **Hotel Management System** container stack using the pinned **Air v1.61.0** binary and Go 1.24.

---

## 1. Fast All-in-One Execution Command

Run this one-line command in your terminal inside `c:\Users\yukatech\hotel-system\hotel-backend`:

```bash
docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

---

## 2. Step-by-Step Command Breakdown

### Step 1: Stop Running Containers
```bash
docker-compose down
```

### Step 2: Clean Old Images (Optional)
```bash
docker rmi hotel-backend-app 2>/dev/null || echo "No old image to remove"
```

### Step 3: Build the Container Images Without Cache
```bash
docker-compose build --no-cache
```

### Step 4: Start the Stack in Detached Mode
```bash
docker-compose up -d
```

### Step 5: Follow Server & Air Live-Reload Logs
```bash
docker-compose logs -f app
```

---

## 3. Post-Startup Verification Checklist

### 1. Verify Running Containers
```bash
docker ps
```
**Expected Output (3 Containers)**:
- `hotel_db` (`postgres:15-alpine`) on port `5432`
- `hotel_api` (`hotel-backend-app`) on port `8080`
- `hotel_adminer` (`adminer:latest`) on port `8081`

---

### 2. Verify Health Check Endpoint
```bash
curl http://localhost:8080/health
```
**Expected JSON Response**:
```json
{
  "success": true,
  "message": "healthy",
  "data": {
    "status": "up"
  }
}
```

---

### 3. Verify Admin Authentication & JWT Generation
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@hotel.com\",\"password\":\"Admin@123456\"}"
```
**Expected JSON Response**:
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
      "is_active": true
    }
  }
}
```

---

### 4. Verify Database Adminer Web GUI
Open in your browser:
- **URL**: [http://localhost:8081](http://localhost:8081)
- **System**: `PostgreSQL`
- **Server**: `postgres`
- **Username**: `hotel_user`
- **Password**: `hotel_secure_password`
- **Database**: `hotel_db`

---

## 4. Useful Troubleshooting Commands

| Scenario | Command |
|---|---|
| **View all service logs** | `docker-compose logs -f` |
| **View Go app & Air logs only** | `docker-compose logs -f app` |
| **Restart the API container** | `docker-compose restart app` |
| **Test PostgreSQL connectivity** | `docker-compose exec app nc -zv postgres 5432` |
| **Access App Container Shell** | `docker-compose exec app sh` |
| **Wipe data & restart fresh** | `docker-compose down -v && docker-compose up -d --build` |
