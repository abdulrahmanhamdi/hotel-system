package service

import (
	"errors"
	"fmt"
	"math"
	"time"

	"hotel-backend/internal/models"
	"hotel-backend/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookingService interface {
	CreateBooking(userID uint, req *models.CreateBookingRequest) (*models.Booking, error)
	GetBookingByID(id uint) (*models.Booking, error)
	GetBookingByReference(ref string) (*models.Booking, error)
	GetAllBookings(status models.BookingStatus, guestID uint, fromStr, toStr string) ([]models.Booking, error)
	UpdateBooking(id uint, req *models.UpdateBookingRequest) (*models.Booking, error)
	CheckIn(bookingID uint) (*models.Booking, error)
	CheckOut(bookingID uint) (*models.Booking, error)
	CancelBooking(bookingID uint) (*models.Booking, error)
	AddPayment(req *models.CreatePaymentRequest) (*models.Payment, error)
}

type bookingService struct {
	bookingRepo repository.BookingRepository
	roomRepo    repository.RoomRepository
	guestRepo   repository.GuestRepository
}

func NewBookingService(
	bookingRepo repository.BookingRepository,
	roomRepo repository.RoomRepository,
	guestRepo repository.GuestRepository,
) BookingService {
	return &bookingService{
		bookingRepo: bookingRepo,
		roomRepo:    roomRepo,
		guestRepo:   guestRepo,
	}
}

func (s *bookingService) CreateBooking(userID uint, req *models.CreateBookingRequest) (*models.Booking, error) {
	// Parse Dates
	checkIn, err := time.Parse("2006-01-02", req.CheckInDate)
	if err != nil {
		return nil, errors.New("invalid check_in_date format. Use YYYY-MM-DD")
	}
	checkOut, err := time.Parse("2006-01-02", req.CheckOutDate)
	if err != nil {
		return nil, errors.New("invalid check_out_date format. Use YYYY-MM-DD")
	}

	if !checkOut.After(checkIn) {
		return nil, errors.New("check_out_date must be after check_in_date")
	}

	// Validate Guest
	_, err = s.guestRepo.FindByID(req.GuestID)
	if err != nil {
		return nil, errors.New("guest not found")
	}

	// Validate Room
	room, err := s.roomRepo.FindRoomByID(req.RoomID)
	if err != nil {
		return nil, errors.New("room not found")
	}
	if !room.IsActive || room.Status == models.RoomStatusMaintenance {
		return nil, errors.New("selected room is currently not available for booking")
	}

	// Check Date Overlap Conflict
	hasConflict, err := s.bookingRepo.CheckRoomConflict(req.RoomID, checkIn, checkOut, 0)
	if err != nil {
		return nil, fmt.Errorf("failed to check room availability: %w", err)
	}
	if hasConflict {
		return nil, errors.New("selected room is already booked for these dates")
	}

	// Calculate Pricing (Nights * RoomType Base Price)
	nights := int(math.Ceil(checkOut.Sub(checkIn).Hours() / 24))
	if nights <= 0 {
		nights = 1
	}
	totalPrice := float64(nights) * room.RoomType.BasePricePerNight

	// Generate Unique Booking Reference: BK-YEAR-RANDOM
	ref := fmt.Sprintf("BK-%d-%s", time.Now().Year(), uuid.New().String()[:8])

	booking := &models.Booking{
		BookingReference: ref,
		GuestID:          req.GuestID,
		RoomID:           req.RoomID,
		CheckInDate:      checkIn,
		CheckOutDate:     checkOut,
		TotalPrice:       totalPrice,
		Status:           models.BookingStatusConfirmed,
		SpecialRequests:  req.SpecialRequests,
		CreatedByID:      userID,
	}

	// Transactional creation
	db := s.bookingRepo.GetDB()
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(booking).Error; err != nil {
			return err
		}

		// If initial payment provided
		if req.InitialPayment != nil && req.InitialPayment.Amount > 0 {
			payment := &models.Payment{
				BookingID:       booking.ID,
				Amount:          req.InitialPayment.Amount,
				PaymentMethod:   models.PaymentMethod(req.InitialPayment.PaymentMethod),
				PaymentStatus:   models.PaymentStatusCompleted,
				TransactionCode: fmt.Sprintf("TXN-%d-%s", time.Now().Unix(), uuid.New().String()[:6]),
				Notes:           "Initial deposit/payment upon booking",
			}
			if err := tx.Create(payment).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return s.bookingRepo.FindByID(booking.ID)
}

func (s *bookingService) GetBookingByID(id uint) (*models.Booking, error) {
	booking, err := s.bookingRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("booking not found")
	}
	return booking, nil
}

func (s *bookingService) GetBookingByReference(ref string) (*models.Booking, error) {
	booking, err := s.bookingRepo.FindByReference(ref)
	if err != nil {
		return nil, errors.New("booking not found")
	}
	return booking, nil
}

func (s *bookingService) GetAllBookings(status models.BookingStatus, guestID uint, fromStr, toStr string) ([]models.Booking, error) {
	var fromDate, toDate *time.Time
	if fromStr != "" {
		t, err := time.Parse("2006-01-02", fromStr)
		if err == nil {
			fromDate = &t
		}
	}
	if toStr != "" {
		t, err := time.Parse("2006-01-02", toStr)
		if err == nil {
			toDate = &t
		}
	}

	return s.bookingRepo.FindAll(status, guestID, fromDate, toDate)
}

func (s *bookingService) UpdateBooking(id uint, req *models.UpdateBookingRequest) (*models.Booking, error) {
	booking, err := s.bookingRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("booking not found")
	}

	if booking.Status == models.BookingStatusCheckedOut || booking.Status == models.BookingStatusCancelled {
		return nil, errors.New("cannot modify completed or cancelled bookings")
	}

	roomID := booking.RoomID
	if req.RoomID != nil {
		roomID = *req.RoomID
	}

	checkIn := booking.CheckInDate
	if req.CheckInDate != nil {
		t, err := time.Parse("2006-01-02", *req.CheckInDate)
		if err != nil {
			return nil, errors.New("invalid check_in_date format")
		}
		checkIn = t
	}

	checkOut := booking.CheckOutDate
	if req.CheckOutDate != nil {
		t, err := time.Parse("2006-01-02", *req.CheckOutDate)
		if err != nil {
			return nil, errors.New("invalid check_out_date format")
		}
		checkOut = t
	}

	if !checkOut.After(checkIn) {
		return nil, errors.New("check_out_date must be after check_in_date")
	}

	// Check conflict excluding current booking
	hasConflict, err := s.bookingRepo.CheckRoomConflict(roomID, checkIn, checkOut, booking.ID)
	if err != nil {
		return nil, err
	}
	if hasConflict {
		return nil, errors.New("selected room or date range conflicts with an existing reservation")
	}

	// Recalculate price if room or dates changed
	room, err := s.roomRepo.FindRoomByID(roomID)
	if err != nil {
		return nil, errors.New("room not found")
	}
	nights := int(math.Ceil(checkOut.Sub(checkIn).Hours() / 24))
	if nights <= 0 {
		nights = 1
	}

	booking.RoomID = roomID
	booking.CheckInDate = checkIn
	booking.CheckOutDate = checkOut
	booking.TotalPrice = float64(nights) * room.RoomType.BasePricePerNight

	if req.SpecialRequests != nil {
		booking.SpecialRequests = *req.SpecialRequests
	}

	if err := s.bookingRepo.Update(booking); err != nil {
		return nil, err
	}

	return s.bookingRepo.FindByID(booking.ID)
}

func (s *bookingService) CheckIn(bookingID uint) (*models.Booking, error) {
	booking, err := s.bookingRepo.FindByID(bookingID)
	if err != nil {
		return nil, errors.New("booking not found")
	}

	if booking.Status != models.BookingStatusConfirmed && booking.Status != models.BookingStatusPending {
		return nil, fmt.Errorf("cannot check in: booking is currently '%s'", booking.Status)
	}

	now := time.Now()
	booking.Status = models.BookingStatusCheckedIn
	booking.ActualCheckIn = &now

	db := s.bookingRepo.GetDB()
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(booking).Error; err != nil {
			return err
		}
		// Mark room as occupied
		if err := tx.Model(&models.Room{}).Where("id = ?", booking.RoomID).Update("status", models.RoomStatusOccupied).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	return s.bookingRepo.FindByID(booking.ID)
}

func (s *bookingService) CheckOut(bookingID uint) (*models.Booking, error) {
	booking, err := s.bookingRepo.FindByID(bookingID)
	if err != nil {
		return nil, errors.New("booking not found")
	}

	if booking.Status != models.BookingStatusCheckedIn {
		return nil, fmt.Errorf("cannot check out: booking is not checked in (status is '%s')", booking.Status)
	}

	now := time.Now()
	booking.Status = models.BookingStatusCheckedOut
	booking.ActualCheckOut = &now

	db := s.bookingRepo.GetDB()
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(booking).Error; err != nil {
			return err
		}
		// Move room to cleaning status for housekeeping turnaround
		if err := tx.Model(&models.Room{}).Where("id = ?", booking.RoomID).Update("status", models.RoomStatusCleaning).Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	return s.bookingRepo.FindByID(booking.ID)
}

func (s *bookingService) CancelBooking(bookingID uint) (*models.Booking, error) {
	booking, err := s.bookingRepo.FindByID(bookingID)
	if err != nil {
		return nil, errors.New("booking not found")
	}

	if booking.Status == models.BookingStatusCheckedOut || booking.Status == models.BookingStatusCancelled {
		return nil, fmt.Errorf("cannot cancel booking with status '%s'", booking.Status)
	}

	booking.Status = models.BookingStatusCancelled

	db := s.bookingRepo.GetDB()
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(booking).Error; err != nil {
			return err
		}
		// If room was marked occupied, release it back to available
		if booking.Room.Status == models.RoomStatusOccupied {
			if err := tx.Model(&models.Room{}).Where("id = ?", booking.RoomID).Update("status", models.RoomStatusAvailable).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		return nil, err
	}
	return s.bookingRepo.FindByID(booking.ID)
}

func (s *bookingService) AddPayment(req *models.CreatePaymentRequest) (*models.Payment, error) {
	_, err := s.bookingRepo.FindByID(req.BookingID)
	if err != nil {
		return nil, errors.New("booking not found")
	}

	payment := &models.Payment{
		BookingID:       req.BookingID,
		Amount:          req.Amount,
		PaymentMethod:   req.PaymentMethod,
		PaymentStatus:   models.PaymentStatusCompleted,
		TransactionCode: fmt.Sprintf("TXN-%d-%s", time.Now().Unix(), uuid.New().String()[:6]),
		Notes:           req.Notes,
	}

	if err := s.bookingRepo.CreatePayment(payment); err != nil {
		return nil, err
	}

	return payment, nil
}
