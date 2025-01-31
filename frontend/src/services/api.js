import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend URL
});

// Fetch units for a student based on their course, year, and semester
export const getStudentUnits = async (token) => {
  try {
    const response = await axios.get("http://localhost:5000/api/unit/student/units", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",  // Disable caching to force a fresh request
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching units:", error.response || error);
    return [];
  }
};

// Fetch student's courses
export const getStudentCourses = () => api.get("/student/courses");

// Fetch attendance data for a student in a specific unit
export const getStudentAttendance = (unitId) => api.get(`/attendance/student/${unitId}`);

// Fetch units assigned to the lecturer
export const getLecturerUnits = () => api.get("/lecturer/units");

// Fetch attendance data for a unit
export const getAttendanceData = (unitId) => api.get(`/attendance/unit/${unitId}`);

// Generate QR code for attendance (for lecturers)
export const generateQRCode = (unitId) => api.post("/attendance/generateQR", { unitId });

// ** New Methods for Admin Panel **

// Fetch all students
// Update getStudents with proper headers and course handling
export const getStudents = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No authentication token found");
    return [];
  }

  try {
    const response = await axios.get(`${API_URL}/students`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    // Transform course data for frontend
    return response.data.map(student => ({
      ...student,
      course: student.course?.name || student.course || 'N/A'
    }));
    
  } catch (error) {
    console.error("Error fetching students:", error.response?.data || error.message);
    return [];
  }
};

// Add a new student
export const addStudent = (student) => api.post("/students", student);

// Delete a student
// export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Fetch all lecturers
// Update getLecturers to handle response properly
export const getLecturers = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No authentication token found");
    return [];
  }

  try {
    const response = await axios.get(`${API_URL}/lecturers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching lecturers:", error.response?.data || error.message);
    return [];
  }
};

// Add a new lecturer
export const addLecturer = (lecturer) => api.post("/lecturers", lecturer);

// Delete a lecturer
export const deleteLecturer = (id) => api.delete(`/lecturers/${id}`);

// Fetch all units
export const getUnits = async () => {
  const token = localStorage.getItem("token"); // Retrieve stored token
  if (!token) {
    console.error("No token found in localStorage");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/unit", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Send token in headers
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching units:", error);
  }
};

// Fetch all courses (new API endpoint)
export const getCourses = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found in localStorage");
    return [];
  }

  try {
    const response = await fetch("http://localhost:5000/api/course", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching courses:", error);
    return []; // Return empty array instead of undefined
  }
};

// Add a new unit
export const addUnit = (unit) => api.post("/unit", unit);

// Delete a unit
export const deleteUnit = (id) => api.delete(`/units/${id}`);

// Fetch all attendance records
export const getAttendance = () => api.get("/attendance");

// Fetch attendance rate 
export const getAttendanceRate = async () => {
  try {
    const response = await api.get("/attendance/rate");
    return response.data; // Assuming the backend sends { present, absent }
  } catch (error) {
    console.error("Error fetching attendance rate:", error);
    return { present: 0, absent: 0 }; // Default to zero in case of error
  }
};

// Fetch attendance rate for a specific course
export const getCourseAttendanceRate = async (courseId) => {
  try {
    const response = await api.get(`/attendance/rate/${courseId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching course attendance rate:", error);
    return { present: 0, absent: 0 };
  }
};

export const deleteStudent = async (studentId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.delete(`${API_URL}/students/${studentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting student:", error.response?.data || error.message);
    throw error;
  }
};

export const importStudents = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("csvFile", file);

  try {
    const response = await axios.post(`${API_URL}/students/upload`, formData, {
      headers: { 
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Import error:", error.response?.data || error.message);
    throw error;
  }
};

export const downloadStudents = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/students/download`, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Create temporary download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Export error:", error.response?.data || error.message);
    throw error;
  }
};

// Mark attendance for a student
export const markAttendance = (attendance) => api.post("/attendance", attendance);

export default api;
