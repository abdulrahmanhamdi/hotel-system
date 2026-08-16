package models

import (
	"time"

	"gorm.io/gorm"
)

type Guest struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	FirstName        string         `gorm:"size:100;not null" json:"first_name"`
	LastName         string         `gorm:"size:100;not null" json:"last_name"`
	Email            string         `gorm:"size:150;index;not null" json:"email"`
	Phone            string         `gorm:"size:50;not null" json:"phone"`
	IDCardOrPassport string         `gorm:"size:100;index;not null" json:"id_card_or_passport"`
	Address          string         `gorm:"type:text" json:"address"`
	Bookings         []Booking      `gorm:"foreignKey:GuestID" json:"bookings,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type CreateGuestRequest struct {
	FirstName        string `json:"first_name" binding:"required"`
	LastName         string `json:"last_name" binding:"required"`
	Email            string `json:"email" binding:"required,email"`
	Phone            string `json:"phone" binding:"required"`
	IDCardOrPassport string `json:"id_card_or_passport" binding:"required"`
	Address          string `json:"address"`
}

type UpdateGuestRequest struct {
	FirstName        *string `json:"first_name,omitempty"`
	LastName         *string `json:"last_name,omitempty"`
	Email            *string `json:"email,omitempty"`
	Phone            *string `json:"phone,omitempty"`
	IDCardOrPassport *string `json:"id_card_or_passport,omitempty"`
	Address          *string `json:"address,omitempty"`
}
