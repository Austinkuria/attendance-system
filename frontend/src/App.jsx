import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
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
import 'bootstrap/dist/css/bootstrap.min.css';
import InstallButton from './InstallButton';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online", { autoClose: 3000 });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline. Some features may not work.", { autoClose: 3000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <Router>
      <ToastContainer />
      <InstallButton />
      {/* Subtle Online/Offline Banner */}
      <div
        style={{
          background: isOnline ? "#d4edda" : "#f8d7da",
          color: isOnline ? "#155724" : "#721c24",
          textAlign: "center",
          padding: "8px",
          fontSize: "14px",
        }}
      >
        {isOnline ? "Connected to the internet" : "You're offline. Some features may be limited."}
      </div>

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
      </Routes>
    </Router>
  );
}

export default App;
