import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { IoCloseCircleOutline } from 'react-icons/io5';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Login from './pages/AuthenticationPages/Login';
import Signup from './pages/AuthenticationPages/Signup';
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
import { ThemeAwareToasts } from './components/ThemeAwareToasts';
import SystemFeedbackList from './pages/admin/SystemFeedbackList';
import SystemFeedbackButton from './components/SystemFeedback/SystemFeedbackButton';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (navigator.onLine) {
      setTimeout(() => setShowBanner(false), 1000);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online", { autoClose: 3000 });
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline. Some features may not work.", { autoClose: 3000 });
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCloseBanner = () => setShowBanner(false);

  return (
    <ThemeProvider>
      <Router>
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
        />
        <InstallButton />
        <ThemeAwareToasts />

        {/* Add the feedback button globally so it appears on all pages */}
        <SystemFeedbackButton />

        {showBanner && (
          <div
            style={{
              background: isOnline ? '#d4edda' : '#f8d7da',
              color: isOnline ? '#155724' : '#721c24',
              padding: '6px',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'fixed',
              top: 0,
              width: '100%',
              zIndex: 10000,
              fontWeight: 'bold',
              boxSizing: 'border-box',
            }}
          >
            <span>
              {isOnline
                ? 'Connected to the internet'
                : "You're offline. Some features may be limited."}
            </span>
            <IoCloseCircleOutline
              onClick={handleCloseBanner}
              style={{
                marginLeft: '10px',
                fontSize: '18px',
                cursor: 'pointer',
                color: isOnline ? '#155724' : '#721c24',
              }}
            />
          </div>
        )}

        <div style={{ paddingTop: showBanner ? '40px' : '0' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
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
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;