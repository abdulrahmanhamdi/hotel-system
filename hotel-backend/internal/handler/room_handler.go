package handler

import (
	"strconv"

	"hotel-backend/internal/models"
	"hotel-backend/internal/service"
	"hotel-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type RoomHandler struct {
	roomService service.RoomService
}

func NewRoomHandler(roomService service.RoomService) *RoomHandler {
	return &RoomHandler{roomService: roomService}
}

// Room Types

// CreateRoomType godoc
// @Summary Create room type
// @Description Add a new room category (Admin only)
// @Tags Room Types
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param room_type body models.CreateRoomTypeRequest true "Room type details"
// @Success 201 {object} map[string]interface{} "Room type created successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Router /room-types [post]
func (h *RoomHandler) CreateRoomType(c *fiber.Ctx) error {
	var req models.CreateRoomTypeRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	if req.Name == "" || req.BasePricePerNight <= 0 || req.Capacity <= 0 {
		return response.Error(c, fiber.StatusBadRequest, "Name, valid base price, and capacity are required", nil)
	}

	rt, err := h.roomService.CreateRoomType(&req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusCreated, "Room type created successfully", rt)
}

// GetAllRoomTypes godoc
// @Summary Get all room types
// @Description Retrieve a list of all room categories
// @Tags Room Types
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "Room types retrieved"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Router /room-types [get]
func (h *RoomHandler) GetAllRoomTypes(c *fiber.Ctx) error {
	types, err := h.roomService.GetAllRoomTypes()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to retrieve room types", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Room types retrieved", types)
}

// GetRoomTypeByID godoc
// @Summary Get room type by ID
// @Description Retrieve details of a specific room type
// @Tags Room Types
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Room Type ID"
// @Success 200 {object} map[string]interface{} "Room type retrieved"
// @Failure 400 {object} map[string]interface{} "Invalid room type ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Room type not found"
// @Router /room-types/{id} [get]
func (h *RoomHandler) GetRoomTypeByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid room type ID", nil)
	}

	rt, err := h.roomService.GetRoomTypeByID(uint(id))
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Room type retrieved", rt)
}

// UpdateRoomType godoc
// @Summary Update room type
// @Description Modify an existing room type's details (Admin only)
// @Tags Room Types
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Room Type ID"
// @Param room_type body models.UpdateRoomTypeRequest true "Room type update data"
// @Success 200 {object} map[string]interface{} "Room type updated successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 404 {object} map[string]interface{} "Room type not found"
// @Router /room-types/{id} [put]
func (h *RoomHandler) UpdateRoomType(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid room type ID", nil)
	}

	var req models.UpdateRoomTypeRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	rt, err := h.roomService.UpdateRoomType(uint(id), &req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Room type updated successfully", rt)
}

// DeleteRoomType godoc
// @Summary Delete room type
// @Description Delete a room type by ID (Admin only)
// @Tags Room Types
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Room Type ID"
// @Success 200 {object} map[string]interface{} "Room type deleted successfully"
// @Failure 400 {object} map[string]interface{} "Invalid room type ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 500 {object} map[string]interface{} "Failed to delete room type"
// @Router /room-types/{id} [delete]
func (h *RoomHandler) DeleteRoomType(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid room type ID", nil)
	}

	if err := h.roomService.DeleteRoomType(uint(id)); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to delete room type", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Room type deleted successfully", nil)
}

// Rooms

// CreateRoom godoc
// @Summary Create a new room
// @Description Add a new room to the hotel inventory (Admin only)
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param room body models.CreateRoomRequest true "Room data"
// @Success 201 {object} map[string]interface{} "Room created successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Router /rooms [post]
func (h *RoomHandler) CreateRoom(c *fiber.Ctx) error {
	var req models.CreateRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	if req.RoomNumber == "" || req.RoomTypeID == 0 || req.Floor == 0 {
		return response.Error(c, fiber.StatusBadRequest, "Room number, room_type_id, and floor are required", nil)
	}

	room, err := h.roomService.CreateRoom(&req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusCreated, "Room created successfully", room)
}

// GetAllRooms godoc
// @Summary Get all rooms
// @Description Retrieve a list of all rooms with optional filters for status, floor, and room_type_id
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "Room Status (available, occupied, cleaning, maintenance)"
// @Param floor query int false "Floor Number"
// @Param room_type_id query int false "Room Type ID"
// @Success 200 {object} map[string]interface{} "Rooms retrieved"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Router /rooms [get]
func (h *RoomHandler) GetAllRooms(c *fiber.Ctx) error {
	status := models.RoomStatus(c.Query("status"))
	floor, _ := strconv.Atoi(c.Query("floor"))
	roomTypeID, _ := strconv.Atoi(c.Query("room_type_id"))

	rooms, err := h.roomService.GetAllRooms(status, floor, uint(roomTypeID))
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to retrieve rooms", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Rooms retrieved", rooms)
}

// GetRoomByID godoc
// @Summary Get room by ID
// @Description Retrieve details of a specific room by its ID
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Room ID"
// @Success 200 {object} map[string]interface{} "Room retrieved"
// @Failure 400 {object} map[string]interface{} "Invalid room ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 404 {object} map[string]interface{} "Room not found"
// @Router /rooms/{id} [get]
func (h *RoomHandler) GetRoomByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid room ID", nil)
	}

	room, err := h.roomService.GetRoomByID(uint(id))
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Room retrieved", room)
}

// UpdateRoom godoc
// @Summary Update room
// @Description Modify room details such as floor, type, status, or keycard (Admin only)
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Room ID"
// @Param room body models.UpdateRoomRequest true "Room update data"
// @Success 200 {object} map[string]interface{} "Room updated successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 404 {object} map[string]interface{} "Room not found"
// @Router /rooms/{id} [put]
func (h *RoomHandler) UpdateRoom(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid room ID", nil)
	}

	var req models.UpdateRoomRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	room, err := h.roomService.UpdateRoom(uint(id), &req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Room updated successfully", room)
}

// UpdateRoomStatus godoc
// @Summary Update room status
// @Description Change operational status of a room (available, occupied, cleaning, maintenance)
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Room ID"
// @Param status body models.UpdateRoomStatusRequest true "Status update payload"
// @Success 200 {object} map[string]interface{} "Room status updated successfully"
// @Failure 400 {object} map[string]interface{} "Validation error"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Router /rooms/{id}/status [patch]
func (h *RoomHandler) UpdateRoomStatus(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid room ID", nil)
	}

	var req models.UpdateRoomStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body", err.Error())
	}

	if req.Status == "" {
		return response.Error(c, fiber.StatusBadRequest, "Status is required (available, occupied, cleaning, maintenance)", nil)
	}

	if err := h.roomService.UpdateRoomStatus(uint(id), req.Status); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Room status updated successfully", fiber.Map{
		"room_id": id,
		"status":  req.Status,
	})
}

// DeleteRoom godoc
// @Summary Delete room
// @Description Remove a room from hotel inventory (Admin only)
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Room ID"
// @Success 200 {object} map[string]interface{} "Room deleted successfully"
// @Failure 400 {object} map[string]interface{} "Invalid room ID"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 500 {object} map[string]interface{} "Failed to delete room"
// @Router /rooms/{id} [delete]
func (h *RoomHandler) DeleteRoom(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid room ID", nil)
	}

	if err := h.roomService.DeleteRoom(uint(id)); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to delete room", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Room deleted successfully", nil)
}

// CheckAvailability godoc
// @Summary Check room availability
// @Description Search for available rooms matching given date range, optional room type, and guest capacity
// @Tags Rooms
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param check_in query string true "Check-in Date (YYYY-MM-DD)"
// @Param check_out query string true "Check-out Date (YYYY-MM-DD)"
// @Param room_type_id query int false "Room Type ID"
// @Param capacity query int false "Minimum capacity"
// @Success 200 {object} map[string]interface{} "Available rooms retrieved"
// @Failure 400 {object} map[string]interface{} "Invalid dates or query parameters"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Router /rooms/available [get]
func (h *RoomHandler) CheckAvailability(c *fiber.Ctx) error {
	checkIn := c.Query("check_in")
	checkOut := c.Query("check_out")

	if checkIn == "" || checkOut == "" {
		return response.Error(c, fiber.StatusBadRequest, "Both 'check_in' and 'check_out' query parameters (YYYY-MM-DD) are required", nil)
	}

	var roomTypeIDPtr *uint
	if rtIDStr := c.Query("room_type_id"); rtIDStr != "" {
		if id, err := strconv.Atoi(rtIDStr); err == nil && id > 0 {
			uID := uint(id)
			roomTypeIDPtr = &uID
		}
	}

	var capacityPtr *int
	if capStr := c.Query("capacity"); capStr != "" {
		if capVal, err := strconv.Atoi(capStr); err == nil && capVal > 0 {
			capacityPtr = &capVal
		}
	}

	rooms, err := h.roomService.GetAvailableRooms(checkIn, checkOut, roomTypeIDPtr, capacityPtr)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error(), nil)
	}

	return response.Success(c, fiber.StatusOK, "Available rooms retrieved", rooms)
}
