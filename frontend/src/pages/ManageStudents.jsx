import { useState, useEffect } from "react";
import { 
  FaFileImport, 
  FaDownload, 
  FaSearch, 
  FaUserPlus,
  FaSpinner,
  FaExclamationTriangle,
  FaUsers
} from "react-icons/fa";
import { 
  getStudents, 
  deleteStudent, 
  importStudents, 
  downloadStudents 
} from "../services/api";

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({ 
    regNo: "", 
    year: "", 
    course: "", 
    semester: "" 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        const response = await getStudents();
        const data = Array.isArray(response) ? response : [];
        
        if (isMounted) {
          const formattedStudents = data.map(student => ({
            ...student,
            regNo: student.regNo || 'N/A',
            year: student.year || 'N/A',
            semester: student.semester?.toString() || 'N/A',
            // Add population of course name here
            course: student.course?.name || 'N/A'
          }));
          setStudents(formattedStudents);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load student data. Please try again later.");
          setStudents([]);
          console.error("Fetch error:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchStudents();
    return () => { isMounted = false };
  }, []);

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s._id !== studentId));
    } catch (err) {
      setError('Failed to delete student. Please check your permissions.');
      console.error("Delete error:", err);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file?.type === 'text/csv') {
      setFile(file);
    } else {
      setError('Invalid file type. Please upload a CSV file.');
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    try {
      setLoading(true);
      await importStudents(file);
      const updated = await getStudents();
      setStudents(updated.map(s => ({
        ...s,
        regNo: s.regNo || 'N/A',
        year: s.year || 'N/A',
        semester: s.semester?.toString() || 'N/A',
        course: s.course?.name || s.course || 'N/A'
      })));
      setFile(null);
      setError("");
    } catch (err) {
      setError('CSV import failed. Please check file format and try again.');
      console.error("Import error:", err);
    } finally {
      setLoading(false);
    }
  };

  
  const filteredStudents = students.filter(student => {
    const searchLower = searchQuery.toLowerCase().trim();
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    
    return (
      fullName.includes(searchLower) &&
      student.regNo.toLowerCase().includes(filter.regNo.toLowerCase()) &&
      student.year.toLowerCase().includes(filter.year.toLowerCase()) &&
      student.course.toLowerCase().includes(filter.course.toLowerCase()) &&
      student.semester.toLowerCase().includes(filter.semester.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <FaSpinner className="fa-spin me-2" />
        Loading student records...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <FaExclamationTriangle className="me-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">
        <FaUsers className="me-2" />
        Student Management
      </h2>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <input
                type="text"
                className="form-control"
                placeholder="Registration No"
                value={filter.regNo}
                onChange={(e) => setFilter(prev => ({ ...prev, regNo: e.target.value }))}
              />
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <select
                className="form-select"
                value={filter.year}
                onChange={(e) => setFilter(prev => ({ ...prev, year: e.target.value }))}
              >
                <option value="">All Years</option>
                {['1', '2', '3', '4'].map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <input
                type="text"
                className="form-control"
                placeholder="Course"
                value={filter.course}
                onChange={(e) => setFilter(prev => ({ ...prev, course: e.target.value }))}
              />
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <select
                className="form-select"
                value={filter.semester}
                onChange={(e) => setFilter(prev => ({ ...prev, semester: e.target.value }))}
              >
                <option value="">All Semesters</option>
                {['1', '2', '3'].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mt-3 g-2">
            <div className="col-12 col-md-4">
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  accept=".csv"
                  onChange={handleFileUpload}
                />
                <button 
                  className="btn btn-success" 
                  onClick={handleImport}
                  disabled={!file}
                >
                  <FaFileImport className="me-2" />
                  {file ? `Import ${file.name}` : "Select CSV"}
                </button>
              </div>
            </div>

            <div className="col-6 col-md-4">
              <button 
                className="btn btn-primary w-100"
                onClick={downloadStudents}
              >
                <FaDownload className="me-2" />
                Export CSV
              </button>
            </div>

            <div className="col-6 col-md-4">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => alert("New student form coming soon!")}
              >
                <FaUserPlus className="me-2" />
                Add Student
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive rounded-3 shadow-sm">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Reg No</th>
              <th>Student Name</th>
              <th>Year</th>
              <th>Course</th>
              <th>Semester</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <tr key={student._id}>
                  <td className="fw-semibold">{student.regNo}</td>
                  <td>{`${student.firstName} ${student.lastName}`}</td>
                  <td>{student.year}</td>
                  <td>{student.course}</td>
                  <td>{student.semester}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => alert(`Edit ${student.regNo}`)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(student._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  No matching students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageStudents;