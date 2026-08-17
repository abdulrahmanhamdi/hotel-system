import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaBed,
  FaUsers,
  FaCalendarCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBroom,
  FaTools,
  FaSyncAlt,
  FaArrowRight,
  FaPlus,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { roomsApi } from "../../api/rooms.api";
import { guestsApi } from "../../api/guests.api";
import { reportsApi } from "../../api/reports.api";
import type { Room, OccupancyReport, RoomStatus } from "../../types";
import { Badge } from "../../components/common/Badge";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import "./DashboardPage.css";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null);
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [totalGuests, setTotalGuests] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updatingRoomId, setUpdatingRoomId] = useState<number | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      // 1. Fetch Occupancy Report
      const occPromise = reportsApi.getOccupancyReport().catch(() => null);
      // 2. Fetch Rooms
      const roomsPromise = roomsApi.getAllRooms().catch(() => []);
      // 3. Fetch Guests (if role allows)
      const guestsPromise =
        user?.role === "admin" || user?.role === "receptionist"
          ? guestsApi.getAllGuests().catch(() => [])
          : Promise.resolve([]);

      const [occData, roomsData, guestsData] = await Promise.all([
        occPromise,
        roomsPromise,
        guestsPromise,
      ]);

      setOccupancy(occData);
      setRecentRooms(roomsData);
      setTotalGuests(guestsData.length);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleQuickStatusChange = async (roomId: number, newStatus: RoomStatus) => {
    try {
      setUpdatingRoomId(roomId);
      await roomsApi.updateRoomStatus(roomId, newStatus);
      // Update local state
      setRecentRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
      );
      // Re-fetch occupancy to update counters
      reportsApi.getOccupancyReport().then(setOccupancy).catch(() => {});
    } catch (err: any) {
      alert(err.message || "Failed to update room status");
    } finally {
      setUpdatingRoomId(null);
    }
  };

  const totalRoomsCount = occupancy?.total_rooms ?? recentRooms.length;
  const availableRoomsCount =
    occupancy?.available_rooms ?? recentRooms.filter((r) => r.status === "available").length;
  const occupiedRoomsCount =
    occupancy?.occupied_rooms ?? recentRooms.filter((r) => r.status === "occupied").length;
  const cleaningRoomsCount =
    occupancy?.cleaning_rooms ?? recentRooms.filter((r) => r.status === "cleaning").length;
  const maintenanceRoomsCount =
    occupancy?.maintenance_rooms ?? recentRooms.filter((r) => r.status === "maintenance").length;
  const occupancyRate =
    occupancy?.occupancy_rate_percentage ??
    (totalRoomsCount ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0);

  return (
    <div className="dashboard-page">
      {/* Top Welcome Banner */}
      <section className="dashboard-welcome-banner">
        <div className="welcome-content">
          <div className="welcome-badge-row">
            <span className="system-pill">LIVE OPERATIONS</span>
            {user?.role && <Badge variant={user.role}>{user.role}</Badge>}
          </div>
          <h1>Welcome back, {user?.name || "Staff Member"}</h1>
          <p>
            Real-time overview of hotel room inventory, guest volume, and room status updates.
          </p>
        </div>

        <div className="welcome-actions">
          <button
            type="button"
            className="btn-refresh-dashboard"
            onClick={fetchDashboardData}
            disabled={isLoading}
            title="Refresh dashboard data"
          >
            <FaSyncAlt className={isLoading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="dashboard-alert-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="dashboard-loading-state">
          <LoadingSpinner size="lg" text="Loading live operational metrics..." />
        </div>
      ) : (
        <>
          {/* Metrics Overview Grid */}
          <section className="dashboard-metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-box total">
                <FaBed />
              </div>
              <div className="metric-info">
                <span className="metric-label">Total Rooms</span>
                <span className="metric-value">{totalRoomsCount}</span>
                <span className="metric-subtext">Registered Inventory</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box available">
                <FaCheckCircle />
              </div>
              <div className="metric-info">
                <span className="metric-label">Available Rooms</span>
                <span className="metric-value">{availableRoomsCount}</span>
                <span className="metric-subtext">Ready for Check-In</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box occupied">
                <FaCalendarCheck />
              </div>
              <div className="metric-info">
                <span className="metric-label">Occupied Rooms</span>
                <span className="metric-value">{occupiedRoomsCount}</span>
                <span className="metric-subtext">{occupancyRate}% Occupancy Rate</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box cleaning">
                <FaBroom />
              </div>
              <div className="metric-info">
                <span className="metric-label">Housekeeping</span>
                <span className="metric-value">{cleaningRoomsCount}</span>
                <span className="metric-subtext">Pending Cleaning</span>
              </div>
            </div>

            {(user?.role === "admin" || user?.role === "receptionist") && (
              <div className="metric-card">
                <div className="metric-icon-box guests">
                  <FaUsers />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Registered Guests</span>
                  <span className="metric-value">{totalGuests}</span>
                  <span className="metric-subtext">In Customer Directory</span>
                </div>
              </div>
            )}
          </section>

          {/* Operational Sections */}
          <div className="dashboard-sections-grid">
            {/* Left: Quick Room Status Distribution & Actions */}
            <section className="dashboard-card status-distribution-card">
              <div className="card-header">
                <h2>Room Status Breakdown</h2>
                <Link to="/rooms" className="view-all-link">
                  <span>Manage Rooms</span>
                  <FaArrowRight />
                </Link>
              </div>

              <div className="distribution-bars">
                <div className="dist-item">
                  <div className="dist-label-row">
                    <span className="dist-title">
                      <span className="dot dot-available" /> Available
                    </span>
                    <strong>{availableRoomsCount} rooms</strong>
                  </div>
                  <div className="dist-bar-bg">
                    <div
                      className="dist-bar-fill fill-available"
                      style={{
                        width: `${totalRoomsCount ? (availableRoomsCount / totalRoomsCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="dist-item">
                  <div className="dist-label-row">
                    <span className="dist-title">
                      <span className="dot dot-occupied" /> Occupied
                    </span>
                    <strong>{occupiedRoomsCount} rooms</strong>
                  </div>
                  <div className="dist-bar-bg">
                    <div
                      className="dist-bar-fill fill-occupied"
                      style={{
                        width: `${totalRoomsCount ? (occupiedRoomsCount / totalRoomsCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="dist-item">
                  <div className="dist-label-row">
                    <span className="dist-title">
                      <span className="dot dot-cleaning" /> Cleaning
                    </span>
                    <strong>{cleaningRoomsCount} rooms</strong>
                  </div>
                  <div className="dist-bar-bg">
                    <div
                      className="dist-bar-fill fill-cleaning"
                      style={{
                        width: `${totalRoomsCount ? (cleaningRoomsCount / totalRoomsCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="dist-item">
                  <div className="dist-label-row">
                    <span className="dist-title">
                      <span className="dot dot-maintenance" /> Maintenance
                    </span>
                    <strong>{maintenanceRoomsCount} rooms</strong>
                  </div>
                  <div className="dist-bar-bg">
                    <div
                      className="dist-bar-fill fill-maintenance"
                      style={{
                        width: `${totalRoomsCount ? (maintenanceRoomsCount / totalRoomsCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="quick-action-boxes">
                {user?.role === "admin" && (
                  <Link to="/rooms" className="quick-action-btn primary">
                    <FaPlus />
                    <span>Add New Room</span>
                  </Link>
                )}
                {(user?.role === "admin" || user?.role === "receptionist") && (
                  <Link to="/guests" className="quick-action-btn secondary">
                    <FaUsers />
                    <span>Register New Guest</span>
                  </Link>
                )}
                <Link to="/rooms" className="quick-action-btn outline">
                  <FaCalendarCheck />
                  <span>Check Date Availability</span>
                </Link>
              </div>
            </section>

            {/* Right: Room Operational Quick Controls */}
            <section className="dashboard-card live-rooms-card">
              <div className="card-header">
                <div>
                  <h2>Live Room Quick Switcher</h2>
                  <p className="card-desc">Instantly update room readiness status.</p>
                </div>
                <Badge variant="default" size="sm">
                  {recentRooms.length} Rooms
                </Badge>
              </div>

              {recentRooms.length === 0 ? (
                <div className="empty-dashboard-table">
                  <FaBed className="empty-icon" />
                  <p>No rooms in system inventory yet.</p>
                </div>
              ) : (
                <div className="quick-rooms-table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Type & Floor</th>
                        <th>Status</th>
                        <th>Quick Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRooms.slice(0, 6).map((room) => (
                        <tr key={room.id}>
                          <td>
                            <strong className="room-num-highlight">
                              Room {room.room_number}
                            </strong>
                          </td>
                          <td>
                            <div className="room-sub">
                              <span>{room.room_type?.name || "Standard Room"}</span>
                              <span className="floor-badge">Floor {room.floor}</span>
                            </div>
                          </td>
                          <td>
                            <Badge variant={room.status}>{room.status}</Badge>
                          </td>
                          <td>
                            <div className="inline-status-actions">
                              {room.status === "cleaning" && (
                                <button
                                  type="button"
                                  className="btn-quick-status ready"
                                  disabled={updatingRoomId === room.id}
                                  onClick={() => handleQuickStatusChange(room.id, "available")}
                                  title="Mark clean & available"
                                >
                                  <FaCheckCircle />
                                  <span>Mark Available</span>
                                </button>
                              )}
                              {room.status === "available" && (
                                <button
                                  type="button"
                                  className="btn-quick-status clean"
                                  disabled={updatingRoomId === room.id}
                                  onClick={() => handleQuickStatusChange(room.id, "cleaning")}
                                  title="Send to housekeeping"
                                >
                                  <FaBroom />
                                  <span>Need Cleaning</span>
                                </button>
                              )}
                              {room.status === "occupied" && (
                                <span className="status-note">Guest in room</span>
                              )}
                              {room.status === "maintenance" && (
                                <button
                                  type="button"
                                  className="btn-quick-status ready"
                                  disabled={updatingRoomId === room.id}
                                  onClick={() => handleQuickStatusChange(room.id, "available")}
                                  title="Complete maintenance"
                                >
                                  <FaTools />
                                  <span>Fix & Release</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
