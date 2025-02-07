import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { IoCloseCircleOutline } from "react-icons/io5";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import AdminPanel from "./pages/AdminPanel";
import StudentDashboard from "./pages/StudentDashboard";
import ManageStudents from "./pages/ManageStudents";
import ManageCourses from "./pages/ManageCourses";
import ManageLecturers from "./pages/ManageLecturers";
import 'bootstrap/dist/css/bootstrap.min.css';
import InstallButton from './components/InstallButton';
import BackToTop from "./components/BackToTop";
import AttendanceManagement from "./components/AttendanceManagement";
import Analytics from "./pages/Analytics";
import QuizPage from "./pages/QuizPage";
import ProtectedRoute from "./components/ProtectedRoute";
import QRScanner from "./components/QRScanner";
import NotFound from "./pages/ErrorPages/NotFound";
import Forbidden from "./pages/ErrorPages/Forbidden";
import ServerError from "./pages/ErrorPages/ServerError";
import MethodNotAllowed from "./pages/ErrorPages/MethodNotAllowed";
import Unauthorized from "./pages/ErrorPages/Unauthorized";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Initialize showBanner to true if online (to display banner on first load) or false otherwise.
  const [showBanner, setShowBanner] = useState(false);

  // Effect to auto-hide the banner on initial load if online.
  useEffect(() => {
    if (navigator.onLine) {
      setTimeout(() => {
        setShowBanner(false);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online", { autoClose: 3000 });
      setShowBanner(true);
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline. Some features may not work.", { autoClose: 3000 });
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <Router>
      <ToastContainer />
      <InstallButton />
      <BackToTop />

      {/* Connectivity Banner */}
      {showBanner && (
        <div
          style={{
            background: isOnline ? "#d4edda" : "#f8d7da",
            color: isOnline ? "#155724" : "#721c24",
            padding: "6px",
            fontSize: "13px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "fixed",
            top: 0,
            width: "100%",
            zIndex: 1000,
            fontWeight: "bold",
            boxSizing: "border-box",
          }}
        >
          <span>
            {isOnline
              ? "Connected to the internet"
              : "You're offline. Some features may be limited."}
          </span>
          <IoCloseCircleOutline
            onClick={handleCloseBanner}
            style={{
              marginLeft: "10px",
              fontSize: "18px",
              cursor: "pointer",
              color: isOnline ? "#155724" : "#721c24",
            }}
          />
        </div>
      )}

      {/* Add padding to main content to avoid being hidden behind the banner */}
      <div style={{ paddingTop: showBanner ? "40px" : "0" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* error routes */}
          <Route path="*" element={<NotFound />} />
          <Route path="/401" element={<Unauthorized />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="/405" element={<MethodNotAllowed />} />  
          {/* end */}
          <Route path="/lecturer-dashboard" element={<ProtectedRoute><LecturerDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
          <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/admin/manage-students" element={<ProtectedRoute><ManageStudents /></ProtectedRoute>} />
          <Route path="/admin/manage-courses" element={<ProtectedRoute><ManageCourses /></ProtectedRoute>} />
          <Route path="/admin/manage-lecturers" element={<ProtectedRoute><ManageLecturers /></ProtectedRoute>} />
          <Route path="/lecturer/attendance" element={<ProtectedRoute><AttendanceManagement /></ProtectedRoute>} />
          <Route path="/lecturer/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="lecturer/quizzes" element= {<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/qr-scanner/:unitId" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
