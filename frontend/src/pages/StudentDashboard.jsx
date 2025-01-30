import { useState, useEffect, useCallback } from "react";
import { getStudentAttendance, getStudentUnits } from "../services/api";
import { FaEye, FaQrcode } from 'react-icons/fa'; 
import 'bootstrap/dist/css/bootstrap.min.css'; 
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registering necessary components from Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StudentDashboard = () => {
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getStudentUnits(token)
      .then((response) => setUnits(response))
      .catch((error) => console.error("Error fetching units:", error));
  }, []);

  useEffect(() => {
    if (units.length > 0) {
      units.forEach((unit) => {
        getStudentAttendance(unit._id)
          .then((response) => {
            setAttendanceData((prevData) => [...prevData, { unitId: unit._id, data: response.data }]);
          })
          .catch((error) => console.error("Error fetching attendance data:", error));
      });
    }
  }, [units]);

  const calculateAttendanceRate = useCallback((unitId) => {
    const unitData = attendanceData.find((data) => data.unitId === unitId);
    if (!unitData || unitData.data.length === 0) return 0;

    const attendedSessions = unitData.data.filter((attendance) => attendance.status === "Present").length;
    const totalSessions = unitData.data.length;
    return ((attendedSessions / totalSessions) * 100).toFixed(2);
  }, [attendanceData]);

  useEffect(() => {
    const rates = units.map((unit) => ({
      label: unit.name,
      value: calculateAttendanceRate(unit._id),
    }));
    setAttendanceRates(rates);
  }, [attendanceData, units, calculateAttendanceRate]);

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

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Student Dashboard</h1>
      <div className="row">
        {units.length > 0 ? (
          units.map((unit) => (
            <div key={unit._id} className="col-md-4 mb-4">
              <div className="card shadow-sm hover-shadow-lg">
                <div className="card-body">
                  <h5 className="card-title">{unit.name}</h5>
                  <p className="card-text">{unit.code}</p>
                  <div className="d-flex justify-content-between">
                    <button
                      className="btn btn-outline-primary transition-all"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapseAttendance-${unit._id}`}
                    >
                      <FaEye /> View Attendance Rate
                    </button>
                    <button
                      className="btn btn-outline-success transition-all ms-2"
                      onClick={() => window.location.href = `/qr-scanner/${unit._id}`}
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

      <div className="mt-5">
        <h3 className="text-center">Overall Attendance Rates</h3>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
