package main

import (
	"log"

	"hotel-backend/config"
	"hotel-backend/internal/database"
	"hotel-backend/internal/handler"
	"hotel-backend/internal/repository"
	"hotel-backend/internal/router"
	"hotel-backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

// @title Hotel Management System API
// @version 1.0
// @description This is the API documentation for the Hotel Management System.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.email support@hotel-system.com

// @license.name MIT
// @license.url https://opensource.org/licenses/MIT

// @host localhost:8080
// @BasePath /api/v1
// @schemes http

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter your JWT token as: "Bearer <token>"
func main() {
	// 1. Load Configuration
	cfg := config.LoadConfig()

	// 2. Initialize Database & Migrations
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}

	// 3. Seed Initial Data
	database.SeedDatabase(db)

	// 4. Initialize Repositories
	userRepo := repository.NewUserRepository(db)
	roomRepo := repository.NewRoomRepository(db)
	guestRepo := repository.NewGuestRepository(db)
	bookingRepo := repository.NewBookingRepository(db)
	reportRepo := repository.NewReportRepository(db)

	// 5. Initialize Services
	authService := service.NewAuthService(userRepo, cfg)
	userService := service.NewUserService(userRepo)
	roomService := service.NewRoomService(roomRepo)
	guestService := service.NewGuestService(guestRepo)
	bookingService := service.NewBookingService(bookingRepo, roomRepo, guestRepo)
	reportService := service.NewReportService(reportRepo)

	// 6. Initialize Handlers
	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(userService)
	roomHandler := handler.NewRoomHandler(roomService)
	guestHandler := handler.NewGuestHandler(guestService)
	bookingHandler := handler.NewBookingHandler(bookingService)
	reportHandler := handler.NewReportHandler(reportService)

	// 7. Setup Fiber App & Router
	app := fiber.New(fiber.Config{
		AppName:      "Hotel Management System API v1.0",
		ServerHeader: "Fiber",
	})

	router.SetupRouter(app, &router.RouterDependencies{
		Config:         cfg,
		AuthHandler:    authHandler,
		UserHandler:    userHandler,
		RoomHandler:    roomHandler,
		GuestHandler:   guestHandler,
		BookingHandler: bookingHandler,
		ReportHandler:  reportHandler,
	})

	// 8. Start Server
	log.Printf("Starting Hotel Backend Server on port :%s ...", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Server terminated with error: %v", err)
	}
}
