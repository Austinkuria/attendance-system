import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaFileImport, 
  FaDownload, 
  FaSearch, 
  FaUserPlus,
  FaSpinner,
  FaExclamationTriangle,
  FaUsers,
  FaArrowUp,
  FaChevronLeft,
  FaEdit,
  FaTrash,
  FaIdBadge,
  FaCalendarAlt,
  FaBook,
  FaFilter
} from "react-icons/fa";
import { 
  getStudents, 
  deleteStudent, 
  importStudents, 
  downloadStudents 
} from "../services/api";
import '../styles.css';

const ManageStudents = () => {
  const navigate = useNavigate();
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
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Courses dropdown data
  const courses = useMemo(() => {
    const courseSet = new Set();
    students.forEach(student => {
      if (student.course && student.course !== 'N/A') courseSet.add(student.course);
    });
    return Array.from(courseSet).sort();
  }, [students]);

  // Fetch students
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
            course: student.course?.name || student.course || 'N/A'
          }));
          setStudents(formattedStudents);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Failed to load student data. Please try again later.");
          setStudents([]);
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
      setLoading(true);
      await deleteStudent(studentId);
      setStudents(prev => prev.filter(s => s._id !== studentId));
    } catch {
      setError('Failed to delete student. Please check your permissions.');
    } finally {
      setLoading(false);
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
    } catch {
      setError('CSV import failed. Please check file format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const searchLower = searchQuery.toLowerCase().trim();
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const studentYear = student.year.toString();
      const studentSemester = student.semester.toString();

      return (
        fullName.includes(searchLower) &&
        student.regNo.toLowerCase().includes(filter.regNo.toLowerCase()) &&
        (filter.year === "" || studentYear === filter.year) &&
        (filter.course === "" || student.course === filter.course) &&
        (filter.semester === "" || studentSemester === filter.semester)
      );
    });
  }, [students, searchQuery, filter]);

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
      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          className="btn btn-primary shadow-lg d-flex align-items-center justify-content-center"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ 
            position: 'fixed', 
            bottom: '20px', 
            right: '20px', 
            width: '50px', 
            height: '50px',
            borderRadius: '50%',
            padding: 0
          }}
        >
          <FaArrowUp size={18} />
        </button>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button 
          className="btn btn-outline-primary d-flex align-items-center"
          onClick={() => navigate('/admin')}
        >
          <FaChevronLeft className="me-2" />
          Back to Admin
        </button>
        <h2 className="mb-0 d-flex align-items-center">
          <FaUsers className="me-2" />
          Student Management
        </h2>
        <div></div>
      </div>

      {/* Filters and Actions */}
      <div className="card mb-4 shadow-sm">
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
                  placeholder="Search students name ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <div className="input-group">
                <span className="input-group-text">
                  <FaIdBadge />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Reg No"
                  value={filter.regNo}
                  onChange={(e) => setFilter(p => ({ ...p, regNo: e.target.value }))}
                />
              </div>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <div className="input-group">
                <span className="input-group-text">
                  <FaCalendarAlt />
                </span>
                <select
                  className="form-select"
                  value={filter.year}
                  onChange={(e) => setFilter(p => ({ ...p, year: e.target.value }))}
                >
                  <option value="">All Years</option>
                  {[1, 2, 3, 4].map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <div className="input-group">
                <span className="input-group-text">
                  <FaBook />
                </span>
                <select
                  className="form-select"
                  value={filter.course}
                  onChange={(e) => setFilter(p => ({ ...p, course: e.target.value }))}
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-6 col-md-3 col-lg-2">
              <div className="input-group">
                <span className="input-group-text">
                  <FaFilter />
                </span>
                <select
                  className="form-select"
                  value={filter.semester}
                  onChange={(e) => setFilter(p => ({ ...p, semester: e.target.value }))}
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3].map(sem => (
                    <option key={sem} value={sem}>Sem {sem}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
                  className="btn btn-success d-flex align-items-center" 
                  onClick={handleImport}
                  disabled={!file}
                >
                  <FaFileImport className="me-2" />
                  {file ? `Import ${file.name}` : "CSV"}
                </button>
              </div>
            </div>

            <div className="col-6 col-md-4">
              <button 
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                onClick={async () => {
                  try {
                    await downloadStudents();
                  } catch {
                    setError('Failed to download students');
                  }
                }}
              >
                <FaDownload className="me-2" />
                Export
              </button>
            </div>

            <div className="col-6 col-md-4">
              <button 
                className="btn btn-secondary w-100 d-flex align-items-center justify-content-center"
                onClick={() => alert("New student form coming soon!")}
              >
                <FaUserPlus className="me-2" />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="table-responsive rounded-3 shadow-sm" style={{ maxHeight: '65vh' }}>
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th style={{ minWidth: '150px' }}>
                <FaIdBadge className="me-2" />
                Reg No
              </th>
              <th style={{ minWidth: '200px' }}>Student Name</th>
              <th style={{ minWidth: '120px' }}>
                <FaCalendarAlt className="me-2" />
                Year
              </th>
              <th style={{ minWidth: '200px' }}>
                <FaBook className="me-2" />
                Course
              </th>
              <th style={{ minWidth: '150px' }}>
                <FaFilter className="me-2" />
                Semester
              </th>
              <th style={{ minWidth: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <tr key={student._id}>
                  <td className="fw-semibold text-primary">{student.regNo}</td>
                  <td>{`${student.firstName} ${student.lastName}`}</td>
                  <td>
                    <span className="badge bg-info rounded-pill">
                      {student.year}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaBook className="text-muted me-2" />
                      {student.course}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-secondary rounded-pill">
                      {student.semester}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                        onClick={() => alert(`Edit ${student.regNo}`)}
                      >
                        <FaEdit className="me-1" />
                        <span className="d-none d-md-inline">Edit</span>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger d-flex align-items-center"
                        onClick={() => handleDelete(student._id)}
                      >
                        <FaTrash className="me-1" />
                        <span className="d-none d-md-inline">Delete</span>
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