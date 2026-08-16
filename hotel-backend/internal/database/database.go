package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"hotel-backend/config"
	"hotel-backend/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) (*gorm.DB, error) {
	var dialector gorm.Dialector

	logLevel := logger.Info
	if cfg.Env == "production" {
		logLevel = logger.Error
	}

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logLevel,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	if cfg.DBDriver == "sqlite" {
		dialector = sqlite.Open(cfg.DBName + ".db")
	} else {
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
			cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort, cfg.DBSSLMode,
		)
		dialector = postgres.Open(dsn)
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		// Fallback to SQLite if local Postgres is not running during local dev/test
		log.Printf("Warning: Failed to connect to %s (%v). Falling back to SQLite local database 'hotel_dev.db'...", cfg.DBDriver, err)
		db, err = gorm.Open(sqlite.Open("hotel_dev.db"), &gorm.Config{Logger: newLogger})
		if err != nil {
			return nil, fmt.Errorf("failed to open database fallback: %w", err)
		}
	}

	// Run Auto-Migrations for all schema entities
	err = db.AutoMigrate(
		&models.User{},
		&models.RoomType{},
		&models.Room{},
		&models.Guest{},
		&models.Booking{},
		&models.Payment{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to auto-migrate database schema: %w", err)
	}

	DB = db
	log.Println("Database connection & schema migrations initialized successfully")
	return db, nil
}
