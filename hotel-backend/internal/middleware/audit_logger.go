package middleware

import (
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// MaskEmail masks sensitive email addresses (e.g. j***e@hotel.com)
func MaskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 || len(parts[0]) <= 2 {
		return "***"
	}
	name := parts[0]
	masked := string(name[0]) + strings.Repeat("*", len(name)-2) + string(name[len(name)-1])
	return masked + "@" + parts[1]
}

// AuditLogger logs security events, user operations, and endpoint access
func AuditLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		method := c.Method()
		path := c.Path()
		ip := c.IP()
		userAgent := c.Get("User-Agent")

		// Process Request
		err := c.Next()

		latency := time.Since(start)
		status := c.Response().StatusCode()

		userIDVal := c.Locals("user_id")
		roleVal := c.Locals("role")
		userIDStr := "anonymous"
		roleStr := "guest"

		if userIDVal != nil {
			userIDStr = fmtSprintf("%v", userIDVal)
		}
		if roleVal != nil {
			roleStr = fmtSprintf("%v", roleVal)
		}

		// Security event log
		if status == 401 || status == 403 {
			log.Printf("[SECURITY WARNING] Status: %d | Method: %s | Path: %s | IP: %s | UserID: %s | Role: %s | Latency: %v | Agent: %s",
				status, method, path, ip, userIDStr, roleStr, latency, userAgent,
			)
		} else if method == "POST" || method == "PUT" || method == "DELETE" || method == "PATCH" {
			log.Printf("[AUDIT TRAIL] Action: %s | Path: %s | Status: %d | UserID: %s | Role: %s | IP: %s | Latency: %v",
				method, path, status, userIDStr, roleStr, ip, latency,
			)
		}

		return err
	}
}

func fmtSprintf(format string, a ...interface{}) string {
	if len(a) > 0 && a[0] != nil {
		return strings.TrimSpace(strings.ReplaceAll(string(format), "%v", strings.Trim(strings.Trim(string(format), " "), " ")))
	}
	return ""
}
