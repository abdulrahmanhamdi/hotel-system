package models

import (
	"time"

	"gorm.io/gorm"
)

type PaymentMethod string

const (
	PaymentMethodCash         PaymentMethod = "cash"
	PaymentMethodCreditCard   PaymentMethod = "credit_card"
	PaymentMethodDebitCard    PaymentMethod = "debit_card"
	PaymentMethodBankTransfer PaymentMethod = "bank_transfer"
)

type PaymentStatus string

const (
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

type Payment struct {
	ID              uint          `gorm:"primaryKey" json:"id"`
	BookingID       uint          `gorm:"not null;index" json:"booking_id"`
	Amount          float64       `gorm:"type:decimal(10,2);not null" json:"amount"`
	PaymentMethod   PaymentMethod `gorm:"type:varchar(30);not null" json:"payment_method"`
	PaymentStatus   PaymentStatus `gorm:"type:varchar(30);default:'completed';not null" json:"payment_status"`
	TransactionCode string        `gorm:"size:100;uniqueIndex;not null" json:"transaction_code"`
	Notes           string        `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

type CreatePaymentRequest struct {
	BookingID     uint          `json:"booking_id" binding:"required"`
	Amount        float64       `json:"amount" binding:"required,gt=0"`
	PaymentMethod PaymentMethod `json:"payment_method" binding:"required"`
	Notes         string        `json:"notes"`
}
