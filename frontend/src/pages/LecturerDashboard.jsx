import { useState, useEffect } from "react";
import { getLecturerUnits, getAttendanceData } from "../services/api";
import QRCodeGenerator from "../components/QRCodeGenerator";
import AttendanceTable from "../components/AttendanceTable";

const LecturerDashboard = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);

  useEffect(() => {
    getLecturerUnits()
      .then((response) => setUnits(response.data))
      .catch((error) => console.log("Error fetching units:", error));
  }, []);

  const handleUnitSelection = (unitId) => {
    setSelectedUnit(unitId);
    // Fetch attendance data for the selected unit
    // Assume there's an API endpoint for this
    getAttendanceData(unitId)
      .then((response) => setAttendanceData(response.data))
      .catch((error) => console.log("Error fetching attendance data:", error));
  };

  return (
    <div>
      <h1>Lecturer Dashboard</h1>
      <div>
        <h3>Select a Unit</h3>
        <ul>
          {units.map((unit) => (
            <li key={unit._id} onClick={() => handleUnitSelection(unit._id)}>
              {unit.name}
            </li>
          ))}
        </ul>
      </div>

      {selectedUnit && (
        <>
          <QRCodeGenerator unitId={selectedUnit} />
          <AttendanceTable data={attendanceData} />
        </>
      )}
    </div>
  );
};

export default LecturerDashboard;
