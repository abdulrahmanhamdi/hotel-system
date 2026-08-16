package repository

import (
	"time"

	"hotel-backend/internal/models"

	"gorm.io/gorm"
)

type RevenueReport struct {
	TotalRevenue    float64 `json:"total_revenue"`
	TotalBookings   int64   `json:"total_bookings"`
	CompletedStays  int64   `json:"completed_stays"`
	CancelledStays  int64   `json:"cancelled_stays"`
	CashRevenue     float64 `json:"cash_revenue"`
	CardRevenue     float64 `json:"card_revenue"`
	TransferRevenue float64 `json:"transfer_revenue"`
}

type OccupancyReport struct {
	TotalRooms        int64   `json:"total_rooms"`
	AvailableRooms    int64   `json:"available_rooms"`
	OccupiedRooms     int64   `json:"occupied_rooms"`
	CleaningRooms     int64   `json:"cleaning_rooms"`
	MaintenanceRooms  int64   `json:"maintenance_rooms"`
	OccupancyRatePerc float64 `json:"occupancy_rate_percentage"`
}

type ReportRepository interface {
	GetRevenueReport(from, to time.Time) (*RevenueReport, error)
	GetOccupancyReport() (*OccupancyReport, error)
}

type reportRepository struct {
	db *gorm.DB
}

func NewReportRepository(db *gorm.DB) ReportRepository {
	return &reportRepository{db: db}
}

func (r *reportRepository) GetRevenueReport(from, to time.Time) (*RevenueReport, error) {
	var report RevenueReport

	// Sum total completed payments in date range
	r.db.Model(&models.Payment{}).
		Where("payment_status = ?", models.PaymentStatusCompleted).
		Where("created_at >= ? AND created_at <= ?", from, to).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&report.TotalRevenue)

	// Revenue by payment method
	r.db.Model(&models.Payment{}).
		Where("payment_status = ? AND payment_method = ?", models.PaymentStatusCompleted, models.PaymentMethodCash).
		Where("created_at >= ? AND created_at <= ?", from, to).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&report.CashRevenue)

	r.db.Model(&models.Payment{}).
		Where("payment_status = ? AND payment_method IN (?, ?)", models.PaymentStatusCompleted, models.PaymentMethodCreditCard, models.PaymentMethodDebitCard).
		Where("created_at >= ? AND created_at <= ?", from, to).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&report.CardRevenue)

	r.db.Model(&models.Payment{}).
		Where("payment_status = ? AND payment_method = ?", models.PaymentStatusCompleted, models.PaymentMethodBankTransfer).
		Where("created_at >= ? AND created_at <= ?", from, to).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&report.TransferRevenue)

	// Count bookings created in date range
	r.db.Model(&models.Booking{}).
		Where("created_at >= ? AND created_at <= ?", from, to).
		Count(&report.TotalBookings)

	r.db.Model(&models.Booking{}).
		Where("status = ?", models.BookingStatusCheckedOut).
		Where("created_at >= ? AND created_at <= ?", from, to).
		Count(&report.CompletedStays)

	r.db.Model(&models.Booking{}).
		Where("status = ?", models.BookingStatusCancelled).
		Where("created_at >= ? AND created_at <= ?", from, to).
		Count(&report.CancelledStays)

	return &report, nil
}

func (r *reportRepository) GetOccupancyReport() (*OccupancyReport, error) {
	var report OccupancyReport

	r.db.Model(&models.Room{}).Where("is_active = ?", true).Count(&report.TotalRooms)
	r.db.Model(&models.Room{}).Where("is_active = ? AND status = ?", true, models.RoomStatusAvailable).Count(&report.AvailableRooms)
	r.db.Model(&models.Room{}).Where("is_active = ? AND status = ?", true, models.RoomStatusOccupied).Count(&report.OccupiedRooms)
	r.db.Model(&models.Room{}).Where("is_active = ? AND status = ?", true, models.RoomStatusCleaning).Count(&report.CleaningRooms)
	r.db.Model(&models.Room{}).Where("is_active = ? AND status = ?", true, models.RoomStatusMaintenance).Count(&report.MaintenanceRooms)

	if report.TotalRooms > 0 {
		report.OccupancyRatePerc = float64(report.OccupiedRooms) / float64(report.TotalRooms) * 100.0
	}

	return &report, nil
}
