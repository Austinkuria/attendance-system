import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import RoleGuard from './components/RoleGuard';

// Authentication Pages
import Login from './pages/AuthenticationPages/Login';
import Signup from './pages/AuthenticationPages/Signup';
import ResetPassword from './pages/AuthenticationPages/ResetPassword';

// Student Pages
import StudentDashboard from './pages/StudentPages/StudentDashboard';
import AttendanceScanner from './pages/StudentPages/AttendanceScanner';
import StudentProfile from './pages/StudentPages/StudentProfile';
import StudentAttendanceHistory from './pages/StudentPages/StudentAttendanceHistory';

// Lecturer Pages
import LecturerDashboard from './pages/LecturerPages/LecturerDashboard';
import LecturerProfile from './pages/LecturerPages/LecturerProfile';
import ManageSessions from './pages/LecturerPages/ManageSessions';
import SessionDetails from './pages/LecturerPages/SessionDetails';
import AttendanceManagement from './pages/LecturerPages/AttendanceManagement';

// Admin Pages
import AdminDashboard from './pages/AdminPages/AdminDashboard';
import ManageStudents from './pages/AdminPages/ManageStudents';
import ManageLecturers from './pages/AdminPages/ManageLecturers';
import ManageUnits from './pages/AdminPages/ManageUnits';

// Shared Pages
import PageNotFound from './pages/PageNotFound';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth">
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          {/* Student Routes */}
          <Route element={<RoleGuard allowedRoles="student" />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/scan-attendance/:sessionId?" element={<AttendanceScanner />} />
            <Route path="/student-profile" element={<StudentProfile />} />
            <Route path="/attendance-history" element={<StudentAttendanceHistory />} />
          </Route>

          {/* Lecturer Routes */}
          <Route element={<RoleGuard allowedRoles="lecturer" />}>
            <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
            <Route path="/lecturer-profile" element={<LecturerProfile />} />
            <Route path="/manage-sessions" element={<ManageSessions />} />
            <Route path="/session/:id" element={<SessionDetails />} />
            <Route path="/attendance-management" element={<AttendanceManagement />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<RoleGuard allowedRoles="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/manage-students" element={<ManageStudents />} />
            <Route path="/manage-lecturers" element={<ManageLecturers />} />
            <Route path="/manage-units" element={<ManageUnits />} />
          </Route>

          {/* Redirect routes */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;