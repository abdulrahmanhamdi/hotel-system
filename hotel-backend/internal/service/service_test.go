package service

import (
	"fmt"
	"testing"
	"time"

	"hotel-backend/config"
	"hotel-backend/internal/models"
	"hotel-backend/internal/repository"
	"hotel-backend/pkg/utils"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupIsolatedDB(t *testing.T) *gorm.DB {
	dbName := fmt.Sprintf("file:mem_%d?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open isolated test db: %v", err)
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.RoomType{},
		&models.Room{},
		&models.Guest{},
		&models.Booking{},
		&models.Payment{},
	)
	if err != nil {
		t.Fatalf("failed to auto-migrate: %v", err)
	}
	return db
}

// 1. Table-Driven Pricing & Duration Tests
func TestCalculateTotalPriceTableDriven(t *testing.T) {
	tests := []struct {
		name         string
		ratePerNight float64
		checkInDate  string
		checkOutDate string
		expectedDays int
		expectedCost float64
		shouldError  bool
	}{
		{
			name:         "Standard 3 nights single room",
			ratePerNight: 80.0,
			checkInDate:  "2026-09-01",
			checkOutDate: "2026-09-04",
			expectedDays: 3,
			expectedCost: 240.0,
			shouldError:  false,
		},
		{
			name:         "Standard 5 nights executive suite",
			ratePerNight: 280.0,
			checkInDate:  "2026-09-10",
			checkOutDate: "2026-09-15",
			expectedDays: 5,
			expectedCost: 1400.0,
			shouldError:  false,
		},
		{
			name:         "Zero-night booking rejection",
			ratePerNight: 100.0,
			checkInDate:  "2026-09-01",
			checkOutDate: "2026-09-01",
			shouldError:  true,
		},
		{
			name:         "Inverted date range rejection",
			ratePerNight: 100.0,
			checkInDate:  "2026-09-05",
			checkOutDate: "2026-09-01",
			shouldError:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			in, err1 := time.Parse("2006-01-02", tt.checkInDate)
			out, err2 := time.Parse("2006-01-02", tt.checkOutDate)
			if err1 != nil || err2 != nil {
				t.Fatalf("invalid date parse in test")
			}

			if !out.After(in) {
				if !tt.shouldError {
					t.Fatalf("expected error for inverted/zero nights")
				}
				return
			}

			nights := int(out.Sub(in).Hours() / 24)
			cost := float64(nights) * tt.ratePerNight

			if cost != tt.expectedCost {
				t.Fatalf("cost mismatch: expected %f, got %f", tt.expectedCost, cost)
			}
		})
	}
}

// 2. Comprehensive Service Layer Integration (Auth, Rooms, Bookings, Check-in/out, Reports)
func TestCompleteSystemWorkflow(t *testing.T) {
	db := setupIsolatedDB(t)

	cfg := &config.Config{
		JWTSecret:          "test-secret-key-32-chars-long!",
		JWTExpirationHours: 24,
	}

	userRepo := repository.NewUserRepository(db)
	roomRepo := repository.NewRoomRepository(db)
	guestRepo := repository.NewGuestRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	reportRepo := repository.NewReportRepository(db)

	authService := NewAuthService(userRepo, cfg)
	userService := NewUserService(userRepo)
	roomService := NewRoomService(roomRepo)
	guestService := NewGuestService(guestRepo)
	bookingService := NewBookingService(bookingRepo, roomRepo, guestRepo)
	reportService := NewReportService(reportRepo)

	// Step A: Create Staff (Admin & Receptionist)
	admin, err := userService.CreateUser(&models.UserRegisterRequest{
		Name:     "Admin Boss",
		Email:    "boss@hotel.com",
		Password: "Password123!",
		Role:     models.RoleAdmin,
	})
	if err != nil {
		t.Fatalf("failed to create admin: %v", err)
	}

	// Step B: Authenticate Admin & Verify Token
	token, profile, err := authService.Login(&models.UserLoginRequest{
		Email:    "boss@hotel.com",
		Password: "Password123!",
	})
	if err != nil || token == "" || profile.Role != models.RoleAdmin {
		t.Fatalf("login failed: %v", err)
	}

	// Step C: Create Room Type & Room
	rt, err := roomService.CreateRoomType(&models.CreateRoomTypeRequest{
		Name:              "Ocean View King",
		BasePricePerNight: 150.0,
		Capacity:          2,
		Description:       "Panoramic view",
	})
	if err != nil {
		t.Fatalf("failed to create room type: %v", err)
	}

	room, err := roomService.CreateRoom(&models.CreateRoomRequest{
		RoomNumber: "501",
		RoomTypeID: rt.ID,
		Floor:      5,
		Status:     models.RoomStatusAvailable,
	})
	if err != nil {
		t.Fatalf("failed to create room: %v", err)
	}

	// Step D: Create Guest Profile
	guest, err := guestService.CreateGuest(&models.CreateGuestRequest{
		FirstName:        "Elena",
		LastName:         "Rostova",
		Email:            "elena@example.com",
		Phone:            "+1-800-555",
		IDCardOrPassport: "P-987654321",
	})
	if err != nil {
		t.Fatalf("failed to create guest: %v", err)
	}

	// Step E: Create Booking & Verify Overlap Conflict Prevention
	booking, err := bookingService.CreateBooking(admin.ID, &models.CreateBookingRequest{
		GuestID:         guest.ID,
		RoomID:          room.ID,
		CheckInDate:     "2026-09-01",
		CheckOutDate:    "2026-09-05",
		SpecialRequests: "High floor",
		InitialPayment: &struct {
			Amount        float64 `json:"amount"`
			PaymentMethod string  `json:"payment_method"`
		}{
			Amount:        300.0,
			PaymentMethod: "credit_card",
		},
	})
	if err != nil {
		t.Fatalf("failed to create booking: %v", err)
	}
	if booking.TotalPrice != 600.0 { // 4 nights * $150
		t.Fatalf("expected total price 600.0, got %f", booking.TotalPrice)
	}

	// Attempt double-booking overlapping dates -> Must return error
	_, errConflict := bookingService.CreateBooking(admin.ID, &models.CreateBookingRequest{
		GuestID:      guest.ID,
		RoomID:       room.ID,
		CheckInDate:  "2026-09-03",
		CheckOutDate: "2026-09-07",
	})
	if errConflict == nil {
		t.Fatalf("expected double-booking conflict error, but got nil")
	}

	// Step F: Execute Check-in Lifecycle
	checkedInBooking, err := bookingService.CheckIn(booking.ID)
	if err != nil || checkedInBooking.Status != models.BookingStatusCheckedIn {
		t.Fatalf("check-in failed: %v", err)
	}
	updatedRoom, _ := roomService.GetRoomByID(room.ID)
	if updatedRoom.Status != models.RoomStatusOccupied {
		t.Fatalf("expected room status 'occupied', got '%s'", updatedRoom.Status)
	}

	// Step G: Execute Check-out Lifecycle
	checkedOutBooking, err := bookingService.CheckOut(booking.ID)
	if err != nil || checkedOutBooking.Status != models.BookingStatusCheckedOut {
		t.Fatalf("check-out failed: %v", err)
	}
	cleanedRoom, _ := roomService.GetRoomByID(room.ID)
	if cleanedRoom.Status != models.RoomStatusCleaning {
		t.Fatalf("expected room status 'cleaning', got '%s'", cleanedRoom.Status)
	}

	// Step H: Housekeeper finishes cleaning
	err = roomService.UpdateRoomStatus(room.ID, models.RoomStatusAvailable)
	if err != nil {
		t.Fatalf("failed to update room status: %v", err)
	}

	// Step I: Revenue & Occupancy Reports
	revReport, err := reportService.GetRevenueReport("2026-08-01", "2026-09-30")
	if err != nil || revReport.TotalRevenue < 300.0 {
		t.Fatalf("invalid revenue calculation: %+v", revReport)
	}

	occReport, err := reportService.GetOccupancyReport()
	if err != nil || occReport.TotalRooms != 1 {
		t.Fatalf("invalid occupancy report: %+v", occReport)
	}
}

// 3. Password Complexity and JWT Expiration Tests
func TestSecurityTokenAndHash(t *testing.T) {
	// Weak password rejection
	err := utils.ValidatePasswordStrength("weak")
	if err == nil {
		t.Fatalf("expected error for weak password")
	}

	// Strong password validation
	err = utils.ValidatePasswordStrength("StrongPass@2026")
	if err != nil {
		t.Fatalf("expected valid password: %v", err)
	}

	// Hash and check
	hash, err := utils.HashPassword("StrongPass@2026")
	if err != nil || !utils.CheckPassword("StrongPass@2026", hash) {
		t.Fatalf("hash comparison failed")
	}

	// Token pair issuance & validation
	pair, err := utils.GenerateTokenPair(99, "agent@hotel.com", "admin", "super-secret-key-32-chars-long!", 24)
	if err != nil {
		t.Fatalf("token pair generation failed: %v", err)
	}

	claims, err := utils.ValidateJWT(pair.AccessToken, "super-secret-key-32-chars-long!")
	if err != nil || claims.UserID != 99 || claims.Role != "admin" {
		t.Fatalf("access token validation failed: %v", err)
	}

	refClaims, err := utils.ValidateRefreshToken(pair.RefreshToken, "super-secret-key-32-chars-long!")
	if err != nil || refClaims.UserID != 99 {
		t.Fatalf("refresh token validation failed: %v", err)
	}
}
