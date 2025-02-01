import { useState, useEffect } from "react";
import { getLecturerUnits, getAttendanceData } from "../services/api";
import QRCodeGenerator from "../components/QRCodeGenerator";
import AttendanceTable from "../components/AttendanceTable";
import { Card, Button, Spinner } from "react-bootstrap";

const LecturerDashboard = () => {
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLecturerUnits()
      .then((response) => setUnits(response.data))
      .catch((error) => console.log("Error fetching units:", error));
  }, []);

  const handleUnitSelection = (unitId) => {
    setSelectedUnit(unitId);
    setLoading(true);
    getAttendanceData(unitId)
      .then((response) => setAttendanceData(response.data))
      .catch((error) => console.log("Error fetching attendance data:", error))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>

      {/* Unit Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Select a Course Unit</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {units.map((unit) => (
            <Button
              key={unit._id}
              onClick={() => handleUnitSelection(unit._id)}
              className="p-3 rounded-lg shadow-md bg-blue-600 text-white hover:bg-blue-700"
            >
              {unit.name} ({unit.course} - Sem {unit.semester})
            </Button>
          ))}
        </div>
      </div>

      {/* Attendance & QR Code Section */}
      {selectedUnit && (
        <Card className="p-4 shadow-lg rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Attendance for Selected Unit</h2>
          {loading ? (
            <Spinner animation="border" variant="primary" />
          ) : (
            <>
              <QRCodeGenerator unitId={selectedUnit} />
              <AttendanceTable data={attendanceData} />
              <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg">
                Download Attendance Report
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default LecturerDashboard;
