# Docker Environment & Containerization Guide

This document outlines the containerized setup for local development, hot reloading, database initialization, and production builds.

---

## 1. Docker Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER HOST (Local Machine)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              DOCKER COMPOSE                         │   │
│  │                                                     │   │
│  │  ┌──────────────┐    ┌──────────────────────────┐ │   │
│  │  │  Go API      │    │   PostgreSQL             │ │   │
│  │  │  Container   │◄──►│   Container              │ │   │
│  │  │  (Air reload)│    │   (15-alpine)            │ │   │
│  │  │  Port: 8080  │    │   Port: 5432             │ │   │
│  │  └──────────────┘    └──────────────────────────┘ │   │
│  │          ▲                    ▲                    │   │
│  │          │                    │                    │   │
│  │  ┌───────┴────────┐  ┌───────┴───────────────┐   │   │
│  │  │   Adminer      │  │   Persistent Volume   │   │   │
│  │  │   Container    │  │   (postgres_data)     │   │   │
│  │  │   Port: 8081   │  └───────────────────────┘   │   │
│  │  └────────────────┘                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           React App (Frontend)                     │   │
│  │           Port: 3000                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout

```
hotel-backend/
├── docker-compose.yml          # Compose orchestration (PostgreSQL, Go App, Adminer)
├── Dockerfile                  # Multi-stage build (Dev with Air hot reload + Lean Alpine Prod)
├── .dockerignore               # Ignores local binaries, tmp dirs, git histories
├── .air.toml                   # Live-reload watcher configuration
├── .env                        # Local active environment variables
├── .env.example                # Template for configuration
├── Makefile                    # Shortcut developer commands
├── scripts/
│   ├── init-db.sh              # Database bootstrap script
│   └── wait-for-db.sh          # Network barrier ensuring Postgres is ready before starting Air
├── migrations/
│   ├── 001_initial_schema.sql  # DDL schema definitions & index creation
│   └── 002_seed_data.sql       # Initial seed users, room types, rooms, and bookings
├── cmd/
│   └── api/
│       └── main.go
└── internal/
    └── ...
```

---

## 3. Developer Workflow Flowchart

```
Developer Setup Flow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    1. Clone Repository
           │
           ▼
    2. Copy .env.example → .env
           │
           ▼
    3. docker-compose up -d  (or `make up`)
           │
           ▼
    4. Wait for containers to start
           │
    ┌──────┴──────────┐
    ▼                 ▼
PostgreSQL        Go API
Container         Container
    │                 │
    ▼                 ▼
5. Database      6. API running
   initialized      on :8080
   with schema      with hot reload
   and seed data
    │                 │
    └──────┬──────────┘
           ▼
    7. Ready for development!
       - API: http://localhost:8080
       - Adminer: http://localhost:8081
       - Auto-reload enabled
           │
           ▼
    8. Edit .go file → Auto-recompile
       (Triggered by air in container)
           │
           ▼
    9. Test with React frontend / Postman
```

---

## 4. Key Services & Ports

| Service | Container Name | Host Port | Container Port | Purpose |
|---|---|---|---|---|
| **PostgreSQL** | `hotel_db` | `5432` | `5432` | Relational database storage with persistent volume `postgres_data` |
| **Go API** | `hotel_api` | `8080` | `8080` | Backend REST API server with Air live-reload |
| **Adminer** | `hotel_adminer` | `8081` | `8080` | Web database management GUI |

---

## 5. Convenient Makefile Commands

```bash
make up        # Start all containers in the background
make down      # Stop and remove containers
make logs      # Tail live Go server & Air reload logs
make test      # Execute tests inside the running container
make shell     # Access the container shell
make rebuild   # Rebuild containers after adding new dependencies
make clean     # Stop containers and destroy volumes for a fresh state
```
