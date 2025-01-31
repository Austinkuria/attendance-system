import { useState, useEffect, useCallback } from 'react';
import { 
  FaUsers, 
  FaBook, 
  FaCheckCircle, 
  FaBars, 
  FaUser, 
  FaCog, 
  FaSignOutAlt 
} from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles.css';
import { getStudents, getLecturers, getCourses, getCourseAttendanceRate } from '../services/api';
import AttendanceChart from '../components/AttendanceChart';

const AdminPanel = () => {
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    
    const handlePopState = () => {
      if (!localStorage.getItem('token')) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Logout handlers
  const handleLogoutConfirm = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    window.location.href = '/login';
    window.location.reload(true);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    closeProfileDropdown();
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleProfileDropdown = () => setShowProfileDropdown(!showProfileDropdown);
  const closeProfileDropdown = () => setShowProfileDropdown(false);

  const navigateToProfile = () => {
    window.location.href = '/admin/profile';
    closeProfileDropdown();
  };

  const navigateToSettings = () => {
    window.location.href = '/admin/settings';
    closeProfileDropdown();
  };

  const ProfileDropdown = () => (
    <div className="position-absolute top-100 end-0 mt-2 shadow rounded bg-white" 
         style={{ minWidth: '200px', zIndex: 1000 }}>
      <div className="list-group border-0">
        <button 
          className="list-group-item list-group-item-action border-0 d-flex align-items-center"
          onClick={navigateToProfile}
        >
          <FaUser className="me-2 text-secondary" />
          <span>View Profile</span>
        </button>
        <button 
          className="list-group-item list-group-item-action border-0 d-flex align-items-center"
          onClick={navigateToSettings}
        >
          <FaCog className="me-2 text-secondary" />
          <span>Settings</span>
        </button>
        <div className="dropdown-divider m-0"></div>
        <button 
          className="list-group-item list-group-item-action border-0 d-flex align-items-center text-danger"
          onClick={handleLogoutClick}
        >
          <FaSignOutAlt className="me-2" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  const HeaderSection = () => (
    <div className="header-section">
      <h2 className="text-center mb-0">Admin Panel</h2>
      <div className="position-relative">
        <button 
          className="btn btn-link text-dark p-0" 
          onClick={toggleProfileDropdown}
          style={{ fontSize: '2rem', lineHeight: 1, cursor: 'pointer',marginRight: '2rem' }}
        >
          <FaUser />
        </button>
        {showProfileDropdown && <ProfileDropdown />}
      </div>
    </div>
  );

  const fetchStudents = useCallback(async () => {
    try {
      const response = await getStudents();
      setStudents(response || []); 
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  const fetchLecturers = useCallback(async () => {
    try {
      const response = await getLecturers();
      setLecturers(response || []); 
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await getCourses();
      setCourses(response || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, []);

  const fetchCourseAttendanceRates = useCallback(async () => {
    try {
      const attendanceData = await Promise.all(
        courses.map(async (course) => {
          const response = await getCourseAttendanceRate(course._id);
          return { 
            courseId: course._id, 
            data: response || { present: 0, absent: 0 } 
          };
        })
      );
      
      const rates = attendanceData.reduce((acc, cur) => {
        acc[cur.courseId] = cur.data;
        return acc;
      }, {});
      
      setAttendanceRates(rates);
    } catch (error) {
      console.error('Error fetching course attendance rates:', error);
    }
  }, [courses]);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchStudents();
        await fetchLecturers();
        await fetchCourses();
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, [fetchStudents, fetchLecturers, fetchCourses]);

  useEffect(() => {
    if (courses.length > 0) {
      fetchCourseAttendanceRates();
    }
  }, [courses.length, fetchCourseAttendanceRates]);

  return (
    <div className="admin-panel">
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to logout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLogoutConfirm}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>

      <button 
        className="sidebar-toggle btn btn-primary" 
        onClick={toggleSidebar}
        style={{ width: '40px' }}
      >
        <FaBars />
      </button>

      <div className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h4>Admin Panel</h4>
        </div>
        <div className="sidebar-menu">
          <ul className="list-unstyled">
            <li>
              <a href="#" className="d-flex align-items-center">
                <FaUsers className="me-2" /> Students
              </a>
            </li>
            <li>
              <a href="#" className="d-flex align-items-center">
                <FaBook className="me-2" /> Courses
              </a>
            </li>
            <li>
              <a href="#" className="d-flex align-items-center">
                <FaCheckCircle className="me-2" /> Attendance
              </a>
            </li>
            <li>
              <a href="#" className="d-flex align-items-center">
                <FaUsers className="me-2" /> Lecturers
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={`main-content ${sidebarOpen ? '' : 'full-width'}`}>
        <div className="container mt-4">
          <HeaderSection />
          
          <div className="row">
            <div className="col-md-3 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title"><FaUsers /> Total Students</h5>
                  <p className="card-text display-6">{students.length}</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.href='admin/manage-students'}
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title"><FaBook /> Total Courses</h5>
                  <p className="card-text display-6">{courses.length}</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.href='admin/manage-courses'}
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title"><FaUsers /> Total Lecturers</h5>
                  <p className="card-text display-6">{lecturers.length}</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.href='admin/manage-lecturers'}
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>

            <div className="col-md-3 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title"><FaCheckCircle /> Attendance Rate</h5>
                  <p className="card-text display-6">85%</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.href='admin/attendance-reports'}
                  >
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {courses.map((course) => (
              <div className="col-md-6 mb-4" key={course._id}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{course.name} Attendance</h5>
                    <div style={{ height: '300px' }}>
                      <AttendanceChart data={attendanceRates[course._id]} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;