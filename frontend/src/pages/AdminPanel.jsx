import { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaBook, FaCheckCircle, FaBars } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getStudents, getLecturers, getCourses, getCourseAttendanceRate } from '../services/api';
import AttendanceChart from '../components/AttendanceChart';

const AdminPanel = () => {
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendanceRates, setAttendanceRates] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Memoize data fetching functions
  const fetchStudents = useCallback(async () => {
    try {
      const response = await getStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, []);

  const fetchLecturers = useCallback(async () => {
    try {
      const response = await getLecturers();
      setLecturers(response.data || []);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await getCourses();
      // Remove .data from the response since your API returns the array directly
      setCourses(response || []); 
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, []);

  // Memoize attendance rate fetcher with course dependency
  const fetchCourseAttendanceRates = useCallback(async () => {
    try {
      const attendanceData = await Promise.all(
        courses.map(async (course) => {
          // Use _id instead of id (Mongoose uses _id by default)
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

  // Initial data fetch
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

  // Update attendance data when courses change
  useEffect(() => {
    if (courses.length > 0) {
      fetchCourseAttendanceRates();
    }
  }, [courses.length, fetchCourseAttendanceRates]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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

      {/* Main Content */}
      <div className="main-content">
        <div className="container mt-4">
          <button className="btn btn-primary" onClick={toggleSidebar}>
            <FaBars />
          </button>

          <h2 className="text-center mb-4">Admin Panel</h2>

          {/* Dashboard Overview */}
          <div className="row">
            {/* Total Students Card */}
            <div className="col-md-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title"><FaUsers /> Total Students</h5>
                  <p className="card-text">{students.length}</p>
                  <button className="btn btn-primary" onClick={() => window.location.href='admin/manage-students'}>
                    Manage
                  </button>
                </div>
              </div>
            </div>

            {/* Total Courses Card */}
            <div className="col-md-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title"><FaBook /> Total Courses</h5>
                  <p className="card-text">{courses.length}</p>
                  <button className="btn btn-primary" onClick={() => alert('View Courses')}>Manage</button>
                </div>
              </div>
            </div>

            {/* Total Lecturers Card */}
            <div className="col-md-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title"><FaUsers /> Total Lecturers</h5>
                  <p className="card-text">{lecturers.length}</p>
                  <button className="btn btn-primary" onClick={() => alert('View Lecturers')}>Manage</button>
                </div>
              </div>
            </div>

            {/* Attendance Rate Card */}
            <div className="col-md-3 mb-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title"><FaCheckCircle /> Attendance Rate</h5>
                  <p className="card-text">Overall: 85%</p>
                  <button className="btn btn-primary" onClick={() => alert('View Attendance')}>Manage</button>
                </div>
              </div>
            </div>
          </div>

        {/* Charts/Graphs for each course */}
          <div className="row">
            {courses.map((course) => (
              <div className="col-md-6 mb-4" key={course._id}> {/* Use _id instead of id */}
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">{course.name} Attendance Trends</h5>
                    {/* Always render chart with fallback to zero values */}
                    <AttendanceChart data={attendanceRates[course._id]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Interactive Table for detailed view */}
          <div className="row">
            {/* Add interactive table here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
