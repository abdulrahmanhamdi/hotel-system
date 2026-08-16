package handler

import (
	"strconv"

	"hotel-backend/internal/models"
	"hotel-backend/internal/service"
	"hotel-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var req models.UserRegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	if req.Email == "" || req.Password == "" || req.Name == "" || req.Role == "" {
		return response.Error(c, fiber.StatusBadRequest, "Name, email, password, and role are required", nil)
	}

	user, err := h.userService.CreateUser(&req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusCreated, "Staff member created successfully", user)
}

func (h *UserHandler) GetAllUsers(c *fiber.Ctx) error {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to retrieve staff users", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Staff users retrieved", users)
}

func (h *UserHandler) GetUserByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid user ID", nil)
	}

	user, err := h.userService.GetUserByID(uint(id))
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Staff user retrieved", user)
}

func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid user ID", nil)
	}

	var req models.UserUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	user, err := h.userService.UpdateUser(uint(id), &req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Staff user updated successfully", user)
}

func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid user ID", nil)
	}

	if err := h.userService.DeleteUser(uint(id)); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to delete staff user", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Staff user deleted successfully", nil)
}
