package database

import (
	"log"

	"hotel-backend/internal/models"
	"hotel-backend/pkg/utils"

	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB) {
	// 1. Seed Admin User
	var adminCount int64
	db.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&adminCount)
	if adminCount == 0 {
		hash, _ := utils.HashPassword("Admin@123456")
		admin := models.User{
			Name:         "System Administrator",
			Email:        "admin@hotel.com",
			PasswordHash: hash,
			Role:         models.RoleAdmin,
			IsActive:     true,
		}
		db.Create(&admin)

		// Seed Receptionist
		recHash, _ := utils.HashPassword("Reception@123456")
		receptionist := models.User{
			Name:         "Jane Receptionist",
			Email:        "reception@hotel.com",
			PasswordHash: recHash,
			Role:         models.RoleReceptionist,
			IsActive:     true,
		}
		db.Create(&receptionist)

		// Seed Housekeeping
		hkHash, _ := utils.HashPassword("Housekeeper@123456")
		housekeeper := models.User{
			Name:         "Bob Housekeeper",
			Email:        "housekeeping@hotel.com",
			PasswordHash: hkHash,
			Role:         models.RoleHousekeeping,
			IsActive:     true,
		}
		db.Create(&housekeeper)

		log.Println("Seeded default users (Admin, Receptionist, Housekeeper)")
	}

	// 2. Seed Room Types
	var roomTypeCount int64
	db.Model(&models.RoomType{}).Count(&roomTypeCount)
	if roomTypeCount == 0 {
		types := []models.RoomType{
			{
				Name:              "Single Standard",
				BasePricePerNight: 75.00,
				Capacity:          1,
				Description:       "Cozy single room with high-speed Wi-Fi, work desk, and ensuite bathroom.",
				Amenities:         "Wi-Fi, Air Conditioning, TV, Desk, Shower",
			},
			{
				Name:              "Double Deluxe",
				BasePricePerNight: 120.00,
				Capacity:          2,
				Description:       "Spacious double bed room with balcony, minibar, and premium bedding.",
				Amenities:         "Wi-Fi, King Bed, Balcony, Mini Bar, TV, Room Service",
			},
			{
				Name:              "Executive Suite",
				BasePricePerNight: 250.00,
				Capacity:          4,
				Description:       "Luxury 2-bedroom suite with private lounge, jacuzzi, and panoramic city views.",
				Amenities:         "Wi-Fi, Jacuzzi, Living Room, Kitchenette, 2 Smart TVs, Butler Service",
			},
		}

		for _, t := range types {
			db.Create(&t)
		}
		log.Println("Seeded default room types")
	}

	// 3. Seed Rooms
	var roomCount int64
	db.Model(&models.Room{}).Count(&roomCount)
	if roomCount == 0 {
		var singleType, doubleType, suiteType models.RoomType
		db.Where("name = ?", "Single Standard").First(&singleType)
		db.Where("name = ?", "Double Deluxe").First(&doubleType)
		db.Where("name = ?", "Executive Suite").First(&suiteType)

		sampleRooms := []models.Room{
			{RoomNumber: "101", RoomTypeID: singleType.ID, Floor: 1, Status: models.RoomStatusAvailable, IsActive: true},
			{RoomNumber: "102", RoomTypeID: singleType.ID, Floor: 1, Status: models.RoomStatusAvailable, IsActive: true},
			{RoomNumber: "201", RoomTypeID: doubleType.ID, Floor: 2, Status: models.RoomStatusAvailable, IsActive: true},
			{RoomNumber: "202", RoomTypeID: doubleType.ID, Floor: 2, Status: models.RoomStatusAvailable, IsActive: true},
			{RoomNumber: "301", RoomTypeID: suiteType.ID, Floor: 3, Status: models.RoomStatusAvailable, IsActive: true},
		}

		for _, r := range sampleRooms {
			db.Create(&r)
		}
		log.Println("Seeded sample rooms")
	}
}
