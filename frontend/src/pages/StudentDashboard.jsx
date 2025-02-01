import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentAttendance, getStudentUnits, getStudentProfile } from "../services/api";
import { FaEye, FaQrcode, FaUser, FaCalendarAlt, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Modal from 'react-modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Registering necessary components from Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Modal styles
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    padding: '20px',
  },
};

Modal.setAppElement('#root');

const StudentDashboard = () => {
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch student profile (if needed later)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getStudentProfile(token)
      .then((response) => {
        // You can use the profile data here if needed
        console.log("Profile Data:", response);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        setIsLoading(false);
      });
  }, []);

  // Fetch student units
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getStudentUnits(token)
      .then((response) => setUnits(response))
      .catch((error) => console.error("Error fetching units:", error));
  }, []);

  // Fetch attendance data for each unit
  useEffect(() => {
    if (units.length > 0) {
      units.forEach((unit) => {
        getStudentAttendance(unit._id)
          .then((response) => {
            console.log("Attendance Data for Unit:", unit._id, response.data); // Debugging
            setAttendanceData((prevData) => [...prevData, { unitId: unit._id, data: response.data }]);
          })
          .catch((error) => console.error("Error fetching attendance data:", error));
      });
    }
  }, [units]);

  // Calculate attendance rate for each unit
  const calculateAttendanceRate = useCallback((unitId) => {
    const unitData = attendanceData.find((data) => data.unitId === unitId);
    if (!unitData || unitData.data.length === 0) return 0;

    const attendedSessions = unitData.data.filter((attendance) => attendance.status === "Present").length;
    const totalSessions = unitData.data.length;
    return ((attendedSessions / totalSessions) * 100).toFixed(2);
  }, [attendanceData]);

  // Update attendance rates
  useEffect(() => {
    const rates = units.map((unit) => ({
      label: unit.name,
      value: calculateAttendanceRate(unit._id),
    }));
    setAttendanceRates(rates);
  }, [attendanceData, units, calculateAttendanceRate]);

  // Export attendance data as CSV
  const exportAttendanceData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + attendanceRates.map((rate) => `${rate.label},${rate.value}%`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_data.csv");
    document.body.appendChild(link);
    link.click();
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Navigate to View Profile
  const handleViewProfile = () => {
    navigate("/student/view-profile");
  };

  // Navigate to Settings
  const handleSettings = () => {
    navigate("/student/settings");
  };

  // Chart data for attendance rates
  const chartData = {
    labels: attendanceRates.map((rate) => rate.label),
    datasets: [
      {
        label: "Attendance Rate",
        data: attendanceRates.map((rate) => rate.value),
        backgroundColor: attendanceRates.map(rate => 
          rate.value >= 75 ? "rgba(0, 255, 0, 0.5)" : 
          rate.value >= 50 ? "rgba(255, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)"
        ),
        borderColor: attendanceRates.map(rate => 
          rate.value >= 75 ? "rgba(0, 255, 0, 1)" : 
          rate.value >= 50 ? "rgba(255, 255, 0, 1)" : "rgba(255, 0, 0, 1)"
        ),
        borderWidth: 1,
        hoverBackgroundColor: "rgba(75, 192, 192, 0.7)",
      },
    ],
  };

  // Low attendance units
  const lowAttendanceUnits = attendanceRates.filter((rate) => rate.value < 50);

  // Compact calendar/events list
  const renderCompactCalendar = () => {
    console.log("Attendance Data:", attendanceData); // Debugging
    const events = attendanceData.flatMap((unitData) =>
      unitData.data.map((attendance) => ({
        title: `${unitData.unitId} - ${attendance.status}`,
        date: new Date(attendance.date).toLocaleDateString(),
        status: attendance.status,
      }))
    );

    return (
      <div className="mt-4">
        <h3 className="text-center mb-3">
          <FaCalendarAlt /> Attendance Events
        </h3>
        {events.length > 0 ? (
          <div className="list-group">
            {events.map((event, index) => (
              <div key={index} className="list-group-item">
                <strong>{event.title}</strong> - {event.date} ({event.status})
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">No attendance events found.</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="container mt-5">
      {/* Header Section */}
      <div className="d-flex justify-content-center align-items-center mb-4 position-relative">
        <h1 className="text-center mb-0">Student Dashboard</h1>
        <div className="position-absolute end-0">
          <div className="dropdown">
            <button className="btn btn-primary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
              <FaUser />
            </button>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
              <li><button className="dropdown-item" onClick={handleViewProfile}><FaUser /> View Profile</button></li>
              <li><button className="dropdown-item" onClick={handleSettings}><FaCog /> Settings</button></li>
              <li><button className="dropdown-item" onClick={handleLogout}><FaSignOutAlt /> Logout</button></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Low Attendance Warning */}
      {lowAttendanceUnits.length > 0 && (
        <div className="alert alert-warning" role="alert">
          <strong>Warning:</strong> Your attendance is below 50% in the following units:
          <ul>
            {lowAttendanceUnits.map((unit) => (
              <li key={unit.label}>{unit.label}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Units Section */}
      <div className="row">
        {units.length > 0 ? (
          units.map((unit) => (
            <div key={unit._id} className="col-md-4 mb-4">
              <div className="card shadow-sm hover-shadow-lg" onClick={() => setSelectedUnit(unit)}>
                <div className="card-body">
                  <h5 className="card-title">{unit.name}</h5>
                  <p className="card-text">{unit.code}</p>
                  <div className="progress mb-3">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${calculateAttendanceRate(unit._id)}%` }}
                      aria-valuenow={calculateAttendanceRate(unit._id)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      {calculateAttendanceRate(unit._id)}%
                    </div>
                  </div>
                  <div className="d-flex justify-content-between">
                    <button
                      className="btn btn-outline-primary transition-all mb-2 mx-2"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapseAttendance-${unit._id}`}
                    >
                      <FaEye /> View Attendance Rate
                    </button>
                    <button
                      className="btn btn-outline-success transition-all mb-2"
                      onClick={() => navigate(`/qr-scanner/${unit._id}`)}
                    >
                      <FaQrcode /> Mark Attendance
                    </button>
                  </div>
                  <div id={`collapseAttendance-${unit._id}`} className="collapse">
                    <p>Attendance Rate: {attendanceData.length > 0 ? calculateAttendanceRate(unit._id) + "%" : "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No units found for your course, year, and semester.</p>
        )}
      </div>

      {/* Compact Calendar/Events List */}
      {renderCompactCalendar()}

      {/* Overall Attendance Rates Chart */}
      <div className="mt-5">
        <h3 className="text-center">Overall Attendance Rates</h3>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Export Attendance Data */}
      <button className="btn btn-secondary mb-4" onClick={exportAttendanceData}>
        Export Attendance Data
      </button>

      {/* Unit Details Modal */}
      <Modal
        isOpen={!!selectedUnit}
        onRequestClose={() => setSelectedUnit(null)}
        style={customStyles}
      >
        {selectedUnit && (
          <div>
            <h2>{selectedUnit.name}</h2>
            <p><strong>Code:</strong> {selectedUnit.code}</p>
            <p><strong>Lecturer:</strong> {selectedUnit.lecturer}</p>
            <p><strong>Description:</strong> {selectedUnit.description}</p>
            <button className="btn btn-secondary mt-3" onClick={() => setSelectedUnit(null)}>
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentDashboard;