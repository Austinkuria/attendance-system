import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Login from './pages/AuthenticationPages/Login';
import Signup from './pages/AuthenticationPages/Signup';
import VerifyEmail from './pages/AuthenticationPages/VerifyEmail';
import ChangePassword from './pages/AuthenticationPages/ChangePassword';
import Dashboard from './pages/Dashboard';
import LecturerDashboard from './pages/dashboards/LecturerDashboard';
import AdminPanel from './pages/dashboards/AdminPanel';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import ManageStudents from './pages/Management/ManageStudents';
import ManageCourses from './pages/Management/ManageCourses';
import ManageLecturers from './pages/Management/ManageLecturers';
import StudentProfile from './pages/profiles/StudentProfile';
import 'bootstrap/dist/css/bootstrap.min.css';
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
import StudentSettings from './pages/settings/StudentSettings';
import ResetPasswordRequest from './pages/AuthenticationPages/ResetPasswordRequest';
import ResetPassword from './pages/AuthenticationPages/ResetPassword';
import InstallButton from './components/InstallButton';
import AttendanceTrends from './pages/dashboards/AttendanceTrends';
import AdminFeedbackView from './pages/FeedbackPages/AdminFeedbackView';
import LecturerFeedbackView from './pages/FeedbackPages/LecturerFeedbackView';
import PastAttendance from './pages/dashboards/PastAttendance';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeAwareToasts } from './components/ThemeAwareToasts';
import SystemFeedbackList from './pages/admin/SystemFeedbackList';
import SystemFeedbackButton from './components/SystemFeedback/SystemFeedbackButton';
import { ErrorBoundary } from './components';
import NetworkStatus from './components/NetworkStatus';
import { useEffect } from 'react';
import { message } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Super Admin imports
import SuperAdminLayout from './pages/SuperAdmin/SuperAdminLayout';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminDepartments from './pages/SuperAdmin/Departments';

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

              {/* Add the feedback button globally so it appears on all pages */}
              <SystemFeedbackButton />

              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/auth/change-password" element={<ChangePassword />} />
                <Route path="/auth/reset-password" element={<ResetPasswordRequest />} />
                <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/401" element={<Unauthorized />} />
                <Route path="/403" element={<Forbidden />} />
                <Route path="/500" element={<ServerError />} />
                <Route path="/405" element={<MethodNotAllowed />} />
                <Route path="*" element={<NotFound />} />

                {/* Lecturer routes */}
                <Route element={<RoleGuard allowedRoles="lecturer" redirectTo="/auth/login" />}>
                  <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
                  <Route path="/lecturer/profile" element={<LecturerProfile />} />
                  <Route path="/lecturer/settings" element={<LecturerSettings />} />
                  <Route path="/lecturer/feedback" element={<LecturerFeedbackView />} />
                  <Route path="/lecturer/analytics" element={<Analytics />} />
                  <Route path="/lecturer/past-attendance" element={<PastAttendance />} />
                </Route>

                {/* Super Admin routes */}
                <Route element={<RoleGuard allowedRoles="super_admin" redirectTo="/auth/login" />}>
                  <Route path="/super-admin" element={<SuperAdminLayout />}>
                    <Route index element={<SuperAdminDashboard />} />
                    <Route path="departments" element={<SuperAdminDepartments />} />
                  </Route>
                </Route>

                {/* Admin routes */}
                <Route element={<RoleGuard allowedRoles="admin" redirectTo="/auth/login" />}>
                  <Route path="/admin" element={<AdminPanel />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/manage-students" element={<ManageStudents />} />
                  <Route path="/admin/profile" element={<AdminProfile />} />
                  <Route path="/admin/manage-courses" element={<ManageCourses />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/feedback" element={<AdminFeedbackView />} />
                  <Route path="/admin/manage-lecturers" element={<ManageLecturers />} />
                  <Route path="/admin/system-feedback" element={<SystemFeedbackList />} />
                </Route>

                {/* Student routes */}
                <Route element={<RoleGuard allowedRoles="student" redirectTo="/auth/login" />}>
                  <Route path="/student-dashboard" element={<StudentDashboard />} />
                  <Route path="/student/profile" element={<StudentProfile />} />
                  <Route path="/student/attendance-trends" element={<AttendanceTrends />} />
                  <Route path="/student/settings" element={<StudentSettings />} />
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