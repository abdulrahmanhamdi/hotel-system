import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaEye,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { guestsApi } from "../../api/guests.api";
import type { Guest, CreateGuestRequest, UpdateGuestRequest } from "../../types";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { SearchInput } from "../../components/common/SearchInput";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { Badge } from "../../components/common/Badge";
import "./GuestsPage.css";

export const GuestsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [formFirstName, setFormFirstName] = useState<string>("");
  const [formLastName, setFormLastName] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formPhone, setFormPhone] = useState<string>("");
  const [formIdCard, setFormIdCard] = useState<string>("");
  const [formAddress, setFormAddress] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchGuests = async (query?: string) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await guestsApi.getAllGuests(query);
      setGuests(data);
    } catch (err: any) {
      setError(err.message || "Failed to load guests.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced live search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchGuests(searchTerm);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Create Guest
  const openCreateModal = () => {
    setFormFirstName("");
    setFormLastName("");
    setFormEmail("");
    setFormPhone("");
    setFormIdCard("");
    setFormAddress("");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (
      !formFirstName.trim() ||
      !formLastName.trim() ||
      !formEmail.trim() ||
      !formPhone.trim() ||
      !formIdCard.trim()
    ) {
      setFormError("All fields except address are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newGuestPayload: CreateGuestRequest = {
        first_name: formFirstName.trim(),
        last_name: formLastName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        id_card_or_passport: formIdCard.trim(),
        address: formAddress.trim() || undefined,
      };
      await guestsApi.createGuest(newGuestPayload);
      setIsCreateModalOpen(false);
      fetchGuests(searchTerm);
    } catch (err: any) {
      setFormError(err.message || "Failed to register guest.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Guest
  const openEditModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setFormFirstName(guest.first_name);
    setFormLastName(guest.last_name);
    setFormEmail(guest.email);
    setFormPhone(guest.phone);
    setFormIdCard(guest.id_card_or_passport);
    setFormAddress(guest.address || "");
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;
    setFormError("");

    try {
      setIsSubmitting(true);
      const updatePayload: UpdateGuestRequest = {
        first_name: formFirstName.trim(),
        last_name: formLastName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        id_card_or_passport: formIdCard.trim(),
        address: formAddress.trim() || undefined,
      };
      await guestsApi.updateGuest(selectedGuest.id, updatePayload);
      setIsEditModalOpen(false);
      fetchGuests(searchTerm);
    } catch (err: any) {
      setFormError(err.message || "Failed to update guest.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Details
  const openDetailsModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsDetailsModalOpen(true);
  };

  // Delete Guest
  const openDeleteDialog = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGuest) return;
    try {
      setIsSubmitting(true);
      await guestsApi.deleteGuest(selectedGuest.id);
      setIsDeleteModalOpen(false);
      fetchGuests(searchTerm);
    } catch (err: any) {
      alert(err.message || "Failed to delete guest record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="guests-page">
      {/* Page Header */}
      <div className="guests-header-section">
        <div className="title-group">
          <h1>Guest Directory</h1>
          <p>Manage customer profiles, verify identification records, and review booking history.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={() => fetchGuests(searchTerm)}
            disabled={isLoading}
          >
            <FaSyncAlt className={isLoading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
          <button type="button" className="btn-create-guest" onClick={openCreateModal}>
            <FaUserPlus />
            <span>Register New Guest</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Controls */}
      <div className="guests-controls-bar">
        <div className="search-box-container">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, email, phone, or passport ID..."
          />
        </div>
        <div className="guests-count-tag">
          <Badge variant="default">{guests.length} Registered Guests</Badge>
        </div>
      </div>

      {error && <div className="guests-error-banner">{error}</div>}

      {/* Guests Data Table */}
      {isLoading ? (
        <div className="guests-loading-container">
          <LoadingSpinner size="lg" text="Loading guest directory..." />
        </div>
      ) : guests.length === 0 ? (
        <div className="guests-empty-state">
          <FaUsers className="empty-icon" />
          <h3>No guest records found</h3>
          <p>
            {searchTerm
              ? `No guest matches "${searchTerm}". Try a different name, email, or phone.`
              : "No guests have been registered in the directory yet."}
          </p>
          <button type="button" className="btn-create-guest" onClick={openCreateModal}>
            <FaUserPlus />
            <span>Register Guest</span>
          </button>
        </div>
      ) : (
        <div className="guests-table-card">
          <div className="table-responsive-wrapper">
            <table className="guests-table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Contact Info</th>
                  <th>ID / Passport Number</th>
                  <th>Address</th>
                  <th>Joined Date</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id}>
                    <td>
                      <div className="guest-name-cell">
                        <div className="guest-avatar-small">
                          {guest.first_name[0]}
                          {guest.last_name[0]}
                        </div>
                        <div className="guest-name-details">
                          <strong className="guest-full-name">
                            {guest.first_name} {guest.last_name}
                          </strong>
                          <span className="guest-id-sub">Guest #{guest.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="guest-contact-cell">
                        <div className="contact-item">
                          <FaEnvelope />
                          <span>{guest.email}</span>
                        </div>
                        <div className="contact-item">
                          <FaPhone />
                          <span>{guest.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="passport-badge">
                        <FaIdCard />
                        <span>{guest.id_card_or_passport}</span>
                      </div>
                    </td>
                    <td>
                      <span className="address-text">
                        {guest.address || <em className="text-muted">Not specified</em>}
                      </span>
                    </td>
                    <td>
                      <span className="date-text">
                        {guest.created_at
                          ? new Date(guest.created_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    <td className="td-actions">
                      <div className="table-action-btns">
                        <button
                          type="button"
                          className="btn-tbl-action view"
                          onClick={() => openDetailsModal(guest)}
                          title="View Guest Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          className="btn-tbl-action edit"
                          onClick={() => openEditModal(guest)}
                          title="Edit Guest Profile"
                        >
                          <FaEdit />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-tbl-action delete"
                            onClick={() => openDeleteDialog(guest)}
                            title="Delete Guest"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE GUEST MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Guest"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="guest-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="cg-first">First Name *</label>
              <input
                id="cg-first"
                type="text"
                placeholder="e.g. John"
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="cg-last">Last Name *</label>
              <input
                id="cg-last"
                type="text"
                placeholder="e.g. Doe"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="cg-email">Email Address *</label>
              <input
                id="cg-email"
                type="email"
                placeholder="guest@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="cg-phone">Phone Number *</label>
              <input
                id="cg-phone"
                type="tel"
                placeholder="+1 555-0199"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="cg-passport">National ID / Passport Number *</label>
            <input
              id="cg-passport"
              type="text"
              placeholder="e.g. A12345678"
              value={formIdCard}
              onChange={(e) => setFormIdCard(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="cg-address">Residential Address (Optional)</label>
            <textarea
              id="cg-address"
              rows={2}
              placeholder="Street address, city, country..."
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="form-textarea"
            />
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
              {isSubmitting ? "Registering..." : "Register Guest"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT GUEST MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Profile — ${selectedGuest?.first_name} ${selectedGuest?.last_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="guest-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="eg-first">First Name *</label>
              <input
                id="eg-first"
                type="text"
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="eg-last">Last Name *</label>
              <input
                id="eg-last"
                type="text"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-field">
              <label htmlFor="eg-email">Email Address *</label>
              <input
                id="eg-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="eg-phone">Phone Number *</label>
              <input
                id="eg-phone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="eg-passport">National ID / Passport Number *</label>
            <input
              id="eg-passport"
              type="text"
              value={formIdCard}
              onChange={(e) => setFormIdCard(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="eg-address">Residential Address</label>
            <textarea
              id="eg-address"
              rows={2}
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
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

      {/* GUEST DETAILS MODAL */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Guest Profile Overview"
        maxWidth="md"
      >
        {selectedGuest && (
          <div className="guest-details-view">
            <div className="guest-details-hero">
              <div className="details-avatar">
                {selectedGuest.first_name[0]}
                {selectedGuest.last_name[0]}
              </div>
              <div className="details-hero-text">
                <h2>
                  {selectedGuest.first_name} {selectedGuest.last_name}
                </h2>
                <span className="guest-id-tag">System Guest ID #{selectedGuest.id}</span>
              </div>
            </div>

            <div className="details-info-grid">
              <div className="info-box">
                <span className="info-label">
                  <FaEnvelope /> Email Address
                </span>
                <strong className="info-val">{selectedGuest.email}</strong>
              </div>

              <div className="info-box">
                <span className="info-label">
                  <FaPhone /> Phone Number
                </span>
                <strong className="info-val">{selectedGuest.phone}</strong>
              </div>

              <div className="info-box">
                <span className="info-label">
                  <FaIdCard /> Passport / ID
                </span>
                <strong className="info-val">{selectedGuest.id_card_or_passport}</strong>
              </div>

              <div className="info-box">
                <span className="info-label">
                  <FaCalendarAlt /> Profile Created
                </span>
                <strong className="info-val">
                  {selectedGuest.created_at
                    ? new Date(selectedGuest.created_at).toLocaleString()
                    : "—"}
                </strong>
              </div>

              <div className="info-box full-width">
                <span className="info-label">
                  <FaMapMarkerAlt /> Residential Address
                </span>
                <strong className="info-val">
                  {selectedGuest.address || "No address on file."}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  openEditModal(selectedGuest);
                }}
              >
                <FaEdit /> Edit Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE GUEST CONFIRMATION */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Guest Profile"
        message={`Are you sure you want to delete ${selectedGuest?.first_name} ${selectedGuest?.last_name}? This action cannot be undone.`}
        confirmText="Delete Guest"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default GuestsPage;
