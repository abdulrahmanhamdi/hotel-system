package router

import (
	"hotel-backend/config"
	"hotel-backend/internal/handler"
	"hotel-backend/internal/middleware"
	"hotel-backend/internal/models"
	"hotel-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type RouterDependencies struct {
	Config         *config.Config
	AuthHandler    *handler.AuthHandler
	UserHandler    *handler.UserHandler
	RoomHandler    *handler.RoomHandler
	GuestHandler   *handler.GuestHandler
	BookingHandler *handler.BookingHandler
	ReportHandler  *handler.ReportHandler
}

func SetupRouter(app *fiber.App, deps *RouterDependencies) {
	// 1. Panic Recovery Middleware
	app.Use(recover.New())

	// 2. Security Headers Middleware (OWASP HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
	app.Use(middleware.SecurityHeaders())

	// 3. Audit & Security Event Logger
	app.Use(middleware.AuditLogger())

	// 4. CORS Whitelisting
	allowedOrigins := "http://localhost:3000, http://localhost:8080, http://127.0.0.1:3000"
	if deps.Config.Env == "production" {
		allowedOrigins = "https://hotel.example.com, https://admin.hotel.example.com"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// Root Health Check
	app.Get("/", func(c *fiber.Ctx) error {
		return response.Success(c, fiber.StatusOK, "Hotel Management API is active and secure", fiber.Map{
			"version": "1.0.0",
			"status":  "operational",
		})
	})

	api := app.Group("/api/v1")

	// ==========================================
	// 1. Authentication (Public + Rate-limited)
	// ==========================================
	auth := api.Group("/auth")
	auth.Post("/login", middleware.AuthRateLimiter(), deps.AuthHandler.Login)
	auth.Get("/me", middleware.AuthProtected(deps.Config), deps.AuthHandler.GetProfile)

	// ==========================================
	// Protected Endpoints Group (100 req/min limit)
	// ==========================================
	protected := api.Group("", middleware.GeneralRateLimiter(), middleware.AuthProtected(deps.Config))

	// Staff / Users (Admin Only)
	staff := protected.Group("/staff", middleware.RoleRequired(models.RoleAdmin))
	staff.Post("", deps.UserHandler.CreateUser)
	staff.Get("", deps.UserHandler.GetAllUsers)
	staff.Get("/:id", deps.UserHandler.GetUserByID)
	staff.Put("/:id", deps.UserHandler.UpdateUser)
	staff.Delete("/:id", deps.UserHandler.DeleteUser)

	// Room Types
	roomTypes := protected.Group("/room-types")
	roomTypes.Get("", deps.RoomHandler.GetAllRoomTypes)
	roomTypes.Get("/:id", deps.RoomHandler.GetRoomTypeByID)
	roomTypes.Post("", middleware.RoleRequired(models.RoleAdmin), deps.RoomHandler.CreateRoomType)
	roomTypes.Put("/:id", middleware.RoleRequired(models.RoleAdmin), deps.RoomHandler.UpdateRoomType)
	roomTypes.Delete("/:id", middleware.RoleRequired(models.RoleAdmin), deps.RoomHandler.DeleteRoomType)

	// Rooms & Inventory
	rooms := protected.Group("/rooms")
	rooms.Get("", deps.RoomHandler.GetAllRooms)
	rooms.Get("/available", deps.RoomHandler.CheckAvailability)
	rooms.Get("/:id", deps.RoomHandler.GetRoomByID)
	rooms.Post("", middleware.RoleRequired(models.RoleAdmin), deps.RoomHandler.CreateRoom)
	rooms.Put("/:id", middleware.RoleRequired(models.RoleAdmin), deps.RoomHandler.UpdateRoom)
	rooms.Patch("/:id/status", middleware.RoleRequired(models.RoleAdmin, models.RoleReceptionist, models.RoleHousekeeping), deps.RoomHandler.UpdateRoomStatus)
	rooms.Delete("/:id", middleware.RoleRequired(models.RoleAdmin), deps.RoomHandler.DeleteRoom)

	// Guests (Admin & Receptionist)
	guests := protected.Group("/guests", middleware.RoleRequired(models.RoleAdmin, models.RoleReceptionist))
	guests.Post("", deps.GuestHandler.CreateGuest)
	guests.Get("", deps.GuestHandler.GetAllGuests)
	guests.Get("/:id", deps.GuestHandler.GetGuestByID)
	guests.Put("/:id", deps.GuestHandler.UpdateGuest)
	guests.Delete("/:id", middleware.RoleRequired(models.RoleAdmin), deps.GuestHandler.DeleteGuest)

	// Bookings & Operations (Admin & Receptionist)
	bookings := protected.Group("/bookings", middleware.RoleRequired(models.RoleAdmin, models.RoleReceptionist))
	bookings.Post("", deps.BookingHandler.CreateBooking)
	bookings.Get("", deps.BookingHandler.GetAllBookings)
	bookings.Get("/reference/:ref", deps.BookingHandler.GetBookingByReference)
	bookings.Get("/:id", deps.BookingHandler.GetBookingByID)
	bookings.Put("/:id", deps.BookingHandler.UpdateBooking)
	bookings.Post("/:id/check-in", deps.BookingHandler.CheckIn)
	bookings.Post("/:id/check-out", deps.BookingHandler.CheckOut)
	bookings.Post("/:id/cancel", deps.BookingHandler.CancelBooking)
	bookings.Post("/payments", deps.BookingHandler.AddPayment)

	// Reports
	reports := protected.Group("/reports")
	reports.Get("/revenue", middleware.RoleRequired(models.RoleAdmin), deps.ReportHandler.GetRevenueReport)
	reports.Get("/occupancy", middleware.RoleRequired(models.RoleAdmin, models.RoleReceptionist), deps.ReportHandler.GetOccupancyReport)
}
