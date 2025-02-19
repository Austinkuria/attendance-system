import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState, useCallback } from "react"; 
import { ToastContainer, toast } from "react-toastify";
import { IoCloseCircleOutline } from "react-icons/io5";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import LecturerDashboard from "./pages/dashboards/LecturerDashboard";
import AdminPanel from "./pages/dashboards/AdminPanel";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import ManageStudents from "./pages/ManageStudents";
import ManageCourses from "./pages/ManageCourses";
import ManageLecturers from "./pages/ManageLecturers";
import StudentProfile from "./pages/profiles/StudentProfile";
import 'bootstrap/dist/css/bootstrap.min.css';
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
import AdminProfile from "./pages/profiles/AdminProfile";
import LecturerProfile from "./pages/profiles/LecturerProfile";
import LecturerSettings from "./pages/settings/LecturerSettings";
import AdminSettings from "./pages/settings/AdminSettings";
import StudentSettings from "./pages/settings/StudentSettings";
import ResetPasswordRequest from "./pages/ResetPasswordRequest";
import ResetPassword from "./pages/ResetPassword";
import InstallButton from './components/InstallButton';
import { register } from './serviceWorkerRegistration';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [data, setData] = useState(null);
  const [isFetching, setIsFetching] = useState(false); 

  const fetchData = useCallback(async () => {
    if (isFetching || !isOnline) return; 

    setIsFetching(true);
    try {
      const response = await fetch('https://attendance-system-w70n.onrender.com/api/data');
      if (!response.ok) throw new Error('Network response was not ok');
      const newData = await response.json();
      setData(newData);
      console.log('Data fetched:', newData);
      toast.success('Data synced successfully');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to sync data. Retrying when online.');
    } finally {
      setIsFetching(false);
    }
  }, [isOnline, isFetching]); 

  useEffect(() => {
    let registration;

    const handleRegistration = async () => {
      registration = await register({
        onUpdate: (reg) => {
          if (reg.waiting) {
            toast.info('A new version is available. Click to refresh.', {
              onClick: () => {
                if (reg.waiting) {
                  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload(); 
                }
              },
            });
          }
        },
        onSuccess: () => toast.success('App is ready for offline use.'),
      });

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'online') {
            setIsOnline(true);
            toast.success("Back online, syncing data...", { autoClose: 3000 });
            fetchData();
          } else if (event.data.type === 'offline') {
            setIsOnline(false);
            toast.error("You're offline. Some features may not work.", { autoClose: 3000 });
            setShowBanner(true);
          }
        });

        // Ask service worker to check connectivity
        navigator.serviceWorker.controller?.postMessage({ action: 'checkConnectivity' });
      }
    };

    handleRegistration();

    return () => {
      if (registration) registration.unregister(); 
    };
  }, [fetchData]); 

  useEffect(() => {
    let onlineTimer;

    const handleOnline = () => {
      clearTimeout(onlineTimer);
      setIsOnline(true);
      toast.success("You're back online. Syncing data...", { autoClose: 3000 });
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
      fetchData(); 

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({ type: 'online' });
      }
    };

    const handleOffline = () => {
      onlineTimer = setTimeout(() => {
        setIsOnline(false);
        toast.error("You're offline. Some features may not work.", { autoClose: 3000 });
        setShowBanner(true);

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.controller?.postMessage({ type: 'offline' });
        }
      }, 1000); // Debounce to avoid false positives
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(onlineTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchData]); 

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  return (
    <Router>
      <ToastContainer />
      <BackToTop />
      <InstallButton />

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

      <div style={{ paddingTop: showBanner ? "40px" : "0" }}>
        <Routes>
          <Route path="/" element={<Home data={data} />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/reset-password" element={<ResetPasswordRequest />} />
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard data={data} />} />
          <Route path="/401" element={<Unauthorized />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          <Route path="/405" element={<MethodNotAllowed />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/lecturer-dashboard" element={<ProtectedRoute><LecturerDashboard data={data} /></ProtectedRoute>} />
          <Route path="/lecturer/profile" element={<ProtectedRoute><LecturerProfile /></ProtectedRoute>} />
          <Route path="/lecturer/settings" element={<ProtectedRoute><LecturerSettings /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel data={data} /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard data={data} /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/settings" element={<ProtectedRoute><StudentSettings /></ProtectedRoute>} />
          <Route path="/admin/manage-students" element={<ProtectedRoute><ManageStudents data={data} /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
          <Route path="/admin/manage-courses" element={<ProtectedRoute><ManageCourses data={data} /></ProtectedRoute>} />
          <Route path="/admin/manage-lecturers" element={<ProtectedRoute><ManageLecturers data={data} /></ProtectedRoute>} />
          <Route path="/lecturer/attendance" element={<ProtectedRoute><AttendanceManagement data={data} /></ProtectedRoute>} />
          <Route path="/lecturer/analytics" element={<ProtectedRoute><Analytics data={data} /></ProtectedRoute>} />
          <Route path="/lecturer/quizzes" element={<ProtectedRoute><QuizPage data={data} /></ProtectedRoute>} />
          <Route path="/qr-scanner/:unitId" element={<ProtectedRoute><QRScanner data={data} /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;