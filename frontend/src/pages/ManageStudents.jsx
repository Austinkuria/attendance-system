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
  FaFilter,
  FaCheckCircle,
} from "react-icons/fa";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { getStudents, deleteStudent, downloadStudents } from "../services/api";
import "../styles.css";
import api from "../services/api";

const ManageStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({
    regNo: "",
    year: "",
    course: "",
    semester: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    regNo: "",
    course: "",
    department: "",
    year: "",
    semester: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Redirect to login if no token is found
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Courses dropdown data
  const courses = useMemo(() => {
    const courseSet = new Set();
    students.forEach((student) => {
      if (student.course && student.course !== "N/A") courseSet.add(student.course);
    });
    return Array.from(courseSet).sort();
  }, [students]);

  // Departments dropdown data
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await api.get("/department", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDepartments(response.data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    fetchDepartments();
  }, [navigate]);

  // Fetch students
  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await getStudents();
        const data = Array.isArray(response) ? response : [];

        if (isMounted) {
          const formattedStudents = data.map((student) => ({
            ...student,
            regNo: student.regNo || "N/A",
            year: student.year || "N/A",
            semester: student.semester?.toString() || "N/A",
            course: student.course?.name || student.course || "N/A",
            department: student.department?.name || student.department || "N/A",
          }));
          setStudents(formattedStudents);
          console.log("Fetched Students:", formattedStudents); // Debugging
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load student data. Please try again later.");
          setStudents([]);
        }
        console.error("Error fetching students:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudents();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    if (!newStudent.firstName) errors.firstName = "First name is required";
    if (!newStudent.lastName) errors.lastName = "Last name is required";
    if (!newStudent.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(newStudent.email)) {
      errors.email = "Invalid email format";
    }
    if (!newStudent.password) errors.password = "Password is required";
    if (!newStudent.regNo) errors.regNo = "Registration number is required";
    if (!newStudent.course) errors.course = "Course is required";
    if (!newStudent.department) errors.department = "Department is required";
    if (!newStudent.year) errors.year = "Year is required";
    if (!newStudent.semester) errors.semester = "Semester is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle adding a new student
  const handleAddStudent = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await api.post(
        "/user",
        {
          ...newStudent,
          role: "student",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.message === "User created successfully") {
        const updated = await getStudents();
        setStudents(
          updated.map((s) => ({
            ...s,
            regNo: s.regNo || "N/A",
            year: s.year || "N/A",
            semester: s.semester?.toString() || "N/A",
            course: s.course?.name || s.course || "N/A",
            department: s.department?.name || s.department || "N/A",
          }))
        );
        setShowAddModal(false);
        setSuccess("Student added successfully");
        setNewStudent({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          regNo: "",
          course: "",
          department: "",
          year: "",
          semester: "",
        });
      }
    } catch (err) {
      console.error("Error creating student:", err);
      setError(err.response?.data?.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a student
  const handleEditStudent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await api.put(`/user/${selectedStudent._id}`, selectedStudent, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.message === "User updated successfully") {
        const updated = await getStudents();
        setStudents(
          updated.map((s) => ({
            ...s,
            regNo: s.regNo || "N/A",
            year: s.year || "N/A",
            semester: s.semester?.toString() || "N/A",
            course: s.course?.name || s.course || "N/A",
            department: s.department?.name || s.department || "N/A",
          }))
        );
        setShowEditModal(false);
        setSuccess("Student updated successfully");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setError(err.response?.data?.message || "Failed to update student");
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a student
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await deleteStudent(studentToDelete, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStudents((prev) => prev.filter((s) => s._id !== studentToDelete));
      setShowDeleteModal(false);
      setSuccess("Student deleted successfully");
    } catch (err) {
      console.error("Error deleting student:", err);
      setError("Failed to delete student. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload for CSV import
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file?.type === "text/csv") {
      setFile(file);
    } else {
      setError("Invalid file type. Please upload a CSV file.");
      setFile(null);
    }
  };

  // Handle CSV import
  const handleImport = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const formData = new FormData();
      formData.append("csvFile", file);

      const response = await api.post("/upload-students", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.successCount > 0) {
        const updated = await getStudents();
        setStudents(
          updated.map((s) => ({
            ...s,
            regNo: s.regNo || "N/A",
            year: s.year || "N/A",
            semester: s.semester?.toString() || "N/A",
            course: s.course?.name || s.course || "N/A",
          }))
        );
        setSuccess(`Successfully imported ${response.data.successCount} students`);
      }

      setFile(null);
      setError(response.data.errorCount > 0 ? `${response.data.errorCount} records failed to import` : "");
    } catch (err) {
      console.error("CSV import failed:", err);
      setError("CSV import failed. Please check file format and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
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

  return (
    <div className="container mt-4">
      {showBackToTop && (
        <button
          className="btn btn-primary shadow-lg back-to-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FaArrowUp size={18} />
        </button>
      )}

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          <FaCheckCircle className="me-2" />
          {success}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-outline-primary d-flex align-items-center"
          onClick={() => navigate("/admin")}
        >
          <FaChevronLeft className="me-2" />
          Back to Admin
        </button>
        <h2 className="mb-0 d-flex align-items-center">
          <FaUsers className="me-2" />
          Student Management
        </h2>
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
                  placeholder="Search students by name ..."
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
                  onChange={(e) => setFilter((p) => ({ ...p, regNo: e.target.value }))}
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
                  onChange={(e) => setFilter((p) => ({ ...p, year: e.target.value }))}
                >
                  <option value="">All Years</option>
                  {[1, 2, 3, 4].map((year) => (
                    <option key={year} value={year}>
                      Year {year}
                    </option>
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
                  onChange={(e) => setFilter((p) => ({ ...p, course: e.target.value }))}
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
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
                  onChange={(e) => setFilter((p) => ({ ...p, semester: e.target.value }))}
                >
                  <option value="">All Semesters</option>
                  {[1, 2, 3].map((sem) => (
                    <option key={sem} value={sem}>
                      Sem {sem}
                    </option>
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
                  } catch (err) {
                    console.error("Error downloading students:", err);
                    setError("Failed to download students");
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
                onClick={() => setShowAddModal(true)}
              >
                <FaUserPlus className="me-2" />
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUserPlus className="me-2" />
            Add New Student
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={newStudent.firstName}
                onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                isInvalid={!!formErrors.firstName}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.firstName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={newStudent.lastName}
                onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                isInvalid={!!formErrors.lastName}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.lastName}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                isInvalid={!!formErrors.email}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={newStudent.password}
                onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                isInvalid={!!formErrors.password}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Registration Number</Form.Label>
              <Form.Control
                type="text"
                value={newStudent.regNo}
                onChange={(e) => setNewStudent({ ...newStudent, regNo: e.target.value })}
                isInvalid={!!formErrors.regNo}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.regNo}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select
                value={newStudent.course}
                onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                isInvalid={!!formErrors.course}
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {formErrors.course}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Select
                value={newStudent.department}
                onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                isInvalid={!!formErrors.department}
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department._id} value={department.name}>
                    {department.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {formErrors.department}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Year</Form.Label>
              <Form.Select
                value={newStudent.year}
                onChange={(e) => setNewStudent({ ...newStudent, year: e.target.value })}
                isInvalid={!!formErrors.year}
              >
                <option value="">Select Year</option>
                {[1, 2, 3, 4].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {formErrors.year}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Semester</Form.Label>
              <Form.Select
                value={newStudent.semester}
                onChange={(e) => setNewStudent({ ...newStudent, semester: e.target.value })}
                isInvalid={!!formErrors.semester}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {formErrors.semester}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddStudent} disabled={loading}>
            {loading ? <FaSpinner className="fa-spin me-2" /> : "Create Student"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Student Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEdit className="me-2" />
            Edit Student
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={selectedStudent?.firstName || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, firstName: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={selectedStudent?.lastName || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, lastName: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={selectedStudent?.email || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Registration Number</Form.Label>
              <Form.Control
                type="text"
                value={selectedStudent?.regNo || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, regNo: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select
                value={selectedStudent?.course || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, course: e.target.value })}
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Year</Form.Label>
              <Form.Select
                value={selectedStudent?.year || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, year: e.target.value })}
              >
                <option value="">Select Year</option>
                {[1, 2, 3, 4].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Semester</Form.Label>
              <Form.Select
                value={selectedStudent?.semester || ""}
                onChange={(e) => setSelectedStudent({ ...selectedStudent, semester: e.target.value })}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditStudent} disabled={loading}>
            {loading ? <FaSpinner className="fa-spin me-2" /> : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this student? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={loading}>
            {loading ? <FaSpinner className="fa-spin me-2" /> : "Delete Student"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Student Table */}
      <div className="table-responsive rounded-3 shadow-sm" style={{ maxHeight: "65vh" }}>
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th style={{ minWidth: "150px" }}>
                <FaIdBadge className="me-2" />
                Reg No
              </th>
              <th style={{ minWidth: "200px" }}>Student Name</th>
              <th style={{ minWidth: "120px" }}>
                <FaCalendarAlt className="me-2" />
                Year
              </th>
              <th style={{ minWidth: "200px" }}>
                <FaBook className="me-2" />
                Course
              </th>
              <th style={{ minWidth: "150px" }}>
                <FaFilter className="me-2" />
                Semester
              </th>
              <th style={{ minWidth: "150px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student._id}>
                  <td className="fw-semibold text-primary">{student.regNo}</td>
                  <td>{`${student.firstName} ${student.lastName}`}</td>
                  <td>
                    <span className="badge bg-info rounded-pill">{student.year}</span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <FaBook className="text-muted me-2" />
                      {student.course}
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-secondary rounded-pill">{student.semester}</span>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowEditModal(true);
                        }}
                      >
                        <FaEdit className="me-1" />
                        <span className="d-none d-md-inline">Edit</span>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger d-flex align-items-center"
                        onClick={() => {
                          setStudentToDelete(student._id);
                          setShowDeleteModal(true);
                        }}
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