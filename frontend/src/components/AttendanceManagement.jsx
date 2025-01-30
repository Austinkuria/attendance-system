// import { useState, useEffect } from 'react';
// import { getAttendance, markAttendance } from '../services/api';

// const AttendanceManagement = () => {
//   const [attendance, setAttendance] = useState([]);
//   const [studentId, setStudentId] = useState('');
//   const [unitId, setUnitId] = useState('');
//   const [status, setStatus] = useState('Present');

//   useEffect(() => {
//     getAttendance().then(response => setAttendance(response.data));
//   }, []);

//   const handleMarkAttendance = () => {
//     markAttendance({ studentId, unitId, status }).then(response => {
//       setAttendance([...attendance, response.data]);
//     });
//   };

//   return (
//     <div>
//       <h3>Manage Attendance</h3>
//       <div>
//         <input
//           type="text"
//           placeholder="Student ID"
//           value={studentId}
//           onChange={(e) => setStudentId(e.target.value)}
//         />
//         <input
//           type="text"
//           placeholder="Unit ID"
//           value={unitId}
//           onChange={(e) => setUnitId(e.target.value)}
//         />
//         <select value={status} onChange={(e) => setStatus(e.target.value)}>
//           <option value="Present">Present</option>
//           <option value="Absent">Absent</option>
//         </select>
//         <button onClick={handleMarkAttendance}>Mark Attendance</button>
//       </div>
//       <ul>
//         {attendance.map((att, idx) => (
//           <li key={idx}>
//             Student ID: {att.studentId}, Unit ID: {att.unitId}, Status: {att.status}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default AttendanceManagement;
