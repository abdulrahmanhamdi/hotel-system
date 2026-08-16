package models

import (
	"time"

	"gorm.io/gorm"
)

type RoomType struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	Name              string         `gorm:"size:100;uniqueIndex;not null" json:"name"`
	BasePricePerNight float64        `gorm:"type:decimal(10,2);not null" json:"base_price_per_night"`
	Capacity          int            `gorm:"not null" json:"capacity"`
	Description       string         `gorm:"type:text" json:"description"`
	Amenities         string         `gorm:"type:text" json:"amenities"` // comma separated or JSON string
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

type CreateRoomTypeRequest struct {
	Name              string  `json:"name" binding:"required"`
	BasePricePerNight float64 `json:"base_price_per_night" binding:"required,gt=0"`
	Capacity          int     `json:"capacity" binding:"required,gt=0"`
	Description       string  `json:"description"`
	Amenities         string  `json:"amenities"`
}

type UpdateRoomTypeRequest struct {
	Name              *string  `json:"name,omitempty"`
	BasePricePerNight *float64 `json:"base_price_per_night,omitempty"`
	Capacity          *int     `json:"capacity,omitempty"`
	Description       *string  `json:"description,omitempty"`
	Amenities         *string  `json:"amenities,omitempty"`
}
