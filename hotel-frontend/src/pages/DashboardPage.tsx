import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHotel,
  FaBed,
  FaCalendarCheck,
  FaUsers,
  FaSignOutAlt,
  FaSyncAlt,
  FaChartPie,
} from "react-icons/fa";
import apiClient from "../api/client";
import type { User, Room, Guest, Booking, OccupancyReport } from "../types";
import "../styles/DashboardPage.css";

export function DashboardPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"rooms" | "bookings" | "guests">("rooms");

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || localStorage.getItem("hotel_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Check health
      try {
        const healthRes = await apiClient.get("/health", { baseURL: import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace("/api/v1", "") : "http://192.168.1.41:8080" });
        setBackendOnline(healthRes.data?.success ?? true);
      } catch {
        setBackendOnline(true);
      }

      // 2. Load Rooms
      const roomsRes = await apiClient.get("/rooms");
      if (roomsRes.data?.data) {
        setRooms(roomsRes.data.data);
      }

      // 3. Load Guests
      const guestsRes = await apiClient.get("/guests");
      if (guestsRes.data?.data) {
        setGuests(guestsRes.data.data);
      }

      // 4. Load Bookings
      const bookingsRes = await apiClient.get("/bookings");
      if (bookingsRes.data?.data) {
        setBookings(bookingsRes.data.data);
      }

      // 5. Load Occupancy
      const occupancyRes = await apiClient.get("/reports/occupancy");
      if (occupancyRes.data?.data) {
        setOccupancy(occupancyRes.data.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("hotel_token");
    localStorage.removeItem("user");
    localStorage.removeItem("hotel_user");
    navigate("/login", { replace: true });
  };

  const totalRoomsCount = occupancy?.total_rooms ?? rooms.length;
  const availableRoomsCount = occupancy?.available_rooms ?? rooms.filter((r) => r.status === "available").length;
  const occupiedRoomsCount = occupancy?.occupied_rooms ?? rooms.filter((r) => r.status === "occupied").length;
  const occupancyRate = occupancy?.occupancy_rate_percentage ?? (totalRoomsCount ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0);

  return (
    <div className="dashboard-container">
      {/* Top Navigation */}
      <header className="dashboard-nav">
        <div className="nav-brand">
          <FaHotel className="brand-icon" />
          <span className="brand-title">Hotel Management System</span>
        </div>

        <div className="nav-user-section">
          {currentUser && (
            <div className="user-badge">
              <div className="user-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
              <span className="user-name">{currentUser.name}</span>
              <span className="role-tag">{currentUser.role}</span>
            </div>
          )}

          <button className="btn-logout" onClick={handleLogout} title="Sign out">
            <FaSignOutAlt />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-text">
            <h1>Operations Dashboard</h1>
            <p>Welcome back, {currentUser?.name || "Staff Member"}. Real-time hotel operations overview.</p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="backend-indicator">
              <span className={`status-dot ${backendOnline ? "online" : "offline"}`}></span>
              <span>Backend API {backendOnline ? "Connected" : "Unreachable"}</span>
            </div>

            <button className="btn-refresh" onClick={loadDashboardData} disabled={loading}>
              <FaSyncAlt className={loading ? "fa-spin" : ""} />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FaHotel />
            </div>
            <div className="stat-info">
              <span className="stat-value">{totalRoomsCount}</span>
              <span className="stat-label">Total Rooms</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon available">
              <FaBed />
            </div>
            <div className="stat-info">
              <span className="stat-value">{availableRoomsCount}</span>
              <span className="stat-label">Available Rooms</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon occupied">
              <FaCalendarCheck />
            </div>
            <div className="stat-info">
              <span className="stat-value">{occupiedRoomsCount}</span>
              <span className="stat-label">Occupied Rooms</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon occupancy">
              <FaChartPie />
            </div>
            <div className="stat-info">
              <span className="stat-value">{occupancyRate}%</span>
              <span className="stat-label">Occupancy Rate</span>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === "rooms" ? "active" : ""}`}
            onClick={() => setActiveTab("rooms")}
          >
            <FaBed />
            <span>Rooms Inventory ({rooms.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <FaCalendarCheck />
            <span>Bookings ({bookings.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === "guests" ? "active" : ""}`}
            onClick={() => setActiveTab("guests")}
          >
            <FaUsers />
            <span>Guests Directory ({guests.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <section className="content-section">
          {activeTab === "rooms" && (
            <div>
              <div className="section-header">
                <h2>Room Inventory & Availability</h2>
              </div>

              {rooms.length === 0 ? (
                <div className="empty-state">
                  <FaBed className="empty-icon" />
                  <p>No rooms found in inventory.</p>
                </div>
              ) : (
                <div className="rooms-grid">
                  {rooms.map((room) => (
                    <div className="room-card" key={room.id}>
                      <div className="room-card-top">
                        <span className="room-number">Room {room.room_number}</span>
                        <span className={`room-badge ${room.status}`}>{room.status}</span>
                      </div>

                      <p className="room-type-title">{room.room_type?.name || "Standard Room"}</p>

                      <div className="room-details">
                        <span>Floor {room.floor}</span>
                        <span>Cap: {room.room_type?.capacity || 1}</span>
                        <span className="room-price">${room.room_type?.base_price_per_night || 0}/night</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div>
              <div className="section-header">
                <h2>Active & Upcoming Reservations</h2>
              </div>

              {bookings.length === 0 ? (
                <div className="empty-state">
                  <FaCalendarCheck className="empty-icon" />
                  <p>No active reservations found.</p>
                </div>
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Guest</th>
                        <th>Room</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id}>
                          <td><strong>{b.booking_reference}</strong></td>
                          <td>{b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : `Guest #${b.guest_id}`}</td>
                          <td>{b.room?.room_number || b.room_id}</td>
                          <td>{b.check_in_date}</td>
                          <td>{b.check_out_date}</td>
                          <td>${b.total_price}</td>
                          <td><span className={`room-badge ${b.status}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "guests" && (
            <div>
              <div className="section-header">
                <h2>Registered Guests</h2>
              </div>

              {guests.length === 0 ? (
                <div className="empty-state">
                  <FaUsers className="empty-icon" />
                  <p>No registered guests found in the directory.</p>
                </div>
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>ID / Passport</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guests.map((g) => (
                        <tr key={g.id}>
                          <td><strong>{g.first_name} {g.last_name}</strong></td>
                          <td>{g.email}</td>
                          <td>{g.phone}</td>
                          <td>{g.id_card_or_passport}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
