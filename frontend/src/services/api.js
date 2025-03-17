import axios from "axios";

// Use environment variable for base URL, with fallback
const API_URL = import.meta.env.VITE_API_URL || "https://attendance-system-w70n.onrender.com/api";

// Add a timeout to axios instance
const api = axios.create({
  baseURL: API_URL, // Use baseURL instead of API_URL as a property
  timeout: 15000, // 15 second timeout
});

// Function to get token from local storage
const getToken = () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Authentication token missing");
  return token;
};

// Function to refresh token
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { token, refreshToken: newRefreshToken } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", newRefreshToken);

    return token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

// Axios Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshToken();
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        console.error("Redirecting to login due to authentication failure");
        localStorage.clear();
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

// Add error interceptor to transform error messages
api.interceptors.response.use(
  response => response,
  error => {
    let errorMessage = 'An unexpected error occurred';

    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 404:
          errorMessage = 'No records found for the selected criteria';
          break;
        case 401:
          errorMessage = 'Your session has expired. Please log in again';
          break;
        case 403:
          errorMessage = 'You do not have permission to access this resource';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later';
          break;
        default:
          errorMessage = error.response.data?.message || 'Server error occurred';
      }
    } else if (error.request) {
      // No response received
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network';
      } else {
        errorMessage = 'Unable to reach the server. Please try again later';
      }
    }

    error.userMessage = errorMessage;
    return Promise.reject(error);
  }
);

// Helper function to get the authorization header
// const getAuthHeader = () => {
//   const token = localStorage.getItem('token');
//   return { headers: { Authorization: `Bearer ${token}` } };
// };

// get userprofile
export const getUserProfile = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching student profile:", error.response?.data || error.message);
    throw error;
  }
};

// update userprofile
export const updateUserProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  try {
    const response = await axios.put("https://attendance-system-w70n.onrender.com/api/users/profile/update", profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch units for a student based on their course, year, and semester
export const getStudentUnits = async (token) => {
  try {
    const response = await axios.get("https://attendance-system-w70n.onrender.com/api/unit/student/units", {
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

// Add proper parameter handling
export const getLecturerUnits = async () => {
  const token = localStorage.getItem("token");
  const lecturerId = localStorage.getItem("userId");
  try {
    const response = await axios.get(`https://attendance-system-w70n.onrender.com/api/unit/lecturer/units/${lecturerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching lecturer units:", error);
    return [];
  }
};

export const getUnitEnrollments = (unitId) => {
  if (!unitId) {
    console.error("Unit ID is required");
    return Promise.reject("Unit ID is required");
  }
  return api.get(`/unit/${unitId}/students`);
};

// Fetch attendance data for a unit
export const getAttendanceData = (unitId) => api.get(`/attendance/unit/${unitId}`);

// ** New Methods for Admin Panel **

// Fetch all students
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

// add student
export const addStudent = async (student) => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token found in localStorage");

  console.log("Payload being sent:", student); // Debugging

  try {
    const response = await axios.post(`${API_URL}/students`, student, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error saving student:", error.response?.data?.message || error.message);
    throw error;
  }
};

// Fetch all lecturers
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

// Fetch a lecturer by ID
export const getLecturerById = async (id) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/lecturer/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching lecturer:", error.response?.data || error.message);
    return null;
  }
};

// Add a new lecturer
export const addLecturer = async (lecturerData) => {
  try {
    const response = await api.post(`${API_URL}/lecturers/create`, lecturerData);
    return response.data;
  } catch (error) {
    console.error("Error adding lecturer:", error.response?.data || error.message);
    throw error;
  }
};

// update lecturer
export const updateLecturer = async (id, lecturerData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found in localStorage");
    return;
  }
  try {
    const response = await api.put(`${API_URL}/lecturers/update/${id}`, lecturerData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error updating lecturer:", error.response?.data || error.message);
    return null;
  }
};

// Delete a lecturer
export const deleteLecturer = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/lecturers/delete/${id}`);
    return response.data; // Or handle the success response as needed
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete lecturer';
  }
};

// import lecturers
export const importLecturers = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("csvFile", file);

  try {
    const response = await axios.post(`${API_URL}/lecturers/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Import error:", error.response?.data || error.message);
    throw error;
  }
};

// download lecturers
export const downloadLecturers = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/lecturers/download`, {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Create temporary download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "lecturers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("Export error:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch all units
export const getUnits = async () => {
  const token = localStorage.getItem("token"); // Retrieve stored token
  if (!token) {
    console.error("No token found in localStorage");
    return;
  }

  try {
    const response = await fetch("https://attendance-system-w70n.onrender.com/api/unit", {
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
export const getCourses = async (departmentId, courseName = "") => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("No token found in localStorage");
    return [];
  }

  try {
    let url = `https://attendance-system-w70n.onrender.com/api/course?department=${departmentId}`;
    if (courseName) {
      url += `&name=${encodeURIComponent(courseName)}`;
    }

    console.log("Fetching courses from URL:", url); // Debugging

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch courses");
    }

    const data = await response.json();
    console.log("Courses received:", data); // Debugging

    return data;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
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
    return response.data; //  the backend sends { present, absent }
  } catch (error) {
    console.error("Error fetching attendance rate:", error);
    return { present: 0, absent: 0 }; // Default to zero in case of error
  }
};

export const deleteStudent = async (studentId) => {
  const token = localStorage.getItem("token");

  if (!studentId) {
    console.error("Error: No student ID provided for deletion");
    throw new Error("Student ID is required");
  }

  if (!token) {
    console.error("Error: No authentication token found");
    throw new Error("Unauthorized. Please log in again.");
  }

  try {
    const response = await axios.delete(`${API_URL}/students/${studentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Student deleted successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting student:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to delete student");
  }
};

// import students
export const importStudents = async (file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("csvFile", file);

  try {
    const response = await axios.post(`${API_URL}/students/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
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

// export const createCourse = async (courseData) => {
//   const token = localStorage.getItem("token");
//   try {
//     const response = await axios.post(`${API_URL}/course/create`, courseData, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json"
//       }
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error creating course:", error.response?.data || error.message);
//     throw error;
//   }
// };

// // update a course
// export const updateCourse = async (id, courseData) => {
//   const token = localStorage.getItem("token");
//   try {
//     const response = await axios.put(`${API_URL}/course/${id}`, courseData, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json"
//       }
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error updating course:", error.response?.data || error.message);
//     throw error;
//   }
// };

// delete a course
export const deleteCourse = async (id) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.delete(`${API_URL}/course/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting course:", error.response?.data || error.message);
    throw error;
  }
};

// Fetch departments
export const getDepartments = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/department`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error.response?.data || error.message);
    return [];
  }
};

// export const addUnitToCourse = async (courseId, unitData) => {
//   const token = localStorage.getItem("token");
//   try {
//     const response = await axios.post(
//       `${API_URL}/course/${courseId}/units`,
//       unitData,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Error adding unit:", error.response?.data || error.message);
//     throw error;
//   }
// };

// Remove a unit from a course
export const removeUnitFromCourse = async (courseId, unitId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.delete(
      `${API_URL}/course/${courseId}/units/${unitId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error removing unit:", error.response?.data || error.message);
    throw error;
  }
};

// getUnitsByCourse function
export const getUnitsByCourse = async (courseId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/course/${courseId}/units`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching units:", error);
    throw error;
  }
};


// addUnitToCourse
export const addUnitToCourse = async (courseId, unitData) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.post(
      `${API_URL}/course/${courseId}/units`,
      {
        ...unitData,
        year: 1, // Add default year
        semester: 1 // Add default semester
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding unit:", error);
    throw error;
  }
};

export const getCourseByDepartment = async (departmentId, courseName) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(`${API_URL}/course?department=${departmentId}&name=${courseName}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching course:", error.response?.data || error.message);
    throw error;
  }
};

// export const updateLecturer = async (id, lecturerData) => {
//   const token = localStorage.getItem("token");
//   try {
//     const response = await axios.put(`${API_URL}/lecturers/${id}`, lecturerData, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json"
//       }
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error updating lecturer:", error.response?.data || error.message);
//     throw error;
//   }
// };

// Mark attendance for a student
export const markAttendance = async (sessionId, studentId, token, deviceId, qrToken, compositeFingerprint) => {
  try {
    // Validate inputs to help with debugging
    if (!sessionId || !studentId || !token || !deviceId || !qrToken) {
      console.error("Missing required parameters for markAttendance:", {
        hasSessionId: !!sessionId,
        hasStudentId: !!studentId,
        hasToken: !!token,
        hasDeviceId: !!deviceId,
        hasQrToken: !!qrToken
      });
      throw new Error("Missing required parameters for attendance marking");
    }

    console.log("Sending attendance request to:", `${API_URL}/attendance/mark`);

    const response = await axios.post(
      `${API_URL}/attendance/mark`,
      {
        sessionId,
        studentId,
        deviceId,
        qrToken,
        compositeFingerprint
      },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        // Add timeout to prevent hanging requests
        timeout: 10000
      }
    );

    console.log("Attendance API response:", response.status, response.data);
    return response.data;
  } catch (error) {
    // Enhanced error logging
    console.error("Attendance API error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    if (error.response) {
      // Backend error with response
      throw {
        message: error.response.data.message || "Server returned an error",
        code: error.response.data.code || `ERROR_${error.response.status}`,
        success: error.response.data.success || false,
        status: error.response.status
      };
    } else {
      // Network or unexpected error
      throw {
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
        success: false
      };
    }
  }
};

export const regenerateQR = async (sessionId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/sessions/regenerate-qr`,
      { sessionId, autoRotate: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error(error.message || "Network error");
  }
};

// downloadattendancereport
export const downloadAttendanceReport = (courseId, semester, year) =>
  api.get(`/attendance/report/${courseId}/${semester}/${year}`, {
    responseType: "blob",
  });

// Detect the current active session for the authenticated lecturer
export const detectCurrentSession = (lecturerId) => {
  if (!lecturerId) {
    return Promise.reject(new Error('Lecturer ID is required'));
  }
  return axios.get(`${API_URL}/sessions/current`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    params: { lecturerId } // Pass lecturerId as a query parameter
  });
};
export const detectCurrentSessionForUnit = (unitId) => {
  return axios.get(`${API_URL}/sessions/current/${unitId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
};

export const getSessionFeedback = async (sessionId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/feedback/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch feedback');
    }
    return await response.json();

  } catch (error) {
    throw new Error(error.message || "Failed to fetch feedback");
  }
};

export const getSessionQuiz = async (sessionId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/quizzes/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Access denied or quiz not found");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return null;
  }
};

/**
 * Submit quiz answers
 * @param {Object} quizSubmissionData - The quiz submission data (should include quizId and answers)
 * @returns {Promise<Object>} - The API response
 */
export const submitQuizAnswers = async (quizSubmissionData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found. Please log in.");
  }

  try {
    const response = await fetch(`${API_URL}/quizzes/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(quizSubmissionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to submit quiz answers");
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting quiz answers:", error);
    throw new Error(error.message || "Network error while submitting quiz answers.");
  }
};

// Session related endpoints
export const createSession = async ({ unitId, lecturerId, startTime, endTime }) => {
  if (!unitId || !lecturerId || !startTime || !endTime) {
    throw new Error('Missing required fields for session creation');
  }

  const maxRetries = 3;
  const delay = (retryCount) => Math.pow(2, retryCount) * 1000;

  // Format dates in UTC to avoid timezone issues
  const formattedStartTime = new Date(startTime).toISOString();
  const formattedEndTime = new Date(endTime).toISOString();

  console.log('Creating session with payload:', {
    unitId,
    lecturerId,
    startTime: formattedStartTime,
    endTime: formattedEndTime
  });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token missing');

      const response = await axios.post(
        `${API_URL}/sessions/create`,
        {
          unitId,
          lecturerId,
          startTime: formattedStartTime,
          endTime: formattedEndTime
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Validate response structure
      if (!response.data || !response.data.session) {
        throw new Error('Invalid response format from server');
      }

      const { session } = response.data;

      // Validate required session fields
      if (!session.startTime || !session.endTime || !session.qrCode) {
        throw new Error('Missing required session data');
      }

      // Return properly formatted session data
      return {
        _id: session._id,
        unit: session.unit,
        startTime: session.startTime,
        endTime: session.endTime,
        ended: false,
        qrCode: session.qrCode,
        qrToken: session.qrToken
      };
    } catch (error) {
      console.error(`Session creation attempt ${attempt + 1} failed:`, error);

      if (error.response?.status === 429 && attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay(attempt)));
        continue;
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw error;
    }
  }

  throw new Error('Failed to create session after multiple attempts');
};

export const getSession = async (sessionId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
};

export const getCurrentSession = async (selectedUnit) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/sessions/current/${selectedUnit}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching current session:", error);
    throw error;
  }
};

// New function for students
export const getActiveSessionForUnit = async (unitId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/sessions/active/${unitId}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching active session for unit:", error);
    throw error;
  }
};

export const checkSessionStatus = async (sessionId) => {
  try {
    // Add token for authentication to prevent 401 errors
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${API_URL}/sessions/status/${sessionId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    );
    console.log("Session status response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error checking session status:", error);
    throw error;
  }
};

// export const markAttendance = async (sessionId, studentId, token, deviceId, qrToken, compositeFingerprint) => {
//   try {
//     const response = await axios.post(
//       `${API_URL}/attendance/mark`,
//       { sessionId, studentId, deviceId, qrToken, compositeFingerprint },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response.data;
//   } catch (error) {
//     if (error.response) {
//       // Backend error with response
//       throw {
//         message: error.response.data.message,
//         code: error.response.data.code,
//         success: error.response.data.success
//       };
//     } else {
//       // Network or unexpected error
//       throw {
//         message: "Network error. Please check your connection.",
//         code: "NETWORK_ERROR",
//         success: false
//       };
//     }
//   }
// };

// export const regenerateQR = async (sessionId, token) => {
//   try {
//     const response = await axios.post(
//       `${API_URL}/sessions/regenerate-qr`,
//       { sessionId, autoRotate: true },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : new Error(error.message || "Network error");
//   }
// };

// ✅ End Session (Lecturer Ends the Attendance Session)
export const endSession = async (sessionId) => {
  try {
    // Remove the setLoading call that's causing the error
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/sessions/end`,
      { sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Add call to mark absentees after ending session
    await axios.post(
      `${API_URL}/attendance/mark-absentees`,
      { sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error("Error ending session:", error);
    throw error;
  }
};

// ✅ Mark Absent Students (After Session Ends)
export const markAbsent = async (sessionId) => {
  try {
    const response = await axios.post(`${API_URL}/attendance/mark-absent`, {
      sessionId
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network error");
  }
};

export const getStudentAttendance = async (studentId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(
      `${API_URL}/attendance/student/${studentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.data) {
      console.warn('Unexpected response format:', response.data);
      return { attendanceRecords: [], weeklyEvents: [], dailyEvents: [] }; // Default structure
    }

    // Ensure all expected fields are present, even if empty
    return {
      attendanceRecords: response.data.attendanceRecords || [],
      weeklyEvents: response.data.weeklyEvents || [],
      dailyEvents: response.data.dailyEvents || []
    };
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    if (error.response) {
      throw new Error(`Failed to fetch attendance: ${error.response.status} - ${error.response.data.message || error.message}`);
    } else {
      throw new Error(`Network error: ${error.message}`);
    }
  }
};

export const getSessionAttendance = async (sessionId) => {
  try {
    const token = getToken();
    const response = await axios.get(
      `${API_URL}/attendance/session/${sessionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!Array.isArray(response.data)) {
      console.warn('Unexpected response format, expected array:', response.data);
      return [];
    }
    const enrichedData = response.data.map(record => ({
      _id: record._id,
      regNo: record.student?.regNo || 'N/A',
      course: typeof record.student?.course === 'object' && record.student?.course?.name
        ? record.student.course.name
        : typeof record.student?.course === 'string'
          ? record.student.course
          : 'N/A',
      year: record.student?.year || 'N/A',
      semester: record.student?.semester || 'N/A',
      status: record.status ? record.status.toLowerCase() : 'N/A',
      unit: record.session?.unit || 'N/A'
    }));
    return enrichedData;
  } catch (error) {
    console.error('Error fetching session attendance:', error);
    throw error;
  }
};

// // Get current session for a specific unit
// export const getCurrentSession = async (selectedUnit) => {
//   try {
//     const token = getToken();
//     if (!token) throw new Error("Authentication token missing");
//     const response = await axios.get(`${API_URL}/sessions/current/${selectedUnit}`, {
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${token}`
//       }
//     });
//     return response.data; // Return the session object
//   } catch (error) {
//     if (error.response?.status === 404) {
//       return null; // Return null if no current session exists
//     }
//     console.error("Error fetching current session:", error);
//     throw error;
//   }
// };

// Get last ended session for a specific unit
export const getLastSession = async (unitId) => {
  const maxRetries = 3;
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication token missing");
      const response = await axios.get(`${API_URL}/sessions/last/${unitId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 429 && retryCount < maxRetries - 1) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
        continue;
      }
      console.error("Error fetching last session:", error);
      throw error;
    }
  }
};

//   try {
//     const token = localStorage.getItem('token');
//     if (!token) throw new Error("Authentication token missing");

//     const response = await axios.get(`${API_URL}/attendance/trends/${unitId}`, {
//       headers: {
//         "Authorization": `Bearer ${token}`,
//         "Content-Type": "application/json"
//       }
//     });

//     return response.data;
//   } catch (error) {
//     console.error("Error fetching attendance trends:", error);
//     throw error.response?.data || new Error("Failed to fetch attendance trends");
//   }
// };

export const getAttendanceTrends = async (unitId, startDate, endDate) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication token missing");

    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get(`${API_URL}/attendance/trends/${unitId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      params // Pass query parameters
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching attendance trends:", error);
    throw error.response?.data || new Error("Failed to fetch attendance trends");
  }
};

export const getCourseAttendanceRate = async (courseId, retries = 3, delayMs = 1000) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Authentication token missing");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(`${API_URL}/attendance/course-rate/${courseId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 429 && attempt < retries) {
        const waitTime = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`Rate limit hit for course ${courseId}, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      console.error(`Failed to fetch attendance rate for course ${courseId}:`, error.response?.data || error.message);
      throw error.response?.data || error; // Pass the error up to handle in AdminPanel
    }
  }
  throw new Error(`Max retries reached for course ${courseId}`);
};

export const getAllCourseAttendanceRates = async (courseIds) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("Authentication token missing");
  const response = await axios.get(`${API_URL}/attendance/course-rates`, {
    headers: { "Authorization": `Bearer ${token}` },
    params: { courseIds: courseIds.join(',') }
  });
  return response.data;
};

export const getStudentAttendanceByFilter = async (studentId, filter, startDate, endDate) => {
  const token = localStorage.getItem('token');
  let url = `https://attendance-system-w70n.onrender.com/api/attendance/student/${studentId}/filter?filter=${filter}`;
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }
  const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

export const submitFeedback = async (feedbackData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    'https://attendance-system-w70n.onrender.com/api/feedback/submit',
    feedbackData,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getFeedbackForLecturer = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    'https://attendance-system-w70n.onrender.com/api/feedback/lecturer',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getAllFeedback = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    'https://attendance-system-w70n.onrender.com/api/feedback/all',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getFeedbackSummary = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    'https://attendance-system-w70n.onrender.com/api/feedback/summary',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const getPendingFeedbackAttendance = () => {
  const token = localStorage.getItem('token');
  return axios.get(`${API_URL}/attendance/pending-feedback`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => res.data);
};

export const getLecturerUnitAttendance = async (unitId, startDate, endDate) => {
  const token = localStorage.getItem('token');
  const params = {};
  if (unitId) params.unitId = unitId;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await axios.get('https://attendance-system-w70n.onrender.com/api/attendance/unit/attendance', {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return response.data;
};
export const getEnrolledStudents = async (unitId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/units/${unitId}/students`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // Expecting an array of student objects
};

// New function to get unit-specific attendance rate
export const getUnitAttendanceRate = async (unitId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get(`${API_URL}/attendance/unit-rate/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching unit attendance rate:", error);
    throw error;
  }
};

export const getLecturerPastAttendance = async (date = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Authentication token missing");

    let url = `${API_URL}/attendance/past-lecturer`;

    // If date is provided, add it as a query parameter
    // Convert date to ISO string and handle timezone offset
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      url += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching past attendance:", error);
    throw error;
  }
};

export default api;
