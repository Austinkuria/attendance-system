// StudentDashboard.jsx
import { useState, useEffect } from "react";
import { getStudentAttendance, getStudentUnits } from "../services/api";
import AttendanceTable from "../components/AttendanceTable";
import ErrorBoundary from "../components/ErrorBoundary";
const StudentDashboard = () => {
  const [units, setUnits] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      return;
    }
  
    getStudentUnits(token)
      .then((response) => {
        if (Array.isArray(response)) {
          setUnits(response);
        } else {
          console.error("Expected an array but got:", response);
        }
      })
      .catch((error) => console.error("Error fetching units:", error));
  }, []);
  

  const handleUnitSelection = (unitId) => {
    setSelectedUnit(unitId);
    // Fetch attendance data for the selected unit
    getStudentAttendance(unitId)
      .then((response) => setAttendanceData(response.data))
      .catch((error) => console.error("Error fetching attendance data:", error));
  };

  return (
    <div>
      <h1>Student Dashboard</h1>
      <div>
        <h3>Select a Unit</h3>
        <ul>
          {units && units.length > 0 ? (
            units.map((unit) => (
              <li key={unit._id} onClick={() => handleUnitSelection(unit._id)}>
                {unit.name}
              </li>
            ))
          ) : (
            <p>No units found for your course, year, and semester.</p>
          )}
        </ul>
      </div>

      {selectedUnit && (
        <>
          <h3>Attendance for {units.find(unit => unit._id === selectedUnit)?.name}</h3>
          <AttendanceTable data={attendanceData} />
        </>
      )}
    </div>
  );
};

// Wrap StudentDashboard in ErrorBoundary
const StudentDashboardWithBoundary = () => (
  <ErrorBoundary>
    <StudentDashboard />
  </ErrorBoundary>
);

export default StudentDashboardWithBoundary;
