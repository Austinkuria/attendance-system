import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import AdminPanel from "./pages/AdminPanel";
import StudentDashboard from "./pages/StudentDashboard";  // Import Student Dashboard

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lecturer-dashboard" element={<LecturerDashboard />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} /> {/* Add Student Dashboard Route */}
      </Routes>
    </Router>
  );
}

export default App;
