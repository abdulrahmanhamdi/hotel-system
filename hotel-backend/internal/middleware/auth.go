package middleware

import (
	"strings"

	"hotel-backend/config"
	"hotel-backend/pkg/response"
	"hotel-backend/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

func AuthProtected(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.Error(c, fiber.StatusUnauthorized, "Missing authorization header", nil)
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return response.Error(c, fiber.StatusUnauthorized, "Invalid authorization format. Use 'Bearer <token>'", nil)
		}

		tokenString := parts[1]
		claims, err := utils.ValidateJWT(tokenString, cfg.JWTSecret)
		if err != nil {
			return response.Error(c, fiber.StatusUnauthorized, err.Error(), nil)
		}

		// Store user details in fiber context
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}
