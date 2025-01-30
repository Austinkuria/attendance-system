import { useState, useEffect } from "react";
import { FaFileImport, FaDownload, FaSearch, FaUserPlus } from "react-icons/fa";
import { getStudents, deleteStudent, importStudents, downloadStudents } from "../services/api";

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({ regNo: "", year: "", course: "", semester: "" });

  // Fetch students from the API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await getStudents(); // Call API to fetch students
        setStudents(response.data); // Set students to state
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []); // Fetch students only once when component mounts

  // Handle Delete
  const handleDelete = async (studentId) => {
    try {
      await deleteStudent(studentId);
      setStudents(students.filter((student) => student._id !== studentId));
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((student) => {
    return (
      (student.regNo || '').includes(filter.regNo) &&
      (student.year || '').includes(filter.year) &&
      (student.course || '').includes(filter.course) &&
      (student.semester || '').includes(filter.semester) &&
      (student.name || '').toLowerCase().includes(searchQuery.toLowerCase()) // Added search functionality
    );
  });

  return (
    <div className="container mt-4">
      <h2>Manage Students</h2>

      {/* Import & Export */}
      <div className="mb-3 d-flex gap-2">
        <button className="btn btn-success" onClick={() => importStudents()}>
          <FaFileImport /> Import Students
        </button>
        <button className="btn btn-primary" onClick={() => downloadStudents()}>
          <FaDownload /> Download Students
        </button>
        <button className="btn btn-secondary" onClick={() => alert("Add Student Form")}>
          <FaUserPlus /> Add Student
        </button>
      </div>

      {/* Search & Filter */}
      <div className="row mb-3">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Reg No"
            onChange={(e) => setFilter({ ...filter, regNo: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Year"
            onChange={(e) => setFilter({ ...filter, year: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Course"
            onChange={(e) => setFilter({ ...filter, course: e.target.value })}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Semester"
            onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <button className="btn btn-info">
            <FaSearch /> Search
          </button>
        </div>
      </div>

      {/* Student Table */}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Reg No</th>
            <th>Name</th>
            <th>Year</th>
            <th>Course</th>
            <th>Semester</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student._id}>
              <td>{student.regNo}</td>
              <td>{student.name}</td>
              <td>{student.year}</td>
              <td>{student.course}</td>
              <td>{student.semester}</td>
              <td>
                <button className="btn btn-warning btn-sm me-2" onClick={() => alert("Edit Student")}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(student._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageStudents;
