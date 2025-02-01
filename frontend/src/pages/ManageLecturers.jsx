import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
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
  FaBook,
  FaCheckCircle,
} from "react-icons/fa";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import {
  getLecturers,
  deleteLecturer,
  addLecturer,
  updateLecturer,
  getUnits,
  getDepartments,
} from "../services/api";
import "../styles.css";

const ManageLecturers = () => {
  const navigate = useNavigate();

  // Data states
  const [lecturers, setLecturers] = useState([]);
  const [units, setUnits] = useState([]); // available units from API
  const [departments, setDepartments] = useState([]); // available departments from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter/search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterUnit, setFilterUnit] = useState("");

  // Modal control states for add/edit/delete
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal for managing assigned units
  const [showUnitsModal, setShowUnitsModal] = useState(false);

  // Lecturer currently selected for editing, deletion, or unit assignment
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [lecturerToDelete, setLecturerToDelete] = useState(null);

  // New lecturer form data (for adding a lecturer)
  const [newLecturer, setNewLecturer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    department: "",
    assignedUnits: [], // using an array now
  });

  // For adding a unit in the Units Modal
  const [newUnit, setNewUnit] = useState("");

  // Form errors (if any)
  const [formErrors, setFormErrors] = useState({});

  // Back-to-top button state
  const [showBackToTop, setShowBackToTop] = useState(false);

  // State and handler for the Units Modal (for a lecturer)
  const [selectedLecturerForUnits, setSelectedLecturerForUnits] = useState(null);
  const openUnitsModal = (lecturer) => {
    setSelectedLecturerForUnits(lecturer);
    setShowUnitsModal(true);
  };

  // ---------------------------
  // Initial Redirect & Scroll
  // ---------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------------------------
  // Data Fetching
  // ---------------------------
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        const [lecturerRes, unitsRes, deptsRes] = await Promise.all([
          getLecturers(),
          getUnits(),
          getDepartments(),
        ]);
        if (isMounted) {
          setLecturers(lecturerRes || []);
          setUnits(unitsRes || []);
          setDepartments(deptsRes || []);
          setError("");
        }
      } catch{
        setError("Failed to load lecturer data. Please try again later.");
        if (isMounted) {
          setError("Failed to load lecturer data. Please try again later.");
          setLecturers([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // ---------------------------
  // Filtering
  // ---------------------------
  const filteredLecturers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return lecturers.filter((l) => {
      const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
      const email = l.email.toLowerCase();
      const assignedUnits = (Array.isArray(l.assignedUnits) ? l.assignedUnits : [])
        .map((u) => String(u ?? "").toLowerCase());
      const matchesSearch =
        fullName.includes(query) ||
        email.includes(query) ||
        assignedUnits.some((unit) => unit.includes(query));
      const matchesDept = filterDepartment
        ? l.department === filterDepartment
        : true;
      const matchesUnit = filterUnit
        ? assignedUnits.includes(filterUnit.toLowerCase())
        : true;
      return matchesSearch && matchesDept && matchesUnit;
    });
  }, [lecturers, searchQuery, filterDepartment, filterUnit]);

  // ---------------------------
  // Form Validation (Add Lecturer)
  // ---------------------------
  const validateForm = () => {
    const errors = {};
    if (!newLecturer.firstName) errors.firstName = "First name is required";
    if (!newLecturer.lastName) errors.lastName = "Last name is required";
    if (!newLecturer.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(newLecturer.email)) {
      errors.email = "Invalid email format";
    }
    if (!newLecturer.password) errors.password = "Password is required";
    if (!newLecturer.department) errors.department = "Department is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------------------------
  // Handlers for Lecturer CRUD
  // ---------------------------
  const handleAddLecturer = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await addLecturer({ ...newLecturer, role: "lecturer" });
      if (response?.message === "User created successfully") {
        const updated = await getLecturers();
        setLecturers(updated || []);
        setShowAddModal(false);
        setSuccess("Lecturer added successfully");
        setNewLecturer({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          department: "",
          assignedUnits: [],
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create lecturer");
    } finally {
      setLoading(false);
    }
  };

  const handleEditLecturer = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await updateLecturer(
        selectedLecturer._id,
        selectedLecturer
      );
      if (response?.message === "User updated successfully") {
        const updated = await getLecturers();
        setLecturers(updated || []);
        setShowEditModal(false);
        setSuccess("Lecturer updated successfully");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update lecturer");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      await deleteLecturer(lecturerToDelete);
      setLecturers((prev) =>
        prev.filter((l) => l._id !== lecturerToDelete)
      );
      setShowDeleteModal(false);
      setSuccess("Lecturer deleted successfully");
    } catch {
      setError("Failed to delete lecturer. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Handler for Assigning a Unit
  // ---------------------------
  const handleAssignUnit = async () => {
    if (!newUnit || !selectedLecturerForUnits) return;
    try {
      setLoading(true);
      const updatedUnits = Array.isArray(selectedLecturerForUnits.assignedUnits)
        ? [...selectedLecturerForUnits.assignedUnits]
        : [];
      if (!updatedUnits.includes(newUnit)) {
        updatedUnits.push(newUnit);
      }
      const updatedLecturer = {
        ...selectedLecturerForUnits,
        assignedUnits: updatedUnits,
      };
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await updateLecturer(
        selectedLecturerForUnits._id,
        updatedLecturer
      );
      if (response?.message === "User updated successfully") {
        const updated = await getLecturers();
        setLecturers(updated || []);
        setSelectedLecturerForUnits(updatedLecturer);
        setNewUnit("");
        setSuccess("Unit assigned successfully");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign unit");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Render Loading
  // ---------------------------
  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <FaSpinner className="fa-spin me-2" />
        Loading lecturer records...
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {showBackToTop && (
        <Button
          variant="primary"
          className="shadow-lg back-to-top-btn"
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
        >
          <FaArrowUp size={18} />
        </Button>
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
        <Button
          variant="outline-primary"
          onClick={() => navigate("/admin")}
          className="d-flex align-items-center"
        >
          <FaChevronLeft className="me-2" />
          Back to Admin
        </Button>
        <h2 className="d-flex align-items-center mb-0">
          <FaUsers className="me-2" />
          Lecturer Management
        </h2>
        <Button
          variant="secondary"
          onClick={() => setShowAddModal(true)}
          className="d-flex align-items-center"
        >
          <FaUserPlus className="me-2" />
          Add Lecturer
        </Button>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4 mb-2">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <Form.Control
              type="text"
              placeholder="Search by name, email, or unit code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-4 mb-2">
          <Form.Select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </Form.Select>
        </div>
        <div className="col-md-4 mb-2">
          <Form.Select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
          >
            <option value="">All Assigned Units</option>
            {units.map((unit) => (
              <option key={unit.code} value={unit.code}>
                {unit.code} – {unit.name}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {/* Lecturer Table */}
      <div className="table-responsive rounded-3 shadow-sm" style={{ maxHeight: "65vh" }}>
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th>
                <FaIdBadge className="me-2" />
                Name
              </th>
              <th>Email</th>
              <th>Department</th>
              <th>Assigned Units</th>
              <th style={{ minWidth: "150px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLecturers.length > 0 ? (
              filteredLecturers.map((lecturer) => (
                <tr key={lecturer._id}>
                  <td className="fw-semibold text-primary">
                    {lecturer.firstName} {lecturer.lastName}
                  </td>
                  <td>{lecturer.email}</td>
                  <td>
                    {departments.find((d) => d._id === lecturer.department)?.name || "N/A"}
                  </td>
                  <td>
                    <Button
                      variant="link"
                      onClick={() => openUnitsModal(lecturer)}
                    >
                      {Array.isArray(lecturer.assignedUnits)
                        ? lecturer.assignedUnits.length
                        : 0}{" "}
                      unit(s)
                    </Button>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setSelectedLecturer(lecturer);
                          setShowEditModal(true);
                        }}
                      >
                        <FaEdit className="me-1" />
                        <span className="d-none d-md-inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setLecturerToDelete(lecturer._id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash className="me-1" />
                        <span className="d-none d-md-inline">Delete</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No matching lecturers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lecturer Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUserPlus className="me-2" />
            Add New Lecturer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                value={newLecturer.firstName}
                onChange={(e) =>
                  setNewLecturer({ ...newLecturer, firstName: e.target.value })
                }
                isInvalid={!!formErrors.firstName}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.firstName}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                value={newLecturer.lastName}
                onChange={(e) =>
                  setNewLecturer({ ...newLecturer, lastName: e.target.value })
                }
                isInvalid={!!formErrors.lastName}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.lastName}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newLecturer.email}
                onChange={(e) =>
                  setNewLecturer({ ...newLecturer, email: e.target.value })
                }
                isInvalid={!!formErrors.email}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.email}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={newLecturer.password}
                onChange={(e) =>
                  setNewLecturer({ ...newLecturer, password: e.target.value })
                }
                isInvalid={!!formErrors.password}
                required
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.password}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Select
                value={newLecturer.department}
                onChange={(e) =>
                  setNewLecturer({ ...newLecturer, department: e.target.value })
                }
                isInvalid={!!formErrors.department}
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {formErrors.department}
              </Form.Control.Feedback>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddLecturer} disabled={loading}>
            {loading ? <FaSpinner className="fa-spin me-2" /> : "Create Lecturer"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Lecturer Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEdit className="me-2" />
            Edit Lecturer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLecturer && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedLecturer.firstName}
                  onChange={(e) =>
                    setSelectedLecturer({
                      ...selectedLecturer,
                      firstName: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedLecturer.lastName}
                  onChange={(e) =>
                    setSelectedLecturer({
                      ...selectedLecturer,
                      lastName: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={selectedLecturer.email}
                  onChange={(e) =>
                    setSelectedLecturer({
                      ...selectedLecturer,
                      email: e.target.value,
                    })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Department</Form.Label>
                <Form.Select
                  value={selectedLecturer.department}
                  onChange={(e) =>
                    setSelectedLecturer({
                      ...selectedLecturer,
                      department: e.target.value,
                    })
                  }
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditLecturer} disabled={loading}>
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
          Are you sure you want to delete this lecturer? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={loading}>
            {loading ? <FaSpinner className="fa-spin me-2" /> : "Delete Lecturer"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Units Management Modal */}
      <Modal show={showUnitsModal} onHide={() => setShowUnitsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Assigned Units for {selectedLecturerForUnits?.firstName}{" "}
            {selectedLecturerForUnits?.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLecturerForUnits && (
            <>
              <div className="mb-3">
                <strong>Current Units:</strong>
                <div>
                  {Array.isArray(selectedLecturerForUnits.assignedUnits) &&
                  selectedLecturerForUnits.assignedUnits.length > 0 ? (
                    selectedLecturerForUnits.assignedUnits.map((unit, idx) => (
                      <span key={idx} className="badge bg-secondary me-1 mb-1">
                        {unit}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted">None assigned</span>
                  )}
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FaBook className="me-1" />
                  Assign New Unit
                </Form.Label>
                <Form.Select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                >
                  <option value="">Select a unit</option>
                  {units
                    .filter(
                      (unit) =>
                        !(
                          Array.isArray(selectedLecturerForUnits.assignedUnits) &&
                          selectedLecturerForUnits.assignedUnits.includes(unit.code)
                        )
                    )
                    .map((unit) => (
                      <option key={unit.code} value={unit.code}>
                        {unit.code} – {unit.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
              <Button variant="primary" onClick={handleAssignUnit} disabled={loading || !newUnit}>
                {loading ? <FaSpinner className="fa-spin me-2" /> : "Assign Unit"}
              </Button>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUnitsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManageLecturers;