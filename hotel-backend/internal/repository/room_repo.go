package repository

import (
	"time"

	"hotel-backend/internal/models"

	"gorm.io/gorm"
)

type RoomRepository interface {
	// Room Types
	CreateRoomType(roomType *models.RoomType) error
	FindAllRoomTypes() ([]models.RoomType, error)
	FindRoomTypeByID(id uint) (*models.RoomType, error)
	UpdateRoomType(roomType *models.RoomType) error
	DeleteRoomType(id uint) error

	// Rooms
	CreateRoom(room *models.Room) error
	FindAllRooms(status models.RoomStatus, floor int, roomTypeID uint) ([]models.Room, error)
	FindRoomByID(id uint) (*models.Room, error)
	FindRoomByNumber(roomNumber string) (*models.Room, error)
	UpdateRoom(room *models.Room) error
	UpdateRoomStatus(id uint, status models.RoomStatus) error
	DeleteRoom(id uint) error
	FindAvailableRooms(checkIn, checkOut time.Time, roomTypeID *uint, minCapacity *int) ([]models.Room, error)
}

type roomRepository struct {
	db *gorm.DB
}

func NewRoomRepository(db *gorm.DB) RoomRepository {
	return &roomRepository{db: db}
}

func (r *roomRepository) CreateRoomType(roomType *models.RoomType) error {
	return r.db.Create(roomType).Error
}

func (r *roomRepository) FindAllRoomTypes() ([]models.RoomType, error) {
	var types []models.RoomType
	err := r.db.Order("base_price_per_night asc").Find(&types).Error
	return types, err
}

func (r *roomRepository) FindRoomTypeByID(id uint) (*models.RoomType, error) {
	var rt models.RoomType
	err := r.db.First(&rt, id).Error
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *roomRepository) UpdateRoomType(roomType *models.RoomType) error {
	return r.db.Save(roomType).Error
}

func (r *roomRepository) DeleteRoomType(id uint) error {
	return r.db.Delete(&models.RoomType{}, id).Error
}

func (r *roomRepository) CreateRoom(room *models.Room) error {
	return r.db.Create(room).Error
}

func (r *roomRepository) FindAllRooms(status models.RoomStatus, floor int, roomTypeID uint) ([]models.Room, error) {
	var rooms []models.Room
	query := r.db.Preload("RoomType").Order("room_number asc")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if floor > 0 {
		query = query.Where("floor = ?", floor)
	}
	if roomTypeID > 0 {
		query = query.Where("room_type_id = ?", roomTypeID)
	}

	err := query.Find(&rooms).Error
	return rooms, err
}

func (r *roomRepository) FindRoomByID(id uint) (*models.Room, error) {
	var room models.Room
	err := r.db.Preload("RoomType").First(&room, id).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *roomRepository) FindRoomByNumber(roomNumber string) (*models.Room, error) {
	var room models.Room
	err := r.db.Preload("RoomType").Where("room_number = ?", roomNumber).First(&room).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *roomRepository) UpdateRoom(room *models.Room) error {
	return r.db.Save(room).Error
}

func (r *roomRepository) UpdateRoomStatus(id uint, status models.RoomStatus) error {
	return r.db.Model(&models.Room{}).Where("id = ?", id).Update("status", status).Error
}

func (r *roomRepository) DeleteRoom(id uint) error {
	return r.db.Delete(&models.Room{}, id).Error
}

// FindAvailableRooms checks rooms that are active, not in maintenance, and have NO active bookings overlapping the given dates
func (r *roomRepository) FindAvailableRooms(checkIn, checkOut time.Time, roomTypeID *uint, minCapacity *int) ([]models.Room, error) {
	var rooms []models.Room

	// Subquery for booked rooms in date range
	// Overlap condition: (booking.check_in_date < checkOut) AND (booking.check_out_date > checkIn)
	subQuery := r.db.Table("bookings").
		Select("room_id").
		Where("status IN ('confirmed', 'checked_in', 'pending')").
		Where("check_in_date < ? AND check_out_date > ?", checkOut, checkIn)

	query := r.db.Preload("RoomType").
		Where("is_active = ?", true).
		Where("status != ?", models.RoomStatusMaintenance).
		Where("id NOT IN (?)", subQuery)

	if roomTypeID != nil && *roomTypeID > 0 {
		query = query.Where("room_type_id = ?", *roomTypeID)
	}

	if minCapacity != nil && *minCapacity > 0 {
		query = query.Joins("JOIN room_types ON room_types.id = rooms.room_type_id").
			Where("room_types.capacity >= ?", *minCapacity)
	}

	err := query.Order("room_number asc").Find(&rooms).Error
	return rooms, err
}
