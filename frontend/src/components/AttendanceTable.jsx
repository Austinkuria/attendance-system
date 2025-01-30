
import PropTypes from 'prop-types';

const AttendanceTable = ({ data }) => {
  return (
    <div>
      <h3>Attendance Data</h3>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.map((attendance) => (
            <tr key={attendance._id}>
              <td>{attendance.studentName}</td>
              <td>{attendance.status}</td>
              <td>{attendance.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

AttendanceTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      studentName: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default AttendanceTable;
