import React, { useState, useEffect } from "react";
import {
  FaBed,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaCalendarAlt,
  FaExchangeAlt,
  FaLayerGroup,
  FaDollarSign,
  FaUserFriends,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { roomsApi } from "../../api/rooms.api";
import type { Room, RoomType, RoomStatus, CreateRoomRequest, UpdateRoomRequest } from "../../types";
import { Badge, type BadgeVariant } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import "./RoomsPage.css";

const STATUS_OPTIONS: RoomStatus[] = ["available", "occupied", "cleaning", "maintenance"];

export const RoomsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canUpdateStatus = user?.role === "admin" || user?.role === "receptionist" || user?.role === "housekeeping";

  const [activeTab, setActiveTab] = useState<"all" | "availability">("all");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // Availability Search state
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [availRoomTypeId, setAvailRoomTypeId] = useState<string>("");
  const [availCapacity, setAvailCapacity] = useState<string>("");
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isSearchingAvail, setIsSearchingAvail] = useState<boolean>(false);
  const [availSearched, setAvailSearched] = useState<boolean>(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formRoomNumber, setFormRoomNumber] = useState<string>("");
  const [formRoomTypeId, setFormRoomTypeId] = useState<number>(0);
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formStatus, setFormStatus] = useState<RoomStatus>("available");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchRoomsAndTypes = React.useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [roomsData, typesData] = await Promise.all([
        roomsApi.getAllRooms({
          status: (selectedStatus as RoomStatus) || undefined,
          floor: selectedFloor ? Number(selectedFloor) : undefined,
          room_type_id: selectedType ? Number(selectedType) : undefined,
        }),
        roomsApi.getAllRoomTypes(),
      ]);
      setRooms(roomsData);
      setRoomTypes(typesData);
    } catch (err: any) {
      setError(err.message || "Failed to load rooms.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedFloor, selectedType]);

  useEffect(() => {
    fetchRoomsAndTypes();
  }, [fetchRoomsAndTypes]);

  const handleSearchAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInDate || !checkOutDate) return;
    setIsSearchingAvail(true);
    try {
      const results = await roomsApi.checkAvailability({
        check_in: checkInDate,
        check_out: checkOutDate,
        room_type_id: availRoomTypeId ? Number(availRoomTypeId) : undefined,
        capacity: availCapacity ? Number(availCapacity) : undefined,
      });
      setAvailableRooms(results);
      setAvailSearched(true);
    } catch (err: any) {
      alert(err.message || "Error searching room availability.");
    } finally {
      setIsSearchingAvail(false);
    }
  };

  // Create Room
  const openCreateModal = () => {
    setFormRoomNumber("");
    setFormRoomTypeId(roomTypes[0]?.id || 0);
    setFormFloor(1);
    setFormStatus("available");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formRoomNumber.trim() || !formRoomTypeId || !formFloor) {
      setFormError("Please fill in room number, type, and floor.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newRoomPayload: CreateRoomRequest = {
        room_number: formRoomNumber.trim(),
        room_type_id: Number(formRoomTypeId),
        floor: Number(formFloor),
        status: formStatus,
      };
      await roomsApi.createRoom(newRoomPayload);
      setIsCreateModalOpen(false);
      fetchRoomsAndTypes();
    } catch (err: any) {
      setFormError(err.message || "Failed to create room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Room
  const openEditModal = (room: Room) => {
    setSelectedRoom(room);
    setFormRoomNumber(room.room_number);
    setFormRoomTypeId(room.room_type_id);
    setFormFloor(room.floor);
    setFormStatus(room.status);
    setFormIsActive(room.is_active);
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setFormError("");

    try {
      setIsSubmitting(true);
      const updatePayload: UpdateRoomRequest = {
        room_number: formRoomNumber.trim(),
        room_type_id: Number(formRoomTypeId),
        floor: Number(formFloor),
        status: formStatus,
        is_active: formIsActive,
      };
      await roomsApi.updateRoom(selectedRoom.id, updatePayload);
      setIsEditModalOpen(false);
      fetchRoomsAndTypes();
    } catch (err: any) {
      setFormError(err.message || "Failed to update room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Change
  const openStatusModal = (room: Room) => {
    setSelectedRoom(room);
    setFormStatus(room.status);
    setFormError("");
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setFormError("");

    try {
      setIsSubmitting(true);
      await roomsApi.updateRoomStatus(selectedRoom.id, formStatus);
      setIsStatusModalOpen(false);
      fetchRoomsAndTypes();
    } catch (err: any) {
      setFormError(err.message || "Failed to update room status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Room
  const openDeleteDialog = (room: Room) => {
    setSelectedRoom(room);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRoom) return;
    try {
      setIsSubmitting(true);
      await roomsApi.deleteRoom(selectedRoom.id);
      setIsDeleteModalOpen(false);
      fetchRoomsAndTypes();
    } catch (err: any) {
      alert(err.message || "Failed to delete room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rooms-page">
      {/* Page Header */}
      <div className="rooms-header-section">
        <div className="title-group">
          <h1>Room Inventory Management</h1>
          <p>Monitor physical room readiness, categorize room types, and check real-time availability.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={fetchRoomsAndTypes}
            disabled={isLoading}
          >
            <FaSyncAlt className={isLoading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
          {isAdmin && (
            <button type="button" className="btn-create-room" onClick={openCreateModal}>
              <FaPlus />
              <span>Add New Room</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="rooms-tab-nav">
        <button
          type="button"
          className={`tab-link ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <FaLayerGroup />
          <span>All Rooms Directory ({rooms.length})</span>
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === "availability" ? "active" : ""}`}
          onClick={() => setActiveTab("availability")}
        >
          <FaCalendarAlt />
          <span>Check Date Availability</span>
        </button>
      </div>

      {/* TAB 1: ALL ROOMS DIRECTORY */}
      {activeTab === "all" && (
        <div className="tab-pane">
          {/* Filter Bar */}
          <div className="rooms-filter-bar">
            <div className="filter-group">
              <label>Status Filter</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="available">Available (🟢)</option>
                <option value="occupied">Occupied (🔴)</option>
                <option value="cleaning">Cleaning (🟡)</option>
                <option value="maintenance">Maintenance (⚪)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Floor</label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="filter-select"
              >
                <option value="">All Floors</option>
                <option value="1">Floor 1</option>
                <option value="2">Floor 2</option>
                <option value="3">Floor 3</option>
                <option value="4">Floor 4</option>
                <option value="5">Floor 5</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Room Category</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                <option value="">All Room Types</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} (${rt.base_price_per_night}/night)
                  </option>
                ))}
              </select>
            </div>

            {(selectedStatus || selectedFloor || selectedType) && (
              <button
                type="button"
                className="btn-clear-filters"
                onClick={() => {
                  setSelectedStatus("");
                  setSelectedFloor("");
                  setSelectedType("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {error && <div className="rooms-error-banner">{error}</div>}

          {isLoading ? (
            <div className="rooms-loading-container">
              <LoadingSpinner size="lg" text="Loading room inventory..." />
            </div>
          ) : rooms.length === 0 ? (
            <div className="rooms-empty-state">
              <FaBed className="empty-icon" />
              <h3>No rooms found</h3>
              <p>No rooms match your filter criteria or no rooms have been added.</p>
              {isAdmin && (
                <button type="button" className="btn-create-room" onClick={openCreateModal}>
                  <FaPlus />
                  <span>Create First Room</span>
                </button>
              )}
            </div>
          ) : (
            <div className="rooms-cards-grid">
              {rooms.map((room) => (
                <div className={`room-card-box status-${room.status}`} key={room.id}>
                  <div className="room-card-header">
                    <div className="room-card-title">
                      <span className="room-prefix">Room</span>
                      <strong className="room-number">{room.room_number}</strong>
                    </div>
                    <Badge variant={room.status as BadgeVariant}>{room.status}</Badge>
                  </div>

                  <div className="room-card-content">
                    <h3 className="room-type-title">{room.room_type?.name || "Standard Room"}</h3>
                    {room.room_type?.description && (
                      <p className="room-desc-snippet">{room.room_type.description}</p>
                    )}

                    <div className="room-attributes-list">
                      <div className="attr-item">
                        <FaLayerGroup />
                        <span>Floor {room.floor}</span>
                      </div>
                      <div className="attr-item">
                        <FaUserFriends />
                        <span>Cap: {room.room_type?.capacity || 2} Guests</span>
                      </div>
                      <div className="attr-item price-item">
                        <FaDollarSign />
                        <span>${room.room_type?.base_price_per_night || 0} / night</span>
                      </div>
                    </div>
                  </div>

                  <div className="room-card-actions">
                    {canUpdateStatus && (
                      <button
                        type="button"
                        className="btn-card-action status-action"
                        onClick={() => openStatusModal(room)}
                        title="Change Status"
                      >
                        <FaExchangeAlt />
                        <span>Status</span>
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          className="btn-card-action edit-action"
                          onClick={() => openEditModal(room)}
                          title="Edit Room"
                        >
                          <FaEdit />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-card-action delete-action"
                          onClick={() => openDeleteDialog(room)}
                          title="Delete Room"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABILITY FINDER */}
      {activeTab === "availability" && (
        <div className="tab-pane">
          <form className="availability-search-card" onSubmit={handleSearchAvailability}>
            <div className="avail-form-row">
              <div className="form-group">
                <label>Check-In Date *</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Check-Out Date *</label>
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Room Category (Optional)</label>
                <select
                  value={availRoomTypeId}
                  onChange={(e) => setAvailRoomTypeId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Any Room Type</option>
                  {roomTypes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Guests Capacity (Optional)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="e.g. 2"
                  value={availCapacity}
                  onChange={(e) => setAvailCapacity(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group btn-group-avail">
                <button
                  type="submit"
                  className="btn-search-avail"
                  disabled={isSearchingAvail}
                >
                  <FaSearch />
                  <span>{isSearchingAvail ? "Searching..." : "Find Available Rooms"}</span>
                </button>
              </div>
            </div>
          </form>

          {isSearchingAvail ? (
            <div className="rooms-loading-container">
              <LoadingSpinner size="md" text="Checking date conflict calendar..." />
            </div>
          ) : availSearched ? (
            availableRooms.length === 0 ? (
              <div className="rooms-empty-state">
                <FaBed className="empty-icon" />
                <h3>No available rooms</h3>
                <p>All rooms are reserved or unavailable for the selected dates ({checkInDate} to {checkOutDate}).</p>
              </div>
            ) : (
              <div className="availability-results-section">
                <div className="results-header">
                  <h2>Available Rooms ({availableRooms.length})</h2>
                  <p>Matching dates: <strong>{checkInDate}</strong> to <strong>{checkOutDate}</strong></p>
                </div>

                <div className="rooms-cards-grid">
                  {availableRooms.map((room) => (
                    <div className="room-card-box status-available" key={room.id}>
                      <div className="room-card-header">
                        <div className="room-card-title">
                          <span className="room-prefix">Room</span>
                          <strong className="room-number">{room.room_number}</strong>
                        </div>
                        <Badge variant="available">available</Badge>
                      </div>

                      <div className="room-card-content">
                        <h3 className="room-type-title">{room.room_type?.name || "Standard Room"}</h3>
                        <div className="room-attributes-list">
                          <div className="attr-item">
                            <FaLayerGroup />
                            <span>Floor {room.floor}</span>
                          </div>
                          <div className="attr-item">
                            <FaUserFriends />
                            <span>Cap: {room.room_type?.capacity || 2} Guests</span>
                          </div>
                          <div className="attr-item price-item">
                            <FaDollarSign />
                            <span>${room.room_type?.base_price_per_night || 0} / night</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="avail-prompt-box">
              <FaCalendarAlt className="prompt-icon" />
              <h3>Search Availability</h3>
              <p>Select check-in and check-out dates above to inspect atomic availability across room types.</p>
            </div>
          )}
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Room"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="room-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="c-room-number">Room Number *</label>
              <input
                id="c-room-number"
                type="text"
                placeholder="e.g. 101, 204B"
                value={formRoomNumber}
                onChange={(e) => setFormRoomNumber(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="c-floor">Floor Number *</label>
              <input
                id="c-floor"
                type="number"
                min="1"
                max="50"
                value={formFloor}
                onChange={(e) => setFormFloor(Number(e.target.value))}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="c-type">Room Type *</label>
            <select
              id="c-type"
              value={formRoomTypeId}
              onChange={(e) => setFormRoomTypeId(Number(e.target.value))}
              required
              className="form-input"
            >
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} — ${rt.base_price_per_night}/night (Cap: {rt.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="c-status">Initial Operational Status</label>
            <select
              id="c-status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as RoomStatus)}
              className="form-input"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating Room..." : "Create Room"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT ROOM MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Room ${selectedRoom?.room_number || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="room-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="e-room-number">Room Number *</label>
              <input
                id="e-room-number"
                type="text"
                value={formRoomNumber}
                onChange={(e) => setFormRoomNumber(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="e-floor">Floor Number *</label>
              <input
                id="e-floor"
                type="number"
                min="1"
                max="50"
                value={formFloor}
                onChange={(e) => setFormFloor(Number(e.target.value))}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="e-type">Room Type *</label>
            <select
              id="e-type"
              value={formRoomTypeId}
              onChange={(e) => setFormRoomTypeId(Number(e.target.value))}
              required
              className="form-input"
            >
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} — ${rt.base_price_per_night}/night
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="e-status">Operational Status</label>
            <select
              id="e-status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as RoomStatus)}
              className="form-input"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field checkbox-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
              />
              <span>Is Active / In Service</span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK STATUS MODAL */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Change Status — Room ${selectedRoom?.room_number || ""}`}
        maxWidth="sm"
      >
        <form onSubmit={handleStatusSubmit} className="room-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-field">
            <label htmlFor="s-status">Operational Status</label>
            <select
              id="s-status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as RoomStatus)}
              className="form-input"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE ROOM CONFIRMATION */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Room"
        message={`Are you sure you want to delete Room ${selectedRoom?.room_number}? This action cannot be undone.`}
        confirmText="Delete Room"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default RoomsPage;
