import React, { useState, useEffect } from "react";
import {
  FaConciergeBell,
  FaCheckCircle,
  FaSignOutAlt,
  FaBed,
  FaUser,
  FaCalendarAlt,
  FaDollarSign,
} from "react-icons/fa";
import { bookingsApi } from "../../api/bookings.api";
import type { Booking, CreatePaymentRequest, PaymentMethod } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { SearchInput } from "../../components/common/SearchInput";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import "./CheckInOutPage.css";

export const CheckInOutPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"checkin" | "checkout">("checkin");
  const [searchRef, setSearchRef] = useState<string>("");
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchFrontDeskData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [allConfirmed, allCheckedIn] = await Promise.all([
        bookingsApi.getAllBookings({ status: "confirmed" }),
        bookingsApi.getAllBookings({ status: "checked_in" }),
      ]);
      setPendingBookings(allConfirmed);
      setActiveBookings(allCheckedIn);
    } catch (err: any) {
      setError(err.message || "Failed to load front desk records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFrontDeskData();
  }, []);

  // Filtered lists
  const filteredPending = pendingBookings.filter((b) => {
    if (!searchRef.trim()) return true;
    const q = searchRef.toLowerCase();
    return (
      b.booking_reference.toLowerCase().includes(q) ||
      b.guest?.first_name.toLowerCase().includes(q) ||
      b.guest?.last_name.toLowerCase().includes(q) ||
      b.room?.room_number.toLowerCase().includes(q)
    );
  });

  const filteredActive = activeBookings.filter((b) => {
    if (!searchRef.trim()) return true;
    const q = searchRef.toLowerCase();
    return (
      b.booking_reference.toLowerCase().includes(q) ||
      b.guest?.first_name.toLowerCase().includes(q) ||
      b.guest?.last_name.toLowerCase().includes(q) ||
      b.room?.room_number.toLowerCase().includes(q)
    );
  });

  // Check In
  const handleCheckInConfirm = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await bookingsApi.checkIn(selectedBooking.id);
      setIsCheckInModalOpen(false);
      fetchFrontDeskData();
    } catch (err: any) {
      alert(err.message || "Check-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check Out
  const handleCheckOutConfirm = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await bookingsApi.checkOut(selectedBooking.id);
      setIsCheckOutModalOpen(false);
      fetchFrontDeskData();
    } catch (err: any) {
      alert(err.message || "Check-out failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment Recording
  const openPaymentModal = (booking: Booking) => {
    setSelectedBooking(booking);
    const totalPaid = booking.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = Math.max(0, booking.total_price - totalPaid);
    setPaymentAmount(remaining.toFixed(2));
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
      setFormError("Please enter a valid payment amount.");
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
      fetchFrontDeskData();
    } catch (err: any) {
      setFormError(err.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="frontdesk-page">
      {/* Header */}
      <div className="frontdesk-header">
        <div className="title-group">
          <h1>Front Desk Operations Station</h1>
          <p>Expedited guest intake, keycard allocation verification, room departure handling, and checkout invoicing.</p>
        </div>

        <button
          type="button"
          className="btn-refresh"
          onClick={fetchFrontDeskData}
          disabled={isLoading}
        >
          <FaConciergeBell />
          <span>Sync Front Desk</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="frontdesk-tab-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === "checkin" ? "active" : ""}`}
          onClick={() => setActiveTab("checkin")}
        >
          <FaCheckCircle />
          <span>Pending Check-Ins ({pendingBookings.length})</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "checkout" ? "active" : ""}`}
          onClick={() => setActiveTab("checkout")}
        >
          <FaSignOutAlt />
          <span>Departures & Check-Outs ({activeBookings.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="frontdesk-search-bar">
        <SearchInput
          value={searchRef}
          onChange={setSearchRef}
          placeholder="Lookup guest by name, booking reference, or room number..."
        />
      </div>

      {error && <div className="frontdesk-error-banner">{error}</div>}

      {isLoading ? (
        <div className="frontdesk-loading">
          <LoadingSpinner size="lg" text="Loading front desk operations queue..." />
        </div>
      ) : (
        <>
          {/* TAB 1: CHECK-IN */}
          {activeTab === "checkin" && (
            <div className="frontdesk-grid">
              {filteredPending.length === 0 ? (
                <div className="frontdesk-empty-state">
                  <FaCheckCircle className="empty-icon" />
                  <h3>No pending check-ins</h3>
                  <p>All confirmed guests have checked in or no bookings are queued for intake.</p>
                </div>
              ) : (
                filteredPending.map((b) => {
                  const totalPaid = b.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                  const balance = b.total_price - totalPaid;

                  return (
                    <div className="station-card" key={b.id}>
                      <div className="station-card-header">
                        <span className="station-ref">{b.booking_reference}</span>
                        <Badge variant={b.status}>{b.status}</Badge>
                      </div>

                      <div className="station-guest-info">
                        <h3>{b.guest?.first_name} {b.guest?.last_name}</h3>
                        <span className="guest-sub-item"><FaUser /> ID/Passport: {b.guest?.id_card_or_passport}</span>
                        <span className="guest-sub-item"><FaCalendarAlt /> Stay: {b.check_in_date?.split("T")[0]} to {b.check_out_date?.split("T")[0]}</span>
                      </div>

                      <div className="station-room-box">
                        <div className="room-highlight">
                          <FaBed />
                          <strong>Room {b.room?.room_number || b.room_id}</strong>
                        </div>
                        <span className="room-details-text">
                          {b.room?.room_type?.name || "Standard Room"} • Floor {b.room?.floor}
                        </span>
                      </div>

                      <div className="station-financial-line">
                        <span>Total: <strong>${b.total_price.toFixed(2)}</strong></span>
                        <span className={`balance-tag ${balance <= 0 ? "paid" : "due"}`}>
                          {balance <= 0 ? "Fully Paid" : `Due: $${balance.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="station-actions">
                        {balance > 0 && (
                          <button
                            type="button"
                            className="btn-station-pay"
                            onClick={() => openPaymentModal(b)}
                          >
                            <FaDollarSign /> Collect Payment
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-station-checkin"
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsCheckInModalOpen(true);
                          }}
                        >
                          <FaCheckCircle /> Process Check-In
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: CHECK-OUT */}
          {activeTab === "checkout" && (
            <div className="frontdesk-grid">
              {filteredActive.length === 0 ? (
                <div className="frontdesk-empty-state">
                  <FaSignOutAlt className="empty-icon" />
                  <h3>No in-house guests for departure</h3>
                  <p>There are no active checked-in guests currently in rooms.</p>
                </div>
              ) : (
                filteredActive.map((b) => {
                  const totalPaid = b.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                  const balance = b.total_price - totalPaid;

                  return (
                    <div className="station-card departure-card" key={b.id}>
                      <div className="station-card-header">
                        <span className="station-ref">{b.booking_reference}</span>
                        <Badge variant="checked_in">In House</Badge>
                      </div>

                      <div className="station-guest-info">
                        <h3>{b.guest?.first_name} {b.guest?.last_name}</h3>
                        <span className="guest-sub-item"><FaUser /> ID: {b.guest?.id_card_or_passport}</span>
                        <span className="guest-sub-item"><FaCalendarAlt /> Departure Date: {b.check_out_date?.split("T")[0]}</span>
                      </div>

                      <div className="station-room-box">
                        <div className="room-highlight">
                          <FaBed />
                          <strong>Room {b.room?.room_number || b.room_id}</strong>
                        </div>
                        <span className="room-details-text">
                          {b.room?.room_type?.name} • Floor {b.room?.floor}
                        </span>
                      </div>

                      <div className="station-financial-line">
                        <span>Total: <strong>${b.total_price.toFixed(2)}</strong></span>
                        <span className={`balance-tag ${balance <= 0 ? "paid" : "due"}`}>
                          {balance <= 0 ? "Fully Paid" : `Outstanding: $${balance.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="station-actions">
                        {balance > 0 && (
                          <button
                            type="button"
                            className="btn-station-pay"
                            onClick={() => openPaymentModal(b)}
                          >
                            <FaDollarSign /> Settle Balance
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-station-checkout"
                          onClick={() => {
                            setSelectedBooking(b);
                            setIsCheckOutModalOpen(true);
                          }}
                        >
                          <FaSignOutAlt /> Process Check-Out
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* CHECK-IN CONFIRM */}
      <ConfirmDialog
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onConfirm={handleCheckInConfirm}
        title="Check-In Confirmation"
        message={`Check in guest ${selectedBooking?.guest?.first_name} ${selectedBooking?.guest?.last_name} for Room ${selectedBooking?.room?.room_number}? Room status will switch to 'occupied'.`}
        confirmText="Complete Check-In"
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* CHECK-OUT CONFIRM */}
      <ConfirmDialog
        isOpen={isCheckOutModalOpen}
        onClose={() => setIsCheckOutModalOpen(false)}
        onConfirm={handleCheckOutConfirm}
        title="Check-Out & Room Release"
        message={`Complete departure for ${selectedBooking?.guest?.first_name} ${selectedBooking?.guest?.last_name}? Room ${selectedBooking?.room?.room_number} will be sent to housekeeping for cleaning.`}
        confirmText="Complete Check-Out"
        variant="warning"
        isLoading={isSubmitting}
      />

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Collect Payment — ${selectedBooking?.booking_reference || ""}`}
        maxWidth="sm"
      >
        <form onSubmit={handlePaymentSubmit} className="payment-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-field">
            <label htmlFor="fd-amount">Amount to Charge ($) *</label>
            <input
              id="fd-amount"
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
            <label htmlFor="fd-method">Payment Method *</label>
            <select
              id="fd-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              required
              className="form-input"
            >
              <option value="credit_card">Credit Card (POS Terminal)</option>
              <option value="cash">Cash</option>
              <option value="debit_card">Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="fd-notes">Notes / Terminal Receipt Code</label>
            <input
              id="fd-notes"
              type="text"
              placeholder="e.g. Terminal TX-9923"
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
              {isSubmitting ? "Processing Payment..." : "Record Payment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CheckInOutPage;
