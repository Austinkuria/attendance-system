import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // Replace with your backend URL
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
export const getStudents = () => api.get("/students");

// Add a new student
export const addStudent = (student) => api.post("/students", student);

// Delete a student
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Fetch all lecturers
export const getLecturers = () => api.get("/lecturers");

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

// Mark attendance for a student
export const markAttendance = (attendance) => api.post("/attendance", attendance);

export default api;
