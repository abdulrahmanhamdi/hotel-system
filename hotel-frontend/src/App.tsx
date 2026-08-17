import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";
import { RoleGuard } from "./components/guards/RoleGuard";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { RoomsPage } from "./pages/rooms/RoomsPage";
import { GuestsPage } from "./pages/guests/GuestsPage";
import { BookingsPage } from "./pages/bookings/BookingsPage";
import { CheckInOutPage } from "./pages/checkin-checkout/CheckInOutPage";
import { ReportsPage } from "./pages/reports/ReportsPage";
import { StaffManagementPage } from "./pages/staff/StaffManagementPage";
import { NotFoundPage } from "./pages/notfound/NotFoundPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard: All Staff Roles */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Rooms Management: All Staff Roles */}
            <Route path="/rooms" element={<RoomsPage />} />

            {/* Guests Management: Admin & Receptionist only */}
            <Route
              path="/guests"
              element={
                <RoleGuard
                  roles={["admin", "receptionist"]}
                  fallback={<Navigate to="/dashboard" replace />}
                >
                  <GuestsPage />
                </RoleGuard>
              }
            />

            {/* Bookings Management: Admin & Receptionist only */}
            <Route
              path="/bookings"
              element={
                <RoleGuard
                  roles={["admin", "receptionist"]}
                  fallback={<Navigate to="/dashboard" replace />}
                >
                  <BookingsPage />
                </RoleGuard>
              }
            />

            {/* Front Desk Check-in / Check-out: Admin & Receptionist only */}
            <Route
              path="/checkin-checkout"
              element={
                <RoleGuard
                  roles={["admin", "receptionist"]}
                  fallback={<Navigate to="/dashboard" replace />}
                >
                  <CheckInOutPage />
                </RoleGuard>
              }
            />

            {/* Reports & Analytics: Admin & Receptionist */}
            <Route
              path="/reports"
              element={
                <RoleGuard
                  roles={["admin", "receptionist"]}
                  fallback={<Navigate to="/dashboard" replace />}
                >
                  <ReportsPage />
                </RoleGuard>
              }
            />

            {/* Staff User Management: Admin Only */}
            <Route
              path="/staff"
              element={
                <RoleGuard
                  roles={["admin"]}
                  fallback={<Navigate to="/dashboard" replace />}
                >
                  <StaffManagementPage />
                </RoleGuard>
              }
            />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
