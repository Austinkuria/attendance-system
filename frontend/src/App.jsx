import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Login from './pages/AuthenticationPages/Login';
import Signup from './pages/AuthenticationPages/Signup';
import RequestAccess from './pages/AuthenticationPages/RequestAccess';
import VerifyEmail from './pages/AuthenticationPages/VerifyEmail';
import ChangePassword from './pages/AuthenticationPages/ChangePassword';
import Dashboard from './pages/Dashboard';
import LecturerDashboard from './pages/dashboards/LecturerDashboard';
import LecturerDashboardRedesign from './pages/dashboards/LecturerDashboardRedesign';
import LecturerLayout from './layouts/LecturerLayout';
import AdminPanel from './pages/dashboards/AdminPanel';
import ManageStudents from './pages/Management/ManageStudents';
import ManageCourses from './pages/Management/ManageCourses';
import ManageLecturers from './pages/Management/ManageLecturers';
import Analytics from './pages/dashboards/Analytics';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import QRScanner from './components/QRScanner';
import NotFound from './pages/ErrorPages/NotFound';
import Forbidden from './pages/ErrorPages/Forbidden';
import ServerError from './pages/ErrorPages/ServerError';
import MethodNotAllowed from './pages/ErrorPages/MethodNotAllowed';
import Unauthorized from './pages/ErrorPages/Unauthorized';
import AdminProfile from './pages/profiles/AdminProfile';
import LecturerProfile from './pages/profiles/LecturerProfile';
import LecturerSettings from './pages/settings/LecturerSettings';
import AdminSettings from './pages/settings/AdminSettings';
import AdminAnalytics from './pages/dashboards/AdminAnalytics';
import ResetPasswordRequest from './pages/AuthenticationPages/ResetPasswordRequest';
import ResetPassword from './pages/AuthenticationPages/ResetPassword';
import StudentLayout from './layouts/StudentLayout';
import StudentTodayDashboard from './pages/dashboards/StudentTodayDashboard';
import StudentTrendsView from './pages/dashboards/StudentTrendsView';
import StudentUnitsView from './pages/dashboards/StudentUnitsView';
import StudentSettingsRedesign from './pages/settings/StudentSettingsRedesign';
import LecturerLiveSessionProjector from './pages/dashboards/LecturerLiveSessionProjector';
import InstallButton from './components/InstallButton';
import AdminFeedbackView from './pages/FeedbackPages/AdminFeedbackView';
import LecturerFeedbackView from './pages/FeedbackPages/LecturerFeedbackView';
import PastAttendance from './pages/dashboards/PastAttendance';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeAwareToasts } from './components/ThemeAwareToasts';
import SystemFeedbackList from './pages/admin/SystemFeedbackList';
import { ErrorBoundary } from './components';
import NetworkStatus from './components/NetworkStatus';
import { useEffect } from 'react';
import { message } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Super Admin imports
import SuperAdminLayout from './pages/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminDepartments from './pages/SuperAdmin/Departments';
import SuperAdminAdmins from './pages/SuperAdmin/SuperAdminAdmins';
import SuperAdminUsers from './pages/SuperAdmin/SuperAdminUsers';
import SuperAdminCourses from './pages/SuperAdmin/SuperAdminCourses';
import SuperAdminLogs from './pages/SuperAdmin/SuperAdminLogs';
import ComingSoon from './pages/SuperAdmin/ComingSoon';
import AdminLayout from './layouts/AdminLayout';
import DashboardLayout from './layouts/DashboardLayout';
// Utility pages
import VerifyEmailManually from './pages/VerifyEmailManually';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  // Add network connectivity check
  useEffect(() => {
    // Check network connectivity on load
    const checkNetwork = () => {
      if (!navigator.onLine) {
        message.warning({
          content: 'You are offline. Some features may not work correctly.',
          duration: 5,
        });
      }
    };

    checkNetwork();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <Router>
              {/* Important: ThemeAwareToasts must be before NetworkStatus to ensure toast handlers are registered first */}
              <ThemeAwareToasts />

              {/* NetworkStatus component for displaying banner notifications */}
              <NetworkStatus />

              <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
              />
              <InstallButton />

              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/request-access" element={<RequestAccess />} />
                <Route path="/how-to-get-access" element={<RequestAccess />} />
                <Route path="/auth/request-access" element={<RequestAccess />} />
                <Route path="/auth/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/auth/change-password" element={<ChangePassword />} />
                <Route path="/auth/reset-password" element={<ResetPasswordRequest />} />
                <Route path="/auth/reset-password/:token" element={<ResetPassword />} />

                {/* Utility pages */}
                <Route path="/verify-email-manually" element={<VerifyEmailManually />} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/401" element={<Unauthorized />} />
                <Route path="/403" element={<Forbidden />} />
                <Route path="/500" element={<ServerError />} />
                <Route path="/405" element={<MethodNotAllowed />} />
                <Route path="*" element={<NotFound />} />

                {/* Lecturer routes */}
                <Route element={<RoleGuard allowedRoles="lecturer" silent404={true} />}>
                  <Route path="/lecturer/session/:id" element={<LecturerLiveSessionProjector />} />
                  <Route element={<LecturerLayout />}>
                    <Route path="/lecturer-dashboard" element={<LecturerDashboardRedesign />} />
                    <Route path="/lecturer" element={<LecturerDashboardRedesign />} />
                    <Route path="/lecturer/dashboard" element={<LecturerDashboardRedesign />} />
                    <Route path="/lecturer/overview" element={<LecturerDashboardRedesign />} />
                    <Route path="/lecturer/sessions" element={<LecturerDashboard />} />
                    <Route path="/lecturer/profile" element={<LecturerProfile />} />
                    <Route path="/lecturer/settings" element={<LecturerSettings />} />
                    <Route path="/lecturer/feedback" element={<LecturerFeedbackView />} />
                    <Route path="/lecturer/analytics" element={<Analytics />} />
                    <Route path="/lecturer/past-attendance" element={<PastAttendance />} />
                  </Route>
                </Route>

                {/* Super Admin routes */}
                <Route element={<RoleGuard allowedRoles="super_admin" silent404={true} />}>
                  <Route path="/super-admin" element={<SuperAdminLayout />}>
                    <Route index element={<SuperAdminDashboard />} />
                    <Route path="departments" element={<SuperAdminDepartments />} />
                    <Route path="admins" element={<SuperAdminAdmins />} />
                    <Route path="users" element={<SuperAdminUsers />} />
                    <Route path="courses" element={<SuperAdminCourses />} />
                    <Route path="logs" element={<SuperAdminLogs />} />
                    <Route path="reports" element={<SuperAdminLogs />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="account" element={<AdminSettings />} />
                  </Route>
                </Route>

                {/* Admin routes with Persistent Collapsible Sidebar */}
                <Route element={<RoleGuard allowedRoles={["admin", "department_admin"]} silent404={true} />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminPanel />} />
                    <Route path="dashboard" element={<AdminPanel />} />
                    <Route path="manage-students" element={<ManageStudents />} />
                    <Route path="students" element={<ManageStudents />} />
                    <Route path="manage-courses" element={<ManageCourses />} />
                    <Route path="courses" element={<ManageCourses />} />
                    <Route path="manage-lecturers" element={<ManageLecturers />} />
                    <Route path="lecturers" element={<ManageLecturers />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="profile" element={<AdminProfile />} />
                    <Route path="feedback" element={<AdminFeedbackView />} />
                    <Route path="system-feedback" element={<SystemFeedbackList />} />
                  </Route>
                  <Route path="/department-admin" element={<Navigate to="/admin" replace />} />
                  <Route path="/department-admin/*" element={<Navigate to="/admin" replace />} />
                </Route>

                {/* Student routes with Redesigned Top-Navigation AppShell */}
                <Route element={<RoleGuard allowedRoles="student" silent404={true} />}>
                  <Route element={<StudentLayout />}>
                    <Route path="/student" element={<StudentTodayDashboard />} />
                    <Route path="/student-dashboard" element={<StudentTodayDashboard />} />
                    <Route path="/student/units" element={<StudentUnitsView />} />
                    <Route path="/student/my-units" element={<StudentUnitsView />} />
                    <Route path="/student/trends" element={<StudentTrendsView />} />
                    <Route path="/student/attendance-trends" element={<StudentTrendsView />} />
                    <Route path="/student/settings" element={<StudentSettingsRedesign />} />
                    <Route path="/student/profile" element={<StudentSettingsRedesign />} />
                  </Route>
                </Route>

                {/* Routes that only need authentication but no specific role */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/qr-scanner/:selectedUnit" element={<QRScanner />} />
                </Route>
              </Routes>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} export default App;