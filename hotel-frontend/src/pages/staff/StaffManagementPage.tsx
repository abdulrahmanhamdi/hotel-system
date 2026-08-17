import React, { useState, useEffect, useCallback } from "react";
import {
  FaUserShield,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { staffApi } from "../../api/staff.api";
import type { User, UserRole, CreateStaffRequest, UpdateStaffRequest } from "../../types";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { SearchInput } from "../../components/common/SearchInput";
import "./StaffManagementPage.css";

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: "Administrator (Full Access)", value: "admin" },
  { label: "Receptionist (Front Desk)", value: "receptionist" },
  { label: "Housekeeping Staff", value: "housekeeping" },
];

export const StaffManagementPage: React.FC = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formEmail, setFormEmail] = useState<string>("");
  const [formPassword, setFormPassword] = useState<string>("");
  const [formRole, setFormRole] = useState<UserRole>("receptionist");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await staffApi.getAllStaff();
      setStaffList(data);
    } catch (err: any) {
      setError(err.message || "Failed to load staff list.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const filteredStaff = staffList.filter((s) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  // Create Staff
  const openCreateModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("receptionist");
    setFormError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim() || !formEmail.trim() || !formPassword.trim() || !formRole) {
      setFormError("All fields are required.");
      return;
    }

    if (formPassword.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateStaffRequest = {
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      };

      await staffApi.createStaff(payload);
      setIsCreateModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      setFormError(err.message || "Failed to create staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Staff
  const openEditModal = (staff: User) => {
    setSelectedStaff(staff);
    setFormName(staff.name);
    setFormEmail(staff.email);
    setFormRole(staff.role);
    setFormIsActive(staff.is_active);
    setFormError("");
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setFormError("");

    try {
      setIsSubmitting(true);
      const payload: UpdateStaffRequest = {
        name: formName.trim() || undefined,
        email: formEmail.trim() || undefined,
        role: formRole,
        is_active: formIsActive,
      };

      await staffApi.updateStaff(selectedStaff.id, payload);
      setIsEditModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      setFormError(err.message || "Failed to update staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Staff
  const openDeleteDialog = (staff: User) => {
    setSelectedStaff(staff);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStaff) return;
    try {
      setIsSubmitting(true);
      await staffApi.deleteStaff(selectedStaff.id);
      setIsDeleteModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.message || "Failed to delete staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="staff-page">
      {/* Header */}
      <div className="staff-header-section">
        <div className="title-group">
          <h1>Staff & User Access Management</h1>
          <p>Register hotel personnel accounts, provision system credentials, and configure Role-Based Access Control (RBAC).</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={fetchStaff}
            disabled={isLoading}
          >
            <FaSyncAlt className={isLoading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
          <button type="button" className="btn-create-staff" onClick={openCreateModal}>
            <FaUserPlus />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="staff-controls-bar">
        <div className="staff-search-box">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search staff by name, email, or role..."
          />
        </div>
        <div className="staff-count-tag">
          <Badge variant="admin">{staffList.length} Staff Accounts</Badge>
        </div>
      </div>

      {error && <div className="staff-error-banner">{error}</div>}

      {/* Staff Table */}
      {isLoading ? (
        <div className="staff-loading-container">
          <LoadingSpinner size="lg" text="Loading staff records..." />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="staff-empty-state">
          <FaUserShield className="empty-icon" />
          <h3>No staff accounts found</h3>
          <p>
            {searchTerm
              ? `No staff member matches "${searchTerm}".`
              : "No staff members registered in the system."}
          </p>
          <button type="button" className="btn-create-staff" onClick={openCreateModal}>
            <FaUserPlus />
            <span>Create Staff Member</span>
          </button>
        </div>
      ) : (
        <div className="staff-table-card">
          <div className="table-responsive-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th>Account Status</th>
                  <th>Created Date</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <div className="staff-name-cell">
                        <div className="staff-avatar">
                          {staff.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="staff-details">
                          <strong className="staff-full-name">{staff.name}</strong>
                          <span className="staff-id-sub">Staff ID #{staff.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="email-cell">
                        <FaEnvelope />
                        <span>{staff.email}</span>
                      </div>
                    </td>

                    <td>
                      <Badge variant={staff.role}>{staff.role}</Badge>
                    </td>

                    <td>
                      <span className={`status-pill ${staff.is_active ? "active" : "inactive"}`}>
                        {staff.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
                        {staff.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>

                    <td>
                      <span className="date-text">
                        {staff.created_at
                          ? new Date(staff.created_at).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>

                    <td className="td-actions">
                      <div className="table-action-btns">
                        <button
                          type="button"
                          className="btn-tbl-action edit"
                          onClick={() => openEditModal(staff)}
                          title="Edit Staff Member"
                        >
                          <FaEdit />
                        </button>
                        <button
                          type="button"
                          className="btn-tbl-action delete"
                          onClick={() => openDeleteDialog(staff)}
                          title="Delete Staff Member"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Staff Member"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="staff-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-field">
            <label htmlFor="cs-name">Full Name *</label>
            <input
              id="cs-name"
              type="text"
              placeholder="e.g. Eleanor Vance"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="cs-email">Work Email Address *</label>
            <input
              id="cs-email"
              type="email"
              placeholder="staff@grandhorizon.com"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="cs-password">Temporary Password *</label>
            <div className="password-input-wrapper">
              <FaLock className="lock-icon" />
              <input
                id="cs-password"
                type="password"
                placeholder="At least 6 characters..."
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
                className="form-input with-icon"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="cs-role">Assigned System Role *</label>
            <select
              id="cs-role"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as UserRole)}
              required
              className="form-input"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
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
              {isSubmitting ? "Creating Staff Account..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT STAFF MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Staff Account — ${selectedStaff?.name || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="staff-form">
          {formError && <div className="modal-alert-error">{formError}</div>}

          <div className="form-field">
            <label htmlFor="es-name">Full Name *</label>
            <input
              id="es-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="es-email">Work Email Address *</label>
            <input
              id="es-email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="es-role">Assigned System Role *</label>
            <select
              id="es-role"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as UserRole)}
              required
              className="form-input"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
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
              <span>Account Active & Permitted to Sign In</span>
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

      {/* DELETE STAFF CONFIRMATION */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Staff Account"
        message={`Are you sure you want to remove staff member ${selectedStaff?.name} (${selectedStaff?.email})? This user will immediately lose access to the system.`}
        confirmText="Delete Account"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default StaffManagementPage;
