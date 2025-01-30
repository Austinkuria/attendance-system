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

export default api;
