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

func (h *RoomHandler) GetAllRoomTypes(c *fiber.Ctx) error {
	types, err := h.roomService.GetAllRoomTypes()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to retrieve room types", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Room types retrieved", types)
}

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
