import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

// Admin Pages
import AdminDashboardPage   from "./pages/admin/AdminDashboardPage";
import AdminSemestersPage   from "./pages/admin/AdminSemestersPage";
import AdminSubjectsPage    from "./pages/admin/AdminSubjectsPage";
import AdminExperimentsPage from "./pages/admin/AdminExperimentsPage";
import AdminStudentsPage    from "./pages/admin/AdminStudentsPage";
import AdminStatisticsPage  from "./pages/admin/AdminStatisticsPage";
import AdminSettingsPage    from "./pages/admin/AdminSettingsPage";

// Student Pages
import StudentDashboardPage    from "./pages/student/StudentDashboardPage";
import StudentExperimentsPage  from "./pages/student/StudentExperimentsPage";
import StudentDocumentsPage    from "./pages/student/StudentDocumentsPage";
import StudentViewerPage       from "./pages/student/StudentViewerPage";
import StudentPrintHistoryPage from "./pages/student/StudentPrintHistoryPage";
import StudentStatisticsPage   from "./pages/student/StudentStatisticsPage";
import StudentSettingsPage     from "./pages/student/StudentSettingsPage";

import "./App.css";

function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="page-loader">Loading workspace…</div>;
  return <Navigate to={user ? `/${user.role}/dashboard` : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/dashboard"   element={<AdminDashboardPage />} />
              <Route path="/admin/semesters"   element={<AdminSemestersPage />} />
              <Route path="/admin/subjects"    element={<AdminSubjectsPage />} />
              <Route path="/admin/experiments" element={<AdminExperimentsPage />} />
              <Route path="/admin/students"    element={<AdminStudentsPage />} />
              <Route path="/admin/statistics"  element={<AdminStatisticsPage />} />
              <Route path="/admin/settings"    element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute allowedRole="student" />}>
            <Route element={<AppLayout />}>
              <Route path="/student/dashboard"     element={<StudentDashboardPage />} />
              <Route path="/student/experiments"   element={<StudentExperimentsPage />} />
              <Route path="/student/documents"     element={<StudentDocumentsPage />} />
              <Route path="/student/view/:documentId" element={<StudentViewerPage />} />
              <Route path="/student/print-history" element={<StudentPrintHistoryPage />} />
              <Route path="/student/statistics"    element={<StudentStatisticsPage />} />
              <Route path="/student/settings"      element={<StudentSettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
