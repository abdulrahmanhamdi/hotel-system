package models

import (
	"time"

	"gorm.io/gorm"
)

type BookingStatus string

const (
	BookingStatusPending    BookingStatus = "pending"
	BookingStatusConfirmed  BookingStatus = "confirmed"
	BookingStatusCheckedIn  BookingStatus = "checked_in"
	BookingStatusCheckedOut BookingStatus = "checked_out"
	BookingStatusCancelled  BookingStatus = "cancelled"
)

type Booking struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	BookingReference string         `gorm:"size:50;uniqueIndex;not null" json:"booking_reference"`
	GuestID          uint           `gorm:"not null;index" json:"guest_id"`
	Guest            *Guest         `gorm:"foreignKey:GuestID" json:"guest,omitempty"`
	RoomID           uint           `gorm:"not null;index" json:"room_id"`
	Room             *Room          `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	CheckInDate      time.Time      `gorm:"not null;index" json:"check_in_date"`
	CheckOutDate     time.Time      `gorm:"not null;index" json:"check_out_date"`
	ActualCheckIn    *time.Time     `json:"actual_check_in,omitempty"`
	ActualCheckOut   *time.Time     `json:"actual_check_out,omitempty"`
	TotalPrice       float64        `gorm:"type:decimal(10,2);not null" json:"total_price"`
	Status           BookingStatus  `gorm:"type:varchar(30);default:'confirmed';not null;index" json:"status"`
	SpecialRequests  string         `gorm:"type:text" json:"special_requests,omitempty"`
	CreatedByID      uint           `gorm:"not null" json:"created_by_id"`
	CreatedBy        *User          `gorm:"foreignKey:CreatedByID" json:"created_by,omitempty"`
	Payments         []Payment      `gorm:"foreignKey:BookingID" json:"payments,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type CreateBookingRequest struct {
	GuestID         uint    `json:"guest_id" binding:"required"`
	RoomID          uint    `json:"room_id" binding:"required"`
	CheckInDate     string  `json:"check_in_date" binding:"required"`  // YYYY-MM-DD
	CheckOutDate    string  `json:"check_out_date" binding:"required"` // YYYY-MM-DD
	SpecialRequests string  `json:"special_requests"`
	InitialPayment  *struct {
		Amount        float64 `json:"amount"`
		PaymentMethod string  `json:"payment_method"`
	} `json:"initial_payment,omitempty"`
}

type UpdateBookingRequest struct {
	RoomID          *uint   `json:"room_id,omitempty"`
	CheckInDate     *string `json:"check_in_date,omitempty"`
	CheckOutDate    *string `json:"check_out_date,omitempty"`
	SpecialRequests *string `json:"special_requests,omitempty"`
}

type CheckAvailabilityRequest struct {
	CheckInDate  string `query:"check_in" binding:"required"`  // YYYY-MM-DD
	CheckOutDate string `query:"check_out" binding:"required"` // YYYY-MM-DD
	RoomTypeID   *uint  `query:"room_type_id"`
	Capacity     *int   `query:"capacity"`
}
