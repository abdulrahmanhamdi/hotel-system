package repository

import (
	"hotel-backend/internal/models"

	"gorm.io/gorm"
)

type GuestRepository interface {
	Create(guest *models.Guest) error
	FindByID(id uint) (*models.Guest, error)
	FindByEmail(email string) (*models.Guest, error)
	FindByIdCard(idCard string) (*models.Guest, error)
	FindAll(search string) ([]models.Guest, error)
	Update(guest *models.Guest) error
	Delete(id uint) error
}

type guestRepository struct {
	db *gorm.DB
}

func NewGuestRepository(db *gorm.DB) GuestRepository {
	return &guestRepository{db: db}
}

func (r *guestRepository) Create(guest *models.Guest) error {
	return r.db.Create(guest).Error
}

func (r *guestRepository) FindByID(id uint) (*models.Guest, error) {
	var guest models.Guest
	err := r.db.Preload("Bookings.Room.RoomType").First(&guest, id).Error
	if err != nil {
		return nil, err
	}
	return &guest, nil
}

func (r *guestRepository) FindByEmail(email string) (*models.Guest, error) {
	var guest models.Guest
	err := r.db.Where("email = ?", email).First(&guest).Error
	if err != nil {
		return nil, err
	}
	return &guest, nil
}

func (r *guestRepository) FindByIdCard(idCard string) (*models.Guest, error) {
	var guest models.Guest
	err := r.db.Where("id_card_or_passport = ?", idCard).First(&guest).Error
	if err != nil {
		return nil, err
	}
	return &guest, nil
}

func (r *guestRepository) FindAll(search string) ([]models.Guest, error) {
	var guests []models.Guest
	query := r.db.Order("id desc")

	if search != "" {
		s := "%" + search + "%"
		query = query.Where("first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR id_card_or_passport LIKE ?", s, s, s, s, s)
	}

	err := query.Find(&guests).Error
	return guests, err
}

func (r *guestRepository) Update(guest *models.Guest) error {
	return r.db.Save(guest).Error
}

func (r *guestRepository) Delete(id uint) error {
	return r.db.Delete(&models.Guest{}, id).Error
}
