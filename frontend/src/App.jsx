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
import InstallButton from './InstallButton';
import BackToTop from "./components/BackToTop";
import AttendanceManagement from "./components/AttendanceManagement";
import Analytics from "./pages/Analytics";
import QuizPage from "./pages/QuizPage";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Initialize showBanner to true if online (to display banner on first load) or false otherwise.
  const [showBanner, setShowBanner] = useState(navigator.onLine);

  // Effect to auto-hide the banner on initial load if online.
  useEffect(() => {
    if (navigator.onLine) {
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/admin/manage-students" element={<ManageStudents />} />
          <Route path="/admin/manage-courses" element={<ManageCourses />} />
          <Route path="/admin/manage-lecturers" element={<ManageLecturers />} />
          <Route path="/lecturer/attendance" element={<AttendanceManagement />} />
          <Route path="/lecturer/analytics" element={<Analytics />} />
          <Route path="/quizzes" element={<QuizPage/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
