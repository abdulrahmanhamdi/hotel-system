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

// CreateBooking godoc
// @Summary Create a new booking
// @Description Reserve a room for a guest with automatic stay calculation and pricing (Admin and Receptionist)
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param booking body models.CreateBookingRequest true "Booking request payload"
// @Success 201 {object} map[string]interface{} "Booking created successfully"
// @Failure 400 {object} map[string]interface{} "Validation error or date conflict"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /bookings [post]
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

// GetAllBookings godoc
// @Summary Get all bookings
// @Description Retrieve a list of bookings with optional filters for status, guest_id, and date range
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "Booking Status (pending, confirmed, checked_in, checked_out, cancelled)"
// @Param guest_id query int false "Guest ID"
// @Param from query string false "From date (YYYY-MM-DD)"
// @Param to query string false "To date (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{} "Bookings retrieved"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /bookings [get]
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

// GetBookingByID godoc
// @Summary Get booking by ID
// @Description Retrieve details of a booking including guest, room, payments, and staff info
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Booking ID"
// @Success 200 {object} map[string]interface{} "Booking retrieved"
// @Failure 400 {object} map[string]interface{} "Invalid booking ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Booking not found"
// @Router /bookings/{id} [get]
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

// GetBookingByReference godoc
// @Summary Get booking by reference code
// @Description Find a booking by its unique reference number (e.g. BK-20260216-ABCD)
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param ref path string true "Booking Reference Code"
// @Success 200 {object} map[string]interface{} "Booking retrieved"
// @Failure 400 {object} map[string]interface{} "Booking reference is required"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Booking not found"
// @Router /bookings/reference/{ref} [get]
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

// UpdateBooking godoc
// @Summary Update booking
// @Description Update booking details, status, or special requests
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Booking ID"
// @Param booking body models.UpdateBookingRequest true "Booking update payload"
// @Success 200 {object} map[string]interface{} "Booking updated successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 404 {object} map[string]interface{} "Booking not found"
// @Router /bookings/{id} [put]
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

// CheckIn godoc
// @Summary Check-in guest
// @Description Process check-in for a booking and set room status to occupied
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Booking ID"
// @Success 200 {object} map[string]interface{} "Guest checked in successfully"
// @Failure 400 {object} map[string]interface{} "Invalid state for check-in"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /bookings/{id}/check-in [post]
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

// CheckOut godoc
// @Summary Check-out guest
// @Description Process check-out for a booking and set room status to cleaning
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Booking ID"
// @Success 200 {object} map[string]interface{} "Guest checked out successfully"
// @Failure 400 {object} map[string]interface{} "Invalid state for check-out"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /bookings/{id}/check-out [post]
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

// CancelBooking godoc
// @Summary Cancel booking
// @Description Cancel a booking and release the reserved room
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Booking ID"
// @Success 200 {object} map[string]interface{} "Booking cancelled successfully"
// @Failure 400 {object} map[string]interface{} "Invalid state for cancellation"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /bookings/{id}/cancel [post]
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

// AddPayment godoc
// @Summary Add payment to booking
// @Description Record a new payment (cash, credit_card, debit_card, bank_transfer) for a booking
// @Tags Bookings
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payment body models.CreatePaymentRequest true "Payment details"
// @Success 201 {object} map[string]interface{} "Payment recorded successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /bookings/payments [post]
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
