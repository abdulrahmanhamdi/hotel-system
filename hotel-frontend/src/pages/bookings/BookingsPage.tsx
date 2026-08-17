import React, { useState, useEffect, useCallback } from "react";
import {
  FaCalendarCheck,
  FaPlus,
  FaBed,
  FaUser,
  FaDollarSign,
  FaCheckCircle,
  FaSignOutAlt,
  FaBan,
  FaEye,
  FaEdit,
  FaSyncAlt,
  FaReceipt,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { bookingsApi } from "../../api/bookings.api";
import { roomsApi } from "../../api/rooms.api";
import { guestsApi } from "../../api/guests.api";
import type {
  Booking,
  BookingStatus,
  Room,
  Guest,
  PaymentMethod,
  CreateBookingRequest,
  UpdateBookingRequest,
  CreatePaymentRequest,
} from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { SearchInput } from "../../components/common/SearchInput";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import "./BookingsPage.css";

const STATUS_FILTERS: { label: string; value: BookingStatus | "" }[] = [
  { label: "All Bookings", value: "" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Checked In", value: "checked_in" },
  { label: "Checked Out", value: "checked_out" },
  { label: "Pending", value: "pending" },
  { label: "Cancelled", value: "cancelled" },
];

export const BookingsPage: React.FC = () => {
  const { user } = useAuth();
  const canManageBookings = user?.role === "admin" || user?.role === "receptionist";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Search & Filter
  const [searchRef, setSearchRef] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [fromDateFilter, setFromDateFilter] = useState<string>("");
  const [toDateFilter, setToDateFilter] = useState<string>("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Form states
  const [formGuestId, setFormGuestId] = useState<number>(0);
  const [formRoomId, setFormRoomId] = useState<number>(0);
  const [formCheckInDate, setFormCheckInDate] = useState<string>("");
  const [formCheckOutDate, setFormCheckOutDate] = useState<string>("");
  const [formSpecialRequests, setFormSpecialRequests] = useState<string>("");
  const [formInitialPaymentAmount, setFormInitialPaymentAmount] = useState<string>("");
  const [formInitialPaymentMethod, setFormInitialPaymentMethod] = useState<PaymentMethod>("cash");

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      if (searchRef.trim()) {
        try {
          const single = await bookingsApi.getBookingByReference(searchRef.trim());
          setBookings(single ? [single] : []);
        } catch {
          setBookings([]);
        }
      } else {
        const data = await bookingsApi.getAllBookings({
          status: statusFilter || undefined,
          from: fromDateFilter || undefined,
          to: toDateFilter || undefined,
        });
        setBookings(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load bookings.");
    } finally {
      setIsLoading(false);
    }
  }, [searchRef, statusFilter, fromDateFilter, toDateFilter]);

  const loadSupportingData = async () => {
    try {
      const [roomsData, guestsData] = await Promise.all([
        roomsApi.getAllRooms().catch(() => []),
        guestsApi.getAllGuests().catch(() => []),
      ]);
      setRooms(roomsData);
      setGuests(guestsData);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchBookings();
    loadSupportingData();
  }, [fetchBookings]);

  // Create Booking
  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    setFormGuestId(guests[0]?.id || 0);
    setFormRoomId(rooms[0]?.id || 0);
    setFormCheckInDate(today);
    setFormCheckOutDate(tomorrow);
    setFormSpecialRequests("");
    setFormInitialPaymentAmount("");
    setFormInitialPaymentMethod("credit_card");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formGuestId || !formRoomId || !formCheckInDate || !formCheckOutDate) {
      setFormError("Guest, Room, Check-in date, and Check-out date are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateBookingRequest = {
        guest_id: Number(formGuestId),
        room_id: Number(formRoomId),
        check_in_date: formCheckInDate,
        check_out_date: formCheckOutDate,
        special_requests: formSpecialRequests.trim() || undefined,
        initial_payment: formInitialPaymentAmount
          ? {
              amount: Number(formInitialPaymentAmount),
              payment_method: formInitialPaymentMethod,
            }
          : undefined,
      };

      await bookingsApi.createBooking(payload);
      setIsCreateModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setFormError(err.message || "Failed to create reservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Booking
  const openEditModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormRoomId(booking.room_id);
    setFormCheckInDate(booking.check_in_date ? booking.check_in_date.split("T")[0] : "");
    setFormCheckOutDate(booking.check_out_date ? booking.check_out_date.split("T")[0] : "");
    setFormSpecialRequests(booking.special_requests || "");
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setFormError("");

    try {
      setIsSubmitting(true);
      const updatePayload: UpdateBookingRequest = {
        room_id: Number(formRoomId) || undefined,
        check_in_date: formCheckInDate || undefined,
        check_out_date: formCheckOutDate || undefined,
        special_requests: formSpecialRequests.trim() || undefined,
      };

      await bookingsApi.updateBooking(selectedBooking.id, updatePayload);
      setIsEditModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setFormError(err.message || "Failed to update reservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Details View
  const openDetailsModal = async (booking: Booking) => {
    try {
      const fullBooking = await bookingsApi.getBookingById(booking.id);
      setSelectedBooking(fullBooking);
    } catch {
      setSelectedBooking(booking);
    }
    setIsDetailsModalOpen(true);
  };

  // Check In
  const openCheckInModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsCheckInModalOpen(true);
  };

  const handleCheckInConfirm = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await bookingsApi.checkIn(selectedBooking.id);
      setIsCheckInModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || "Check-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check Out
  const openCheckOutModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsCheckOutModalOpen(true);
  };

  const handleCheckOutConfirm = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await bookingsApi.checkOut(selectedBooking.id);
      setIsCheckOutModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || "Check-out failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Booking
  const openCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await bookingsApi.cancelBooking(selectedBooking.id);
      setIsCancelModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      alert(err.message || "Failed to cancel booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment Recording
  const openPaymentModal = (booking: Booking) => {
    setSelectedBooking(booking);
    const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = Math.max(0, booking.total_price - totalPaid);
    setPaymentAmount(remaining > 0 ? remaining.toFixed(2) : "0.00");
    setPaymentMethod("credit_card");
    setPaymentNotes("");
    setFormError("");
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setFormError("");

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setFormError("Please enter a valid positive payment amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreatePaymentRequest = {
        booking_id: selectedBooking.id,
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
        notes: paymentNotes.trim() || undefined,
      };

      await bookingsApi.addPayment(payload);
      setIsPaymentModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      setFormError(err.message || "Failed to record payment transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bookings-page">
      {/* Page Header */}
      <div className="bookings-header-section">
        <div className="title-group">
          <h1>Reservations & Front Desk Operations</h1>
          <p>Create room reservations, verify guest intake, process check-ins/outs, and record payments.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={fetchBookings}
            disabled={isLoading}
          >
            <FaSyncAlt className={isLoading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
          {canManageBookings && (
            <button type="button" className="btn-create-booking" onClick={openCreateModal}>
              <FaPlus />
              <span>Create Reservation</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bookings-controls-bar">
        <div className="search-ref-box">
          <SearchInput
            value={searchRef}
            onChange={setSearchRef}
            placeholder="Lookup by booking reference (e.g. BK-20260216-ABCD)..."
          />
        </div>

        <div className="filter-pills-row">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`pill-filter-btn ${statusFilter === f.value ? "active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="date-range-filters">
          <div className="date-filter-item">
            <span>From:</span>
            <input
              type="date"
              value={fromDateFilter}
              onChange={(e) => setFromDateFilter(e.target.value)}
              className="filter-date-input"
            />
          </div>
          <div className="date-filter-item">
            <span>To:</span>
            <input
              type="date"
              value={toDateFilter}
              onChange={(e) => setToDateFilter(e.target.value)}
              className="filter-date-input"
            />
          </div>
          {(statusFilter || fromDateFilter || toDateFilter || searchRef) && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                setStatusFilter("");
                setFromDateFilter("");
                setToDateFilter("");
                setSearchRef("");
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {error && <div className="bookings-error-banner">{error}</div>}

      {/* Bookings Table */}
      {isLoading ? (
        <div className="bookings-loading-container">
          <LoadingSpinner size="lg" text="Loading reservations..." />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bookings-empty-state">
          <FaCalendarCheck className="empty-icon" />
          <h3>No reservations found</h3>
          <p>
            {searchRef
              ? `No booking found with reference "${searchRef}".`
              : "No bookings match the selected filters or no reservations exist."}
          </p>
          {canManageBookings && (
            <button type="button" className="btn-create-booking" onClick={openCreateModal}>
              <FaPlus />
              <span>Create First Booking</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bookings-table-card">
          <div className="table-responsive-wrapper">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Booking Reference</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Dates of Stay</th>
                  <th>Total / Paid</th>
                  <th>Status</th>
                  <th className="th-actions">Operations</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const totalPaid = b.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                  const balance = b.total_price - totalPaid;

                  return (
                    <tr key={b.id}>
                      <td>
                        <div className="ref-cell">
                          <strong className="booking-ref-code">{b.booking_reference}</strong>
                          <span className="booking-id-tag">ID #{b.id}</span>
                        </div>
                      </td>

                      <td>
                        <div className="guest-cell">
                          <FaUser className="cell-icon" />
                          <div>
                            <strong>
                              {b.guest ? `${b.guest.first_name} ${b.guest.last_name}` : `Guest #${b.guest_id}`}
                            </strong>
                            {b.guest?.phone && <span className="guest-phone-sub">{b.guest.phone}</span>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="room-cell">
                          <FaBed className="cell-icon" />
                          <div>
                            <strong>Room {b.room?.room_number || b.room_id}</strong>
                            <span className="room-type-sub">
                              {b.room?.room_type?.name || `Floor ${b.room?.floor || "—"}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="dates-cell">
                          <div className="date-row">
                            <span className="date-tag in">IN:</span>
                            <span>{b.check_in_date ? b.check_in_date.split("T")[0] : "—"}</span>
                          </div>
                          <div className="date-row">
                            <span className="date-tag out">OUT:</span>
                            <span>{b.check_out_date ? b.check_out_date.split("T")[0] : "—"}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="pricing-cell">
                          <strong className="total-amount">${b.total_price.toFixed(2)}</strong>
                          <span className={`balance-badge ${balance <= 0 ? "paid-in-full" : "has-balance"}`}>
                            {balance <= 0 ? "Paid in full" : `Due: $${balance.toFixed(2)}`}
                          </span>
                        </div>
                      </td>

                      <td>
                        <Badge variant={b.status}>{b.status}</Badge>
                      </td>

                      <td className="td-actions">
                        <div className="table-action-btns">
                          <button
                            type="button"
                            className="btn-tbl-action view"
                            onClick={() => openDetailsModal(b)}
                            title="View Booking Details"
                          >
                            <FaEye />
                          </button>

                          {canManageBookings && (
                            <>
                              {/* Edit (Pending / Confirmed only) */}
                              {(b.status === "pending" || b.status === "confirmed") && (
                                <button
                                  type="button"
                                  className="btn-tbl-action edit"
                                  onClick={() => openEditModal(b)}
                                  title="Edit Booking"
                                >
                                  <FaEdit />
                                </button>
                              )}

                              {/* Payment (Active stays with balance or general payment) */}
                              {b.status !== "cancelled" && (
                                <button
                                  type="button"
                                  className="btn-tbl-action pay"
                                  onClick={() => openPaymentModal(b)}
                                  title="Record Payment"
                                >
                                  <FaDollarSign />
                                </button>
                              )}

                              {/* Check In */}
                              {(b.status === "confirmed" || b.status === "pending") && (
                                <button
                                  type="button"
                                  className="btn-tbl-action checkin"
                                  onClick={() => openCheckInModal(b)}
                                  title="Process Check-In"
                                >
                                  <FaCheckCircle />
                                </button>
                              )}

                              {/* Check Out */}
                              {b.status === "checked_in" && (
                                <button
                                  type="button"
                                  className="btn-tbl-action checkout"
                                  onClick={() => openCheckOutModal(b)}
                                  title="Process Check-Out"
                                >
                                  <FaSignOutAlt />
                                </button>
                              )}

                              {/* Cancel */}
                              {(b.status === "pending" || b.status === "confirmed") && (
                                <button
                                  type="button"
                                  className="btn-tbl-action cancel"
                                  onClick={() => openCancelModal(b)}
                                  title="Cancel Booking"
                                >
                                  <FaBan />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE BOOKING MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Room Reservation"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="booking-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="cb-guest">Guest Profile *</label>
              <select
                id="cb-guest"
                value={formGuestId}
                onChange={(e) => setFormGuestId(Number(e.target.value))}
                required
                className="form-input"
              >
                <option value="">Select Guest</option>
                {guests.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.first_name} {g.last_name} ({g.email}) — ID: {g.id_card_or_passport}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="cb-room">Room Allocation *</label>
              <select
                id="cb-room"
                value={formRoomId}
                onChange={(e) => setFormRoomId(Number(e.target.value))}
                required
                className="form-input"
              >
                <option value="">Select Room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} ({r.room_type?.name || "Standard"}) — Floor {r.floor} — ${r.room_type?.base_price_per_night}/night [{r.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="cb-checkin">Check-In Date *</label>
              <input
                id="cb-checkin"
                type="date"
                value={formCheckInDate}
                onChange={(e) => setFormCheckInDate(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="cb-checkout">Check-Out Date *</label>
              <input
                id="cb-checkout"
                type="date"
                min={formCheckInDate}
                value={formCheckOutDate}
                onChange={(e) => setFormCheckOutDate(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="cb-requests">Special Requests / Preferences</label>
            <textarea
              id="cb-requests"
              rows={2}
              placeholder="e.g. Quiet room, high floor, airport pickup..."
              value={formSpecialRequests}
              onChange={(e) => setFormSpecialRequests(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="initial-payment-box">
            <h4>Initial Deposit / Payment (Optional)</h4>
            <div className="form-row-2">
              <div className="form-field">
                <label htmlFor="cb-pay-amount">Deposit Amount ($)</label>
                <input
                  id="cb-pay-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formInitialPaymentAmount}
                  onChange={(e) => setFormInitialPaymentAmount(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="cb-pay-method">Payment Method</label>
                <select
                  id="cb-pay-method"
                  value={formInitialPaymentMethod}
                  onChange={(e) => setFormInitialPaymentMethod(e.target.value as PaymentMethod)}
                  className="form-input"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
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
              {isSubmitting ? "Creating Reservation..." : "Create Reservation"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT BOOKING MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Reservation — ${selectedBooking?.booking_reference || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="booking-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-field">
            <label htmlFor="eb-room">Room Allocation</label>
            <select
              id="eb-room"
              value={formRoomId}
              onChange={(e) => setFormRoomId(Number(e.target.value))}
              required
              className="form-input"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number} ({r.room_type?.name}) — Floor {r.floor} — ${r.room_type?.base_price_per_night}/night [{r.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="eb-checkin">Check-In Date</label>
              <input
                id="eb-checkin"
                type="date"
                value={formCheckInDate}
                onChange={(e) => setFormCheckInDate(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="eb-checkout">Check-Out Date</label>
              <input
                id="eb-checkout"
                type="date"
                min={formCheckInDate}
                value={formCheckOutDate}
                onChange={(e) => setFormCheckOutDate(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="eb-requests">Special Requests</label>
            <textarea
              id="eb-requests"
              rows={2}
              value={formSpecialRequests}
              onChange={(e) => setFormSpecialRequests(e.target.value)}
              className="form-textarea"
            />
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

      {/* BOOKING DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Reservation Details & Invoice"
        maxWidth="lg"
      >
        {selectedBooking && (
          <div className="booking-details-view">
            <div className="details-header-card">
              <div>
                <span className="details-kicker">RESERVATION SUMMARY</span>
                <h2>{selectedBooking.booking_reference}</h2>
                <span className="details-sub">Created on {new Date(selectedBooking.created_at).toLocaleDateString()}</span>
              </div>
              <Badge variant={selectedBooking.status}>{selectedBooking.status}</Badge>
            </div>

            <div className="details-split-grid">
              {/* Guest Card */}
              <div className="details-card">
                <h3>
                  <FaUser /> Guest Information
                </h3>
                <div className="details-key-val">
                  <span>Name:</span>
                  <strong>{selectedBooking.guest?.first_name} {selectedBooking.guest?.last_name}</strong>
                </div>
                <div className="details-key-val">
                  <span>Email:</span>
                  <strong>{selectedBooking.guest?.email}</strong>
                </div>
                <div className="details-key-val">
                  <span>Phone:</span>
                  <strong>{selectedBooking.guest?.phone}</strong>
                </div>
                <div className="details-key-val">
                  <span>Passport/ID:</span>
                  <strong>{selectedBooking.guest?.id_card_or_passport}</strong>
                </div>
              </div>

              {/* Room Card */}
              <div className="details-card">
                <h3>
                  <FaBed /> Room Allocation
                </h3>
                <div className="details-key-val">
                  <span>Room Number:</span>
                  <strong>Room {selectedBooking.room?.room_number || selectedBooking.room_id}</strong>
                </div>
                <div className="details-key-val">
                  <span>Room Type:</span>
                  <strong>{selectedBooking.room?.room_type?.name || "Standard"}</strong>
                </div>
                <div className="details-key-val">
                  <span>Floor:</span>
                  <strong>Floor {selectedBooking.room?.floor || "—"}</strong>
                </div>
                <div className="details-key-val">
                  <span>Stay Dates:</span>
                  <strong>
                    {selectedBooking.check_in_date?.split("T")[0]} to {selectedBooking.check_out_date?.split("T")[0]}
                  </strong>
                </div>
              </div>
            </div>

            {selectedBooking.special_requests && (
              <div className="special-requests-card">
                <strong>Special Requests:</strong>
                <p>{selectedBooking.special_requests}</p>
              </div>
            )}

            {/* Invoicing & Payment History */}
            <div className="invoicing-section">
              <div className="invoicing-header">
                <h3>
                  <FaReceipt /> Payment & Invoice History
                </h3>
                <div className="invoice-totals">
                  <span>Total Due: <strong>${selectedBooking.total_price.toFixed(2)}</strong></span>
                </div>
              </div>

              {selectedBooking.payments && selectedBooking.payments.length > 0 ? (
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Tx Code</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBooking.payments.map((p) => (
                      <tr key={p.id}>
                        <td><code>{p.transaction_code}</code></td>
                        <td><span className="pay-method-pill">{p.payment_method}</span></td>
                        <td><strong>${p.amount.toFixed(2)}</strong></td>
                        <td><Badge variant={p.payment_status} size="sm">{p.payment_status}</Badge></td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-payments-text">No payment transactions recorded for this reservation.</p>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </button>
              {canManageBookings && selectedBooking.status !== "cancelled" && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    openPaymentModal(selectedBooking);
                  }}
                >
                  <FaDollarSign /> Add Payment
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* CHECK-IN MODAL */}
      <ConfirmDialog
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onConfirm={handleCheckInConfirm}
        title="Confirm Guest Check-In"
        message={`Confirm intake for reservation ${selectedBooking?.booking_reference}? Room ${selectedBooking?.room?.room_number || selectedBooking?.room_id} will be marked as 'OCCUPIED'.`}
        confirmText="Confirm Check-In"
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* CHECK-OUT MODAL */}
      <ConfirmDialog
        isOpen={isCheckOutModalOpen}
        onClose={() => setIsCheckOutModalOpen(false)}
        onConfirm={handleCheckOutConfirm}
        title="Confirm Guest Check-Out"
        message={`Check out reservation ${selectedBooking?.booking_reference}? Room ${selectedBooking?.room?.room_number || selectedBooking?.room_id} will be transitioned to 'CLEANING' for housekeeping turnaround.`}
        confirmText="Confirm Check-Out"
        variant="warning"
        isLoading={isSubmitting}
      />

      {/* CANCEL MODAL */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Reservation"
        message={`Are you sure you want to cancel reservation ${selectedBooking?.booking_reference}? The room lock will be released immediately.`}
        confirmText="Cancel Reservation"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment — ${selectedBooking?.booking_reference || ""}`}
        maxWidth="sm"
      >
        <form onSubmit={handlePaymentSubmit} className="booking-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="payment-summary-snippet">
            <div className="pay-line">
              <span>Total Stay Price:</span>
              <strong>${selectedBooking?.total_price.toFixed(2)}</strong>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="p-amount">Payment Amount ($) *</label>
            <input
              id="p-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="p-method">Payment Method *</label>
            <select
              id="p-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              required
              className="form-input"
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="p-notes">Notes / Transaction Reference</label>
            <input
              id="p-notes"
              type="text"
              placeholder="e.g. Front desk POS slip #8821"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BookingsPage;
