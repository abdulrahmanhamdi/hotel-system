package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// SetupCORS configures and returns the CORS middleware
func SetupCORS() fiber.Handler {
	var allowedOrigins string

	if envOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); envOrigins != "" {
		allowedOrigins = envOrigins
	} else if os.Getenv("ENV") == "production" {
		allowedOrigins = "https://hotel.example.com, https://admin.hotel.example.com"
	} else {
		// Comprehensive development origins covering localhost, 127.0.0.1, and local IP with common dev ports
		devOrigins := []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
			"http://localhost:5173",
			"http://localhost:8080",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:3001",
			"http://127.0.0.1:3002",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:8080",
			"http://192.168.1.41:3000",
			"http://192.168.1.41:3001",
			"http://192.168.1.41:3002",
			"http://192.168.1.41:5173",
			"http://192.168.1.41:8080",
		}
		allowedOrigins = strings.Join(devOrigins, ", ")
	}

	return cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS, PATCH",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Headers",
		AllowCredentials: true,
		ExposeHeaders:    "Content-Length",
	})
}
