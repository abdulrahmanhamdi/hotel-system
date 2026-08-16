package handler

import (
	"strconv"

	"hotel-backend/internal/models"
	"hotel-backend/internal/service"
	"hotel-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type GuestHandler struct {
	guestService service.GuestService
}

func NewGuestHandler(guestService service.GuestService) *GuestHandler {
	return &GuestHandler{guestService: guestService}
}

// CreateGuest godoc
// @Summary Register a new guest
// @Description Add a new guest profile to the system (Admin and Receptionist)
// @Tags Guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param guest body models.CreateGuestRequest true "Guest data"
// @Success 201 {object} map[string]interface{} "Guest registered successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /guests [post]
func (h *GuestHandler) CreateGuest(c *fiber.Ctx) error {
	var req models.CreateGuestRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	if req.FirstName == "" || req.LastName == "" || req.Email == "" || req.Phone == "" || req.IDCardOrPassport == "" {
		return response.Error(c, fiber.StatusBadRequest, "First name, last name, email, phone, and ID/passport are required", nil)
	}

	guest, err := h.guestService.CreateGuest(&req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusCreated, "Guest registered successfully", guest)
}

// GetAllGuests godoc
// @Summary Get all guests
// @Description Retrieve a list of all registered guests with optional search by name, email, or phone
// @Tags Guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search query (name, email, phone)"
// @Success 200 {object} map[string]interface{} "Guests retrieved"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /guests [get]
func (h *GuestHandler) GetAllGuests(c *fiber.Ctx) error {
	search := c.Query("search")
	guests, err := h.guestService.GetAllGuests(search)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to retrieve guests", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Guests retrieved", guests)
}

// GetGuestByID godoc
// @Summary Get guest by ID
// @Description Retrieve details of a specific guest by ID
// @Tags Guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Guest ID"
// @Success 200 {object} map[string]interface{} "Guest retrieved"
// @Failure 400 {object} map[string]interface{} "Invalid guest ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Guest not found"
// @Router /guests/{id} [get]
func (h *GuestHandler) GetGuestByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid guest ID", nil)
	}

	guest, err := h.guestService.GetGuestByID(uint(id))
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Guest retrieved", guest)
}

// UpdateGuest godoc
// @Summary Update guest
// @Description Modify an existing guest's contact or identification details
// @Tags Guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Guest ID"
// @Param guest body models.UpdateGuestRequest true "Guest update data"
// @Success 200 {object} map[string]interface{} "Guest updated successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Guest not found"
// @Router /guests/{id} [put]
func (h *GuestHandler) UpdateGuest(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid guest ID", nil)
	}

	var req models.UpdateGuestRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	guest, err := h.guestService.UpdateGuest(uint(id), &req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Guest updated successfully", guest)
}

// DeleteGuest godoc
// @Summary Delete guest
// @Description Remove a guest record from the system (Admin only)
// @Tags Guests
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Guest ID"
// @Success 200 {object} map[string]interface{} "Guest deleted successfully"
// @Failure 400 {object} map[string]interface{} "Invalid guest ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 500 {object} map[string]interface{} "Failed to delete guest"
// @Router /guests/{id} [delete]
func (h *GuestHandler) DeleteGuest(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid guest ID", nil)
	}

	if err := h.guestService.DeleteGuest(uint(id)); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to delete guest", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Guest deleted successfully", nil)
}
