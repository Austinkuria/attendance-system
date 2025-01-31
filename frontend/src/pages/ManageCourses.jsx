import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Table, Alert, Modal, InputGroup, Badge } from 'react-bootstrap';
import { 
  FaArrowUp,
  FaChevronLeft,
  FaPlus,
  FaEdit,
  FaTrash,
  FaListUl,
  FaBook,
  FaFilter,
  FaIdBadge,
  FaUniversity,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { 
  getCourses, 
  createCourse, 
  deleteCourse, 
  getDepartments,
  updateCourse,
  addUnitToCourse,
  removeUnitFromCourse,
  getUnitsByCourse
} from '../services/api';

const ManageCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showUnitDeleteModal, setShowUnitDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: ''
  });
  const [unitInput, setUnitInput] = useState({ name: '', code: '', year: '', semester: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseForUnits, setSelectedCourseForUnits] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [units, setUnits] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Extract unique course codes
  const courseCodes = [...new Set(courses.map(course => course.code))];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, deptsRes] = await Promise.all([
        getCourses(),
        getDepartments()
      ]);
      setCourses(coursesRes);
      setDepartments(deptsRes);
    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesCode = selectedCode ? course.code === selectedCode : true;
    const matchesDepartment = selectedDepartment ? course.department?._id === selectedDepartment : true;
    return matchesCode && matchesDepartment;
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedCourse) {
        await updateCourse(selectedCourse._id, formData);
      } else {
        await createCourse(formData);
      }
      setShowModal(false);
      await fetchData();
      setFormData({ name: '', code: '', department: '' });
      setSelectedCourse(null);
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManageUnits = async (course) => {
    try {
      setLoading(true);
      setSelectedCourseForUnits(course);
      const unitsRes = await getUnitsByCourse(course._id);
      setUnits(unitsRes);
      setShowUnitsModal(true);
    } catch (err) {
      setError(`Failed to load units: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (!unitInput.name.trim() || !unitInput.code.trim()) {
      setError('Unit name and code are required');
      return;
    }
    
    try {
      setLoading(true);
      const newUnit = await addUnitToCourse(selectedCourseForUnits._id, unitInput);
      setUnits([...units, newUnit]);
      setUnitInput({ name: '', code: '', year: '', semester: '' });
    } catch (err) {
      setError(`Failed to add unit: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const promptRemoveUnit = (unitId) => {
    setSelectedUnitId(unitId);
    setShowUnitDeleteModal(true);
  };

  const confirmUnitDelete = async () => {
    try {
      setLoading(true);
      await removeUnitFromCourse(selectedCourseForUnits._id, selectedUnitId);
      const unitsRes = await getUnitsByCourse(selectedCourseForUnits._id);
      setUnits(unitsRes);
    } catch (err) {
      setError(`Failed to remove unit: ${err.message}`);
    } finally {
      setLoading(false);
      setShowUnitDeleteModal(false);
      setSelectedUnitId(null);
    }
  };

  const handleDeleteConfirmation = (courseId) => {
    setSelectedCourse(courseId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(selectedCourse);
      await fetchData();
      setShowDeleteModal(false);
    } catch (err) {
      setError(`Failed to delete course: ${err.message}`);
    }
  };

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

      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button 
          className="btn btn-outline-primary d-flex align-items-center"
          onClick={() => navigate('/admin')}
        >
          <FaChevronLeft className="me-2" />
          Back to Admin
        </button>
        <h2 className="mb-0 d-flex align-items-center">
          <FaBook className="me-2" />
          Course Management
        </h2>
        <button 
          className="btn btn-primary d-flex align-items-center"
          onClick={() => setShowModal(true)}
        >
          <FaPlus className="me-2" />
          Add Course
        </button>
      </div>

      {/* Filter Section */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <FaIdBadge />
                </span>
                <Form.Select
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courseCodes.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </Form.Select>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <FaUniversity />
                </span>
                <Form.Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <Alert variant="danger" className="d-flex align-items-center">
        <FaExclamationTriangle className="me-2" />
        {error}
      </Alert>}
      {loading && <Alert variant="info" className="d-flex align-items-center">
        <FaSpinner className="fa-spin me-2" />
        Loading...
      </Alert>}

      {/* Courses Table */}
      <div className="table-responsive rounded-3 shadow-sm" style={{ maxHeight: '65vh' }}>
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr>
              <th style={{ minWidth: '150px' }}>
                <FaIdBadge className="me-2" />
                Code
              </th>
              <th style={{ minWidth: '200px' }}>
                <FaBook className="me-2" />
                Name
              </th>
              <th style={{ minWidth: '200px' }}>
                <FaUniversity className="me-2" />
                Department
              </th>
              <th style={{ minWidth: '150px' }}>
                <FaFilter className="me-2" />
                Units
              </th>
              <th style={{ minWidth: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map(course => (
              <tr key={course._id}>
                <td className="fw-semibold text-primary">{course.code}</td>
                <td>{course.name}</td>
                <td>{course.department?.name || 'N/A'}</td>
                <td>
                  <Badge bg="info" className="rounded-pill">
                    {course.units?.length || 0}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-sm btn-outline-primary d-flex align-items-center"
                      onClick={() => {
                        setSelectedCourse(course);
                        setFormData({
                          name: course.name,
                          code: course.code,
                          department: course.department?._id
                        });
                        setShowModal(true);
                      }}
                    >
                      <FaEdit className="me-1" />
                      <span className="d-none d-md-inline">Edit</span>
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-info d-flex align-items-center"
                      onClick={() => handleManageUnits(course)}
                    >
                      <FaListUl className="me-1" />
                      <span className="d-none d-md-inline">Units</span>
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger d-flex align-items-center"
                      onClick={() => handleDeleteConfirmation(course._id)}
                    >
                      <FaTrash className="me-1" />
                      <span className="d-none d-md-inline">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Course Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setSelectedCourse(null);
        setFormData({ name: '', code: '', department: '' });
      }}>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            {selectedCourse ? (
              <>
                <FaEdit className="me-2" />
                Edit Course
              </>
            ) : (
              <>
                <FaPlus className="me-2" />
                Add Course
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <FaIdBadge className="me-2" />
                Course Code
              </Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <FaBook className="me-2" />
                Course Name
              </Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="d-flex align-items-center">
                <FaUniversity className="me-2" />
                Department
              </Form.Label>
              <Form.Select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <><FaSpinner className="fa-spin me-2" /> Saving...</>
              ) : (
                'Save Course'
              )}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modals */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this course? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Course
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showUnitDeleteModal} onHide={() => setShowUnitDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Unit Removal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove this unit? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUnitDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmUnitDelete}>
            Remove Unit
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Units Management Modal */}
      <Modal show={showUnitsModal} onHide={() => setShowUnitsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FaListUl className="me-2" />
            Manage Units - {selectedCourseForUnits?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <InputGroup className="mb-3">
              <Form.Control
                placeholder="Unit Name"
                value={unitInput.name}
                onChange={(e) => setUnitInput({ ...unitInput, name: e.target.value })}
              />
              <Form.Control
                placeholder="Unit Code"
                value={unitInput.code}
                onChange={(e) => setUnitInput({ ...unitInput, code: e.target.value })}
              />
              <Form.Control
                placeholder="Year"
                type="number"
                value={unitInput.year}
                onChange={(e) => setUnitInput({ ...unitInput, year: e.target.value })}
              />
              <Form.Control
                placeholder="Semester"
                type="number"
                value={unitInput.semester}
                onChange={(e) => setUnitInput({ ...unitInput, semester: e.target.value })}
              />
              <Button 
                variant="primary" 
                onClick={handleAddUnit}
                disabled={!unitInput.name.trim() || !unitInput.code.trim()}
              >
                <FaPlus className="me-2" />
                Add Unit
              </Button>
            </InputGroup>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          
          {units.length === 0 ? (
            <Alert variant="info">No units found for this course</Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th><FaIdBadge /> Code</th>
                    <th>Name</th>
                    <th>Year</th>
                    <th>Semester</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map(unit => (
                    <tr key={unit._id}>
                      <td>{unit.code}</td>
                      <td>{unit.name}</td>
                      <td><Badge bg="info">{unit.year}</Badge></td>
                      <td><Badge bg="secondary">{unit.semester}</Badge></td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => promptRemoveUnit(unit._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .table-responsive {
          overflow-y: auto;
        }
        .sticky-top {
          position: sticky;
          top: 0;
          background: white;
          z-index: 1;
          box-shadow: inset 0 -1px 0 #dee2e6;
        }
      `}</style>
    </div>
  );
};

export default ManageCourses;