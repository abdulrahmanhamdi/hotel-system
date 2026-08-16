package middleware

import (
	"hotel-backend/internal/models"
	"hotel-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

func RoleRequired(allowedRoles ...models.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roleVal := c.Locals("role")
		if roleVal == nil {
			return response.Error(c, fiber.StatusUnauthorized, "Unauthorized: Role not found in context", nil)
		}

		userRole := models.Role(roleVal.(string))
		for _, allowed := range allowedRoles {
			if userRole == allowed {
				return c.Next()
			}
		}

		return response.Error(c, fiber.StatusForbidden, "Forbidden: You do not have sufficient permissions to perform this action", nil)
	}
}
