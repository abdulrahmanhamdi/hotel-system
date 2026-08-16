package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// SecurityHeaders applies OWASP recommended security headers to all responses
func SecurityHeaders() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Prevent MIME-sniffing
		c.Set("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking by forbidding embedding in frames
		c.Set("X-Frame-Options", "DENY")

		// Cross-Site Scripting (XSS) protection
		c.Set("X-XSS-Protection", "1; mode=block")

		// HTTP Strict Transport Security (HSTS)
		c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		// Content Security Policy
		c.Set("Content-Security-Policy", "default-src 'self'")

		// Referrer Policy
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Disable browser caching for API JSON responses
		c.Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		c.Set("Pragma", "no-cache")
		c.Set("Expires", "0")

		return c.Next()
	}
}
