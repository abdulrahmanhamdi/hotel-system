# ===================================================
# Multi-Stage Dockerfile for Go Fiber Backend
# Supports Live-Reload Development (Air) and Lean Production
# ===================================================

# ----------------- Base / Dev Stage -----------------
FROM golang:1.25-alpine AS dev

WORKDIR /app

# Install git, gcc/musl-dev, netcat (for wait-for-db), and Air (v1.61.0 for Go 1.24 compatibility)
RUN apk add --no-cache git build-base netcat-openbsd curl && \
    go install github.com/air-verse/air@v1.61.0

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Ensure helper scripts have execution permissions
RUN chmod +x scripts/*.sh 2>/dev/null || true

EXPOSE 8080

CMD ["air", "-c", ".air.toml"]

# ----------------- Build Stage -----------------
FROM dev AS builder

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/hotel-api cmd/api/main.go

# ----------------- Production Stage -----------------
FROM alpine:3.19 AS prod

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/bin/hotel-api /app/hotel-api
COPY .env.example /app/.env

EXPOSE 8080

CMD ["/app/hotel-api"]
