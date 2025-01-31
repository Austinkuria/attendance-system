import { useState, useEffect } from 'react';
import { Form, Button, Table, Alert, Modal, InputGroup, Badge } from 'react-bootstrap';
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
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: ''
  });
  const [unitInput, setUnitInput] = useState({ name: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseForUnits, setSelectedCourseForUnits] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [units, setUnits] = useState([]);

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
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment ? course.department?._id === selectedDepartment : true;
    return matchesSearch && matchesDepartment;
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

  // handleManageUnits function, update the units fetch call:
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

    // Add loading state to Units modal
    <Modal show={showUnitsModal} onHide={() => setShowUnitsModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Manage Units - {selectedCourseForUnits?.name}
          {loading && <span className="ms-2 spinner-border spinner-border-sm"></span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Keep existing unit management UI */}
        {units.length === 0 && !loading && (
          <Alert variant="info">No units found for this course</Alert>
        )}
      </Modal.Body>
    </Modal>

    const handleAddUnit = async () => {
      try {
        setLoading(true);
        await addUnitToCourse(selectedCourseForUnits._id, unitInput);
        const unitsRes = await getUnitsByCourse(selectedCourseForUnits._id); // Changed to getUnitsByCourse
        setUnits(unitsRes);
        setUnitInput({ name: '', code: '' });
      } catch (err) {
        setError(`Failed to add unit: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const handleRemoveUnit = async (unitId) => {
      try {
        setLoading(true);
        await removeUnitFromCourse(selectedCourseForUnits._id, unitId);
        const unitsRes = await getUnitsByCourse(selectedCourseForUnits._id); // Changed to getUnitsByCourse
        setUnits(unitsRes);
      } catch (err) {
        setError(`Failed to remove unit: ${err.message}`);
      } finally {
        setLoading(false);
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Courses</h2>
        <Button onClick={() => setShowModal(true)} variant="primary">
          Add New Course
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-4">
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Form.Select
            style={{ maxWidth: '200px' }}
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </Form.Select>
        </InputGroup>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && <Alert variant="info">Loading...</Alert>}

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Department</th>
            <th>Units</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCourses.map(course => (
            <tr key={course._id}>
              <td>{course.code}</td>
              <td>{course.name}</td>
              <td>{course.department?.name || 'N/A'}</td>
              <td>
                <Badge bg="secondary">{course.units?.length || 0}</Badge>
              </td>
              <td>
                <Button
                  variant="info"
                  size="sm"
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
                  Edit
                </Button>{' '}
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => handleManageUnits(course)}
                >
                  Units
                </Button>{' '}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteConfirmation(course._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Course Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setSelectedCourse(null);
        setFormData({ name: '', code: '', department: '' });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedCourse ? 'Edit' : 'Add'} Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Course Code</Form.Label>
              <Form.Control
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Course Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
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
              {loading ? 'Saving...' : 'Save Course'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
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

      {/* Units Management Modal */}
    <Modal show={showUnitsModal} onHide={() => setShowUnitsModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          Manage Units - {selectedCourseForUnits?.name}
          {loading && <span className="ms-2 spinner-border spinner-border-sm"></span>}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <InputGroup>
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
            <Button 
              variant="primary" 
              onClick={handleAddUnit}
              disabled={!unitInput.name || !unitInput.code}
            >
              Add Unit
            </Button>
          </InputGroup>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="text-center">
            <Alert variant="info">Loading units...</Alert>
          </div>
        ) : units.length === 0 ? (
          <Alert variant="info">No units found for this course</Alert>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map(unit => (
                <tr key={unit._id}>
                  <td>{unit.code}</td>
                  <td>{unit.name}</td>
                  <td>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveUnit(unit._id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
    </Modal>
    </div>
  );
};

export default ManageCourses;