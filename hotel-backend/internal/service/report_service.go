package service

import (
	"time"

	"hotel-backend/internal/repository"
)

type ReportService interface {
	GetRevenueReport(fromStr, toStr string) (*repository.RevenueReport, error)
	GetOccupancyReport() (*repository.OccupancyReport, error)
}

type reportService struct {
	reportRepo repository.ReportRepository
}

func NewReportService(reportRepo repository.ReportRepository) ReportService {
	return &reportService{reportRepo: reportRepo}
}

func (s *reportService) GetRevenueReport(fromStr, toStr string) (*repository.RevenueReport, error) {
	// Default to last 30 days if not provided
	now := time.Now()
	from := now.AddDate(0, -1, 0)
	to := now

	if fromStr != "" {
		if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			from = t
		}
	}
	if toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			to = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		}
	}

	return s.reportRepo.GetRevenueReport(from, to)
}

func (s *reportService) GetOccupancyReport() (*repository.OccupancyReport, error) {
	return s.reportRepo.GetOccupancyReport()
}
