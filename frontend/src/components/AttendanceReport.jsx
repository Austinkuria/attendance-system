import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const AttendanceReport = ({ unitId }) => {
  const [attendanceData, setAttendanceData] = useState([]);

  // Fetch attendance data based on the unitId
  useEffect(() => {
    // This is a mock API call for demonstration purposes.
    // Replace with actual API call to fetch attendance data.
    const fetchAttendanceData = async () => {
      try {
        // Replace with real API call
        const response = await fetch(`/api/attendance/${unitId}`);
        const data = await response.json();
        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    if (unitId) {
      fetchAttendanceData();
    }
  }, [unitId]);

  return (
    <div>
      <h2>Attendance Report for Unit: {unitId}</h2>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Attendance Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.length > 0 ? (
            attendanceData.map((attendance) => (
              <tr key={attendance.studentId}>
                <td>{attendance.studentId}</td>
                <td>{attendance.status}</td>
                <td>{attendance.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No attendance data available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

AttendanceReport.propTypes = {
  unitId: PropTypes.string.isRequired, // unitId passed as prop to fetch attendance data
};

export default AttendanceReport;
