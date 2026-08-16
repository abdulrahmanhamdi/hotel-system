package repository

import (
	"time"

	"hotel-backend/internal/models"

	"gorm.io/gorm"
)

type BookingRepository interface {
	Create(booking *models.Booking) error
	FindByID(id uint) (*models.Booking, error)
	FindByReference(ref string) (*models.Booking, error)
	FindAll(status models.BookingStatus, guestID uint, fromDate, toDate *time.Time) ([]models.Booking, error)
	Update(booking *models.Booking) error
	UpdateStatus(id uint, status models.BookingStatus) error
	CheckRoomConflict(roomID uint, checkIn, checkOut time.Time, excludeBookingID uint) (bool, error)
	
	// Payments
	CreatePayment(payment *models.Payment) error
	FindPaymentsByBooking(bookingID uint) ([]models.Payment, error)
	GetDB() *gorm.DB
}

type bookingRepository struct {
	db *gorm.DB
}

func NewBookingRepository(db *gorm.DB) BookingRepository {
	return &bookingRepository{db: db}
}

func (r *bookingRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *bookingRepository) Create(booking *models.Booking) error {
	return r.db.Create(booking).Error
}

func (r *bookingRepository) FindByID(id uint) (*models.Booking, error) {
	var booking models.Booking
	err := r.db.Preload("Guest").
		Preload("Room.RoomType").
		Preload("CreatedBy").
		Preload("Payments").
		First(&booking, id).Error
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) FindByReference(ref string) (*models.Booking, error) {
	var booking models.Booking
	err := r.db.Preload("Guest").
		Preload("Room.RoomType").
		Preload("CreatedBy").
		Preload("Payments").
		Where("booking_reference = ?", ref).First(&booking).Error
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) FindAll(status models.BookingStatus, guestID uint, fromDate, toDate *time.Time) ([]models.Booking, error) {
	var bookings []models.Booking
	query := r.db.Preload("Guest").Preload("Room.RoomType").Preload("Payments").Order("check_in_date desc")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if guestID > 0 {
		query = query.Where("guest_id = ?", guestID)
	}
	if fromDate != nil {
		query = query.Where("check_in_date >= ?", *fromDate)
	}
	if toDate != nil {
		query = query.Where("check_out_date <= ?", *toDate)
	}

	err := query.Find(&bookings).Error
	return bookings, err
}

func (r *bookingRepository) Update(booking *models.Booking) error {
	return r.db.Save(booking).Error
}

func (r *bookingRepository) UpdateStatus(id uint, status models.BookingStatus) error {
	return r.db.Model(&models.Booking{}).Where("id = ?", id).Update("status", status).Error
}

func (r *bookingRepository) CheckRoomConflict(roomID uint, checkIn, checkOut time.Time, excludeBookingID uint) (bool, error) {
	var count int64
	query := r.db.Model(&models.Booking{}).
		Where("room_id = ?", roomID).
		Where("status IN ('confirmed', 'checked_in', 'pending')").
		Where("check_in_date < ? AND check_out_date > ?", checkOut, checkIn)

	if excludeBookingID > 0 {
		query = query.Where("id != ?", excludeBookingID)
	}

	err := query.Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *bookingRepository) CreatePayment(payment *models.Payment) error {
	return r.db.Create(payment).Error
}

func (r *bookingRepository) FindPaymentsByBooking(bookingID uint) ([]models.Payment, error) {
	var payments []models.Payment
	err := r.db.Where("booking_id = ?", bookingID).Order("id asc").Find(&payments).Error
	return payments, err
}
