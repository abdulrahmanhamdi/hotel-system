package service

import (
	"errors"
	"time"

	"hotel-backend/internal/models"
	"hotel-backend/internal/repository"
)

type RoomService interface {
	// Room Types
	CreateRoomType(req *models.CreateRoomTypeRequest) (*models.RoomType, error)
	GetAllRoomTypes() ([]models.RoomType, error)
	GetRoomTypeByID(id uint) (*models.RoomType, error)
	UpdateRoomType(id uint, req *models.UpdateRoomTypeRequest) (*models.RoomType, error)
	DeleteRoomType(id uint) error

	// Rooms
	CreateRoom(req *models.CreateRoomRequest) (*models.Room, error)
	GetAllRooms(status models.RoomStatus, floor int, roomTypeID uint) ([]models.Room, error)
	GetRoomByID(id uint) (*models.Room, error)
	UpdateRoom(id uint, req *models.UpdateRoomRequest) (*models.Room, error)
	UpdateRoomStatus(id uint, status models.RoomStatus) error
	DeleteRoom(id uint) error
	GetAvailableRooms(checkInStr, checkOutStr string, roomTypeID *uint, capacity *int) ([]models.Room, error)
}

type roomService struct {
	roomRepo repository.RoomRepository
}

func NewRoomService(roomRepo repository.RoomRepository) RoomService {
	return &roomService{roomRepo: roomRepo}
}

func (s *roomService) CreateRoomType(req *models.CreateRoomTypeRequest) (*models.RoomType, error) {
	roomType := &models.RoomType{
		Name:              req.Name,
		BasePricePerNight: req.BasePricePerNight,
		Capacity:          req.Capacity,
		Description:       req.Description,
		Amenities:         req.Amenities,
	}

	err := s.roomRepo.CreateRoomType(roomType)
	return roomType, err
}

func (s *roomService) GetAllRoomTypes() ([]models.RoomType, error) {
	return s.roomRepo.FindAllRoomTypes()
}

func (s *roomService) GetRoomTypeByID(id uint) (*models.RoomType, error) {
	return s.roomRepo.FindRoomTypeByID(id)
}

func (s *roomService) UpdateRoomType(id uint, req *models.UpdateRoomTypeRequest) (*models.RoomType, error) {
	rt, err := s.roomRepo.FindRoomTypeByID(id)
	if err != nil {
		return nil, errors.New("room type not found")
	}

	if req.Name != nil {
		rt.Name = *req.Name
	}
	if req.BasePricePerNight != nil {
		rt.BasePricePerNight = *req.BasePricePerNight
	}
	if req.Capacity != nil {
		rt.Capacity = *req.Capacity
	}
	if req.Description != nil {
		rt.Description = *req.Description
	}
	if req.Amenities != nil {
		rt.Amenities = *req.Amenities
	}

	err = s.roomRepo.UpdateRoomType(rt)
	return rt, err
}

func (s *roomService) DeleteRoomType(id uint) error {
	return s.roomRepo.DeleteRoomType(id)
}

func (s *roomService) CreateRoom(req *models.CreateRoomRequest) (*models.Room, error) {
	existing, _ := s.roomRepo.FindRoomByNumber(req.RoomNumber)
	if existing != nil {
		return nil, errors.New("room number already exists")
	}

	_, err := s.roomRepo.FindRoomTypeByID(req.RoomTypeID)
	if err != nil {
		return nil, errors.New("invalid room_type_id: room type does not exist")
	}

	status := req.Status
	if status == "" {
		status = models.RoomStatusAvailable
	}

	room := &models.Room{
		RoomNumber: req.RoomNumber,
		RoomTypeID: req.RoomTypeID,
		Floor:      req.Floor,
		Status:     status,
		IsActive:   true,
	}

	err = s.roomRepo.CreateRoom(room)
	if err != nil {
		return nil, err
	}
	return s.roomRepo.FindRoomByID(room.ID)
}

func (s *roomService) GetAllRooms(status models.RoomStatus, floor int, roomTypeID uint) ([]models.Room, error) {
	return s.roomRepo.FindAllRooms(status, floor, roomTypeID)
}

func (s *roomService) GetRoomByID(id uint) (*models.Room, error) {
	return s.roomRepo.FindRoomByID(id)
}

func (s *roomService) UpdateRoom(id uint, req *models.UpdateRoomRequest) (*models.Room, error) {
	room, err := s.roomRepo.FindRoomByID(id)
	if err != nil {
		return nil, errors.New("room not found")
	}

	if req.RoomNumber != nil {
		room.RoomNumber = *req.RoomNumber
	}
	if req.RoomTypeID != nil {
		room.RoomTypeID = *req.RoomTypeID
	}
	if req.Floor != nil {
		room.Floor = *req.Floor
	}
	if req.Status != nil {
		room.Status = *req.Status
	}
	if req.IsActive != nil {
		room.IsActive = *req.IsActive
	}

	err = s.roomRepo.UpdateRoom(room)
	if err != nil {
		return nil, err
	}
	return s.roomRepo.FindRoomByID(room.ID)
}

func (s *roomService) UpdateRoomStatus(id uint, status models.RoomStatus) error {
	_, err := s.roomRepo.FindRoomByID(id)
	if err != nil {
		return errors.New("room not found")
	}
	return s.roomRepo.UpdateRoomStatus(id, status)
}

func (s *roomService) DeleteRoom(id uint) error {
	return s.roomRepo.DeleteRoom(id)
}

func (s *roomService) GetAvailableRooms(checkInStr, checkOutStr string, roomTypeID *uint, capacity *int) ([]models.Room, error) {
	checkIn, err := time.Parse("2006-01-02", checkInStr)
	if err != nil {
		return nil, errors.New("invalid check_in date format. Use YYYY-MM-DD")
	}
	checkOut, err := time.Parse("2006-01-02", checkOutStr)
	if err != nil {
		return nil, errors.New("invalid check_out date format. Use YYYY-MM-DD")
	}

	if !checkOut.After(checkIn) {
		return nil, errors.New("check_out date must be after check_in date")
	}

	return s.roomRepo.FindAvailableRooms(checkIn, checkOut, roomTypeID, capacity)
}
