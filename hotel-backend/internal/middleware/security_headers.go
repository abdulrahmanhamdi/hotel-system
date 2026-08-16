package middleware

import (
	"os"

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

		// Environment-based Content Security Policy (CSP)
		env := os.Getenv("ENV")
		var csp string

		if env == "development" {
			// Permissive CSP for development (Swagger UI, hot-reload, debugging)
			csp = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
		} else {
			// Strict CSP with Swagger UI & CDN assets compatibility
			csp = "default-src 'self'; " +
				"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
				"font-src 'self' https://fonts.gstatic.com; " +
				"img-src 'self' data:; " +
				"connect-src 'self';"
		}
		c.Set("Content-Security-Policy", csp)

		// Referrer Policy
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Disable browser caching for API JSON responses
		c.Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		c.Set("Pragma", "no-cache")
		c.Set("Expires", "0")

		return c.Next()
	}
}
