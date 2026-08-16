package handler

import (
	"hotel-backend/internal/service"
	"hotel-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type ReportHandler struct {
	reportService service.ReportService
}

func NewReportHandler(reportService service.ReportService) *ReportHandler {
	return &ReportHandler{reportService: reportService}
}

func (h *ReportHandler) GetRevenueReport(c *fiber.Ctx) error {
	from := c.Query("from")
	to := c.Query("to")

	report, err := h.reportService.GetRevenueReport(from, to)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to calculate revenue report", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Revenue report retrieved", report)
}

func (h *ReportHandler) GetOccupancyReport(c *fiber.Ctx) error {
	report, err := h.reportService.GetOccupancyReport()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to calculate occupancy report", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Occupancy report retrieved", report)
}
