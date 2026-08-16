package handler

import (
	"strconv"

	"hotel-backend/internal/models"
	"hotel-backend/internal/service"
	"hotel-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type BookingHandler struct {
	bookingService service.BookingService
}

func NewBookingHandler(bookingService service.BookingService) *BookingHandler {
	return &BookingHandler{bookingService: bookingService}
}

func (h *BookingHandler) CreateBooking(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var req models.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	if req.GuestID == 0 || req.RoomID == 0 || req.CheckInDate == "" || req.CheckOutDate == "" {
		return response.Error(c, fiber.StatusBadRequest, "Guest ID, Room ID, Check-in date, and Check-out date are required", nil)
	}

	booking, err := h.bookingService.CreateBooking(userID, &req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusCreated, "Booking created successfully", booking)
}

func (h *BookingHandler) GetAllBookings(c *fiber.Ctx) error {
	status := models.BookingStatus(c.Query("status"))
	guestID, _ := strconv.Atoi(c.Query("guest_id"))
	from := c.Query("from")
	to := c.Query("to")

	bookings, err := h.bookingService.GetAllBookings(status, uint(guestID), from, to)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to retrieve bookings", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Bookings retrieved", bookings)
}

func (h *BookingHandler) GetBookingByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid booking ID", nil)
	}

	booking, err := h.bookingService.GetBookingByID(uint(id))
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Booking retrieved", booking)
}

func (h *BookingHandler) GetBookingByReference(c *fiber.Ctx) error {
	ref := c.Params("ref")
	if ref == "" {
		return response.Error(c, fiber.StatusBadRequest, "Booking reference is required", nil)
	}

	booking, err := h.bookingService.GetBookingByReference(ref)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Booking retrieved", booking)
}

func (h *BookingHandler) UpdateBooking(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid booking ID", nil)
	}

	var req models.UpdateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	booking, err := h.bookingService.UpdateBooking(uint(id), &req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Booking updated successfully", booking)
}

func (h *BookingHandler) CheckIn(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid booking ID", nil)
	}

	booking, err := h.bookingService.CheckIn(uint(id))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Guest checked in successfully. Room status set to 'occupied'.", booking)
}

func (h *BookingHandler) CheckOut(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid booking ID", nil)
	}

	booking, err := h.bookingService.CheckOut(uint(id))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Guest checked out successfully. Room status set to 'cleaning'.", booking)
}

func (h *BookingHandler) CancelBooking(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid booking ID", nil)
	}

	booking, err := h.bookingService.CancelBooking(uint(id))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Booking cancelled successfully", booking)
}

func (h *BookingHandler) AddPayment(c *fiber.Ctx) error {
	var req models.CreatePaymentRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	if req.BookingID == 0 || req.Amount <= 0 || req.PaymentMethod == "" {
		return response.Error(c, fiber.StatusBadRequest, "Booking ID, positive amount, and payment method are required", nil)
	}

	payment, err := h.bookingService.AddPayment(&req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusCreated, "Payment recorded successfully", payment)
}
