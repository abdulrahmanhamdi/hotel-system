import React, { useState, useEffect, useCallback } from "react";
import {
  FaChartLine,
  FaChartPie,
  FaBed,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaSyncAlt,
  FaCreditCard,
  FaExchangeAlt,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { reportsApi } from "../../api/reports.api";
import type { OccupancyReport, RevenueReport } from "../../types";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import "./ReportsPage.css";

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"occupancy" | "revenue">(
    isAdmin ? "revenue" : "occupancy"
  );
  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Revenue date filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      if (activeTab === "occupancy") {
        const occData = await reportsApi.getOccupancyReport();
        setOccupancy(occData);
      } else if (activeTab === "revenue" && isAdmin) {
        const revData = await reportsApi.getRevenueReport(
          fromDate || undefined,
          toDate || undefined
        );
        setRevenue(revData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load operational analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, isAdmin, fromDate, toDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header-section">
        <div className="title-group">
          <h1>Reports & Business Intelligence</h1>
          <p>Real-time room occupancy metrics, operational utilization rates, and financial revenue distribution.</p>
        </div>

        <button
          type="button"
          className="btn-refresh"
          onClick={fetchReports}
          disabled={isLoading}
        >
          <FaSyncAlt className={isLoading ? "spin-icon" : ""} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="reports-tab-nav">
        {isAdmin && (
          <button
            type="button"
            className={`tab-btn ${activeTab === "revenue" ? "active" : ""}`}
            onClick={() => setActiveTab("revenue")}
          >
            <FaChartLine />
            <span>Revenue & Financial Analytics</span>
          </button>
        )}
        <button
          type="button"
          className={`tab-btn ${activeTab === "occupancy" ? "active" : ""}`}
          onClick={() => setActiveTab("occupancy")}
        >
          <FaChartPie />
          <span>Room Occupancy & Utilization</span>
        </button>
      </div>

      {error && <div className="reports-error-banner">{error}</div>}

      {isLoading ? (
        <div className="reports-loading-container">
          <LoadingSpinner size="lg" text="Computing hotel business intelligence..." />
        </div>
      ) : (
        <>
          {/* TAB 1: REVENUE REPORT */}
          {activeTab === "revenue" && isAdmin && revenue && (
            <div className="reports-tab-pane">
              {/* Date Filter Bar */}
              <div className="revenue-filter-bar">
                <div className="filter-title">
                  <FaCalendarAlt />
                  <span>Report Date Range</span>
                </div>
                <div className="filter-inputs-group">
                  <div className="date-field">
                    <label>From:</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="report-date-input"
                    />
                  </div>
                  <div className="date-field">
                    <label>To:</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="report-date-input"
                    />
                  </div>
                  {(fromDate || toDate) && (
                    <button
                      type="button"
                      className="btn-clear-date"
                      onClick={() => {
                        setFromDate("");
                        setToDate("");
                      }}
                    >
                      Clear Range
                    </button>
                  )}
                </div>
              </div>

              {/* Revenue Top Stats */}
              <div className="reports-metrics-grid">
                <div className="report-stat-card highlight">
                  <div className="stat-icon-box total-rev">
                    <FaMoneyBillWave />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Revenue</span>
                    <strong className="stat-num">${revenue.total_revenue.toFixed(2)}</strong>
                    <span className="stat-sub">Across All Payment Channels</span>
                  </div>
                </div>

                <div className="report-stat-card">
                  <div className="stat-icon-box stays">
                    <FaCheckCircle />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Completed Stays</span>
                    <strong className="stat-num">{revenue.completed_stays}</strong>
                    <span className="stat-sub">Checked-out Reservations</span>
                  </div>
                </div>

                <div className="report-stat-card">
                  <div className="stat-icon-box bookings">
                    <FaCalendarAlt />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Bookings</span>
                    <strong className="stat-num">{revenue.total_bookings}</strong>
                    <span className="stat-sub">Reservations in Period</span>
                  </div>
                </div>

                <div className="report-stat-card">
                  <div className="stat-icon-box cancelled">
                    <FaTimesCircle />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Cancelled Stays</span>
                    <strong className="stat-num">{revenue.cancelled_stays}</strong>
                    <span className="stat-sub">Released Reservations</span>
                  </div>
                </div>
              </div>

              {/* Revenue Payment Method Breakdown */}
              <div className="payment-breakdown-card">
                <div className="breakdown-header">
                  <h2>Revenue by Payment Method</h2>
                  <p>Distribution of transactions across tender channels.</p>
                </div>

                <div className="breakdown-cards-grid">
                  <div className="tender-card">
                    <div className="tender-icon card">
                      <FaCreditCard />
                    </div>
                    <div className="tender-details">
                      <span className="tender-name">Credit & Debit Card</span>
                      <strong className="tender-amount">${revenue.card_revenue.toFixed(2)}</strong>
                      <span className="tender-percent">
                        {revenue.total_revenue > 0
                          ? Math.round((revenue.card_revenue / revenue.total_revenue) * 100)
                          : 0}
                        % of total
                      </span>
                    </div>
                  </div>

                  <div className="tender-card">
                    <div className="tender-icon cash">
                      <FaMoneyBillWave />
                    </div>
                    <div className="tender-details">
                      <span className="tender-name">Cash</span>
                      <strong className="tender-amount">${revenue.cash_revenue.toFixed(2)}</strong>
                      <span className="tender-percent">
                        {revenue.total_revenue > 0
                          ? Math.round((revenue.cash_revenue / revenue.total_revenue) * 100)
                          : 0}
                        % of total
                      </span>
                    </div>
                  </div>

                  <div className="tender-card">
                    <div className="tender-icon transfer">
                      <FaExchangeAlt />
                    </div>
                    <div className="tender-details">
                      <span className="tender-name">Bank Transfer</span>
                      <strong className="tender-amount">${revenue.transfer_revenue.toFixed(2)}</strong>
                      <span className="tender-percent">
                        {revenue.total_revenue > 0
                          ? Math.round((revenue.transfer_revenue / revenue.total_revenue) * 100)
                          : 0}
                        % of total
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OCCUPANCY REPORT */}
          {activeTab === "occupancy" && occupancy && (
            <div className="reports-tab-pane">
              {/* Occupancy Stats */}
              <div className="reports-metrics-grid">
                <div className="report-stat-card highlight">
                  <div className="stat-icon-box total-rev">
                    <FaChartPie />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Occupancy Rate</span>
                    <strong className="stat-num">{occupancy.occupancy_rate_percentage}%</strong>
                    <span className="stat-sub">Current Live Capacity</span>
                  </div>
                </div>

                <div className="report-stat-card">
                  <div className="stat-icon-box bookings">
                    <FaBed />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Total Rooms</span>
                    <strong className="stat-num">{occupancy.total_rooms}</strong>
                    <span className="stat-sub">Physical Inventory</span>
                  </div>
                </div>

                <div className="report-stat-card">
                  <div className="stat-icon-box stays">
                    <FaCheckCircle />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Available Rooms</span>
                    <strong className="stat-num">{occupancy.available_rooms}</strong>
                    <span className="stat-sub">Vacant & Ready</span>
                  </div>
                </div>

                <div className="report-stat-card">
                  <div className="stat-icon-box occupied-stat">
                    <FaBed />
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">Occupied Rooms</span>
                    <strong className="stat-num">{occupancy.occupied_rooms}</strong>
                    <span className="stat-sub">In-House Guests</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown Table */}
              <div className="occupancy-breakdown-card">
                <div className="breakdown-header">
                  <h2>Room Status Allocation Overview</h2>
                  <p>Detailed breakdown of room operational states across the property.</p>
                </div>

                <div className="table-responsive-wrapper">
                  <table className="occupancy-table">
                    <thead>
                      <tr>
                        <th>Status Category</th>
                        <th>Room Count</th>
                        <th>Share of Inventory</th>
                        <th>Operational Implication</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="status-name-cell">
                            <span className="status-dot dot-available" />
                            <strong>Available</strong>
                          </div>
                        </td>
                        <td><strong>{occupancy.available_rooms} rooms</strong></td>
                        <td>
                          {occupancy.total_rooms > 0
                            ? Math.round((occupancy.available_rooms / occupancy.total_rooms) * 100)
                            : 0}
                          %
                        </td>
                        <td>Ready for new guest walk-in or reservation assignment</td>
                      </tr>

                      <tr>
                        <td>
                          <div className="status-name-cell">
                            <span className="status-dot dot-occupied" />
                            <strong>Occupied</strong>
                          </div>
                        </td>
                        <td><strong>{occupancy.occupied_rooms} rooms</strong></td>
                        <td>
                          {occupancy.total_rooms > 0
                            ? Math.round((occupancy.occupied_rooms / occupancy.total_rooms) * 100)
                            : 0}
                          %
                        </td>
                        <td>Active guest stay in progress</td>
                      </tr>

                      <tr>
                        <td>
                          <div className="status-name-cell">
                            <span className="status-dot dot-cleaning" />
                            <strong>Cleaning</strong>
                          </div>
                        </td>
                        <td><strong>{occupancy.cleaning_rooms} rooms</strong></td>
                        <td>
                          {occupancy.total_rooms > 0
                            ? Math.round((occupancy.cleaning_rooms / occupancy.total_rooms) * 100)
                            : 0}
                          %
                        </td>
                        <td>Housekeeping turnaround required before release</td>
                      </tr>

                      <tr>
                        <td>
                          <div className="status-name-cell">
                            <span className="status-dot dot-maintenance" />
                            <strong>Maintenance</strong>
                          </div>
                        </td>
                        <td><strong>{occupancy.maintenance_rooms} rooms</strong></td>
                        <td>
                          {occupancy.total_rooms > 0
                            ? Math.round((occupancy.maintenance_rooms / occupancy.total_rooms) * 100)
                            : 0}
                          %
                        </td>
                        <td>Out of service for maintenance repairs</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
