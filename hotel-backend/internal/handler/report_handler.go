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

// GetRevenueReport godoc
// @Summary Get revenue report
// @Description Calculate revenue metrics by room type, payment method, and summary within an optional date range (Admin only)
// @Tags Reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param from query string false "From date (YYYY-MM-DD)"
// @Param to query string false "To date (YYYY-MM-DD)"
// @Success 200 {object} map[string]interface{} "Revenue report retrieved"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden - Admin only"
// @Failure 500 {object} map[string]interface{} "Failed to calculate revenue report"
// @Router /reports/revenue [get]
func (h *ReportHandler) GetRevenueReport(c *fiber.Ctx) error {
	from := c.Query("from")
	to := c.Query("to")

	report, err := h.reportService.GetRevenueReport(from, to)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to calculate revenue report", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Revenue report retrieved", report)
}

// GetOccupancyReport godoc
// @Summary Get occupancy report
// @Description Calculate current hotel occupancy rate and room status distribution (Admin and Receptionist)
// @Tags Reports
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "Occupancy report retrieved"
// @Failure 401 {object} map[string]interface{} "Unauthorized"
// @Failure 403 {object} map[string]interface{} "Forbidden"
// @Failure 500 {object} map[string]interface{} "Failed to calculate occupancy report"
// @Router /reports/occupancy [get]
func (h *ReportHandler) GetOccupancyReport(c *fiber.Ctx) error {
	report, err := h.reportService.GetOccupancyReport()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to calculate occupancy report", err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Occupancy report retrieved", report)
}
