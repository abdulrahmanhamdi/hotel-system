package middleware

import (
	"time"

	"hotel-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// AuthRateLimiter limits login/refresh endpoints to prevent brute-force attacks (20 req/min, 5 failed attempts lockout)
func AuthRateLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        20,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return response.Error(c, fiber.StatusTooManyRequests, "Too many login attempts. Please try again in 1 minute.", nil)
		},
	})
}

// GeneralRateLimiter protects authenticated and general endpoints (100 req/min)
func GeneralRateLimiter() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			authHeader := c.Get("Authorization")
			if authHeader != "" {
				return authHeader // Per user token
			}
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return response.Error(c, fiber.StatusTooManyRequests, "Rate limit exceeded (100 req/min). Please slow down.", nil)
		},
	})
}
