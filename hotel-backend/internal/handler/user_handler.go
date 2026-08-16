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

// CreateUser godoc
// @Summary Create a new staff user
// @Description Register a new staff user (Admin only)
// @Tags Staff
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param user body models.UserRegisterRequest true "Staff user details"
// @Success 201 {object} map[string]interface{} "Staff member created successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Router /staff [post]
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

// GetAllUsers godoc
// @Summary Get all staff users
// @Description Retrieve a list of all staff members (Admin only)
// @Tags Staff
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "Staff users retrieved"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Router /staff [get]
func (h *UserHandler) GetAllUsers(c *fiber.Ctx) error {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to retrieve staff users", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Staff users retrieved", users)
}

// GetUserByID godoc
// @Summary Get staff user by ID
// @Description Retrieve details of a specific staff user by ID (Admin only)
// @Tags Staff
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{} "Staff user retrieved"
// @Failure 400 {object} map[string]interface{} "Invalid user ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 404 {object} map[string]interface{} "User not found"
// @Router /staff/{id} [get]
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

// UpdateUser godoc
// @Summary Update staff user
// @Description Update staff user details by ID (Admin only)
// @Tags Staff
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Param user body models.UserUpdateRequest true "User update data"
// @Success 200 {object} map[string]interface{} "Staff user updated successfully"
// @Failure 400 {object} map[string]interface{} "Invalid request or validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 404 {object} map[string]interface{} "User not found"
// @Router /staff/{id} [put]
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

// DeleteUser godoc
// @Summary Delete staff user
// @Description Remove a staff user by ID (Admin only)
// @Tags Staff
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{} "Staff user deleted successfully"
// @Failure 400 {object} map[string]interface{} "Invalid user ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 500 {object} map[string]interface{} "Failed to delete staff user"
// @Router /staff/{id} [delete]
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
