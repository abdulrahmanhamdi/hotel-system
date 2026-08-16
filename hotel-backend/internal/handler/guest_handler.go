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

func (h *GuestHandler) GetAllGuests(c *fiber.Ctx) error {
	search := c.Query("search")
	guests, err := h.guestService.GetAllGuests(search)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to retrieve guests", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Guests retrieved", guests)
}

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
