package models

import (
	"time"

	"gorm.io/gorm"
)

type RoomStatus string

const (
	RoomStatusAvailable   RoomStatus = "available"
	RoomStatusOccupied    RoomStatus = "occupied"
	RoomStatusCleaning    RoomStatus = "cleaning"
	RoomStatusMaintenance RoomStatus = "maintenance"
)

type Room struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	RoomNumber string         `gorm:"size:20;uniqueIndex;not null" json:"room_number"`
	RoomTypeID uint           `gorm:"not null;index" json:"room_type_id"`
	RoomType   *RoomType      `gorm:"foreignKey:RoomTypeID" json:"room_type,omitempty"`
	Floor      int            `gorm:"not null" json:"floor"`
	Status     RoomStatus     `gorm:"type:varchar(30);default:'available';not null" json:"status"`
	IsActive   bool           `gorm:"default:true" json:"is_active"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

type CreateRoomRequest struct {
	RoomNumber string     `json:"room_number" binding:"required"`
	RoomTypeID uint       `json:"room_type_id" binding:"required"`
	Floor      int        `json:"floor" binding:"required"`
	Status     RoomStatus `json:"status"`
}

type UpdateRoomRequest struct {
	RoomNumber *string     `json:"room_number,omitempty"`
	RoomTypeID *uint       `json:"room_type_id,omitempty"`
	Floor      *int        `json:"floor,omitempty"`
	Status     *RoomStatus `json:"status,omitempty"`
	IsActive   *bool       `json:"is_active,omitempty"`
}

type UpdateRoomStatusRequest struct {
	Status RoomStatus `json:"status" binding:"required"`
}
