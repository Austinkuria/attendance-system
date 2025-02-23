import axios from "axios";

// Use environment variable for base URL, with fallback
const API_URL = import.meta.env.VITE_API_URL || "https://attendance-system-w70n.onrender.com/api";

const api = axios.create({
  baseURL: API_URL, // Use baseURL instead of API_URL as a property
});

// Function to get token from local storage
const getToken = () => localStorage.getItem("token");

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

// Generate QR code for attendance (for lecturers)
// export const generateQRCode = () => {
//   return api.get("/sessions/current");
// };


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

// export const getUnitsByCourse = async (courseId) => {
//   const token = localStorage.getItem("token");
//   try {
//     const response = await axios.get(`${API_URL}/course/${courseId}/units`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching units:", error);
//     return [];
//   }
// };

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

// Fetch attendance rate for a specific course
// export const getCourseAttendanceRate = async (courseId) => {
//   try {
//     const response = await api.get(`/attendance/rate/${courseId}`);
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching course attendance rate:", error);
//     return { present: 0, absent: 0 };
//   }
// };
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

// create a new course
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

// update a course
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

// Fetch courses by department
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

// // update lecturer
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
// export const markAttendance = (attendance) => api.post("/attendance", attendance);

// downloadattendancereport
export const downloadAttendanceReport = (courseId, semester, year) =>
  api.get(`/attendance/report/${courseId}/${semester}/${year}`, {
    responseType: "blob",
  });


// getquiz
export const getQuiz = (unitId) => api.get(`/quiz/${unitId}`);

// sendquiz
export const sendQuiz = (quizData) => api.post("/quiz", quizData);

// getquizresults
export const getQuizResults = (quizId) => api.get(`/quiz/results/${quizId}`);


// export const getUnitEnrollments = (unitId) => api.get(`/unit/${unitId}/students`);
// export const createSession = async (attendanceData) => {
//   const token = localStorage.getItem("token"); // Retrieve the token from local storage
//   try {
//     const response = await api.post("https://attendance-system-w70n.onrender.com/api/attendance/create", attendanceData, {
//       headers: {
//         Authorization: `Bearer ${token}`, // Include the token in the headers
//         "Content-Type": "application/json"
//       }
//     });
//     return response.data; // Return the response data
//   } catch (error) {
//     console.error("Error creating attendance session:", error.response?.data || error.message);
//     throw error; // Rethrow the error for handling in the calling function
//   }
// };



export const detectCurrentSession = () => {
  return axios.get(`${API_URL}/sessions/current`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
};

// export const endCurrentSession = () => {
//   return axios.patch(`${API_URL}/sessions/current`, {
//     action: 'end'
//   }, {
//     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//   });
// };

// // Function to mark student attendance
// export const markStudentAttendance = async (sessionId, qrCode) => {
//   try {
//     const token = localStorage.getItem('token');
//     const response = await axios.post(
//       `${API_URL}/attendance/mark`,
//       { sessionId, qrCode },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     return response.data;
//   } catch (error) {
//     console.error('Error marking attendance:', error);
//     throw error;
//   }
// };


/**
 * Create a new quiz
 * @param {Object} quizData - The quiz data to be created
 * @returns {Promise<Object>} - The created quiz data
 */
export const createQuiz = async (quizData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found. Please log in.");
  }

  // Validate required fields
  if (!quizData.title || !quizData.unit || !quizData.questions) {
    throw new Error("Missing required fields: title, unit, or questions.");
  }

  // Format the quiz data
  const formattedQuizData = {
    ...quizData,
    createdAt: new Date().toISOString(), // Automatically add the current date
  };

  try {
    const response = await fetch(`${API_URL}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formattedQuizData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create quiz');
    }

    return await response.json();
  } catch (error) {
    console.error("Network error:", error);
    throw new Error(error.message || "Network error. Please check your connection.");
  }
};

/**
* Fetch all quizzes (with optional filtering)
* @param {Object} filters - Optional filters (e.g., lecturerId, date)
* @returns {Promise<Array>} - A list of quizzes
*/
export const getQuizzes = async (filters = {}) => {
  try {
    // Construct query parameters from filters
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/quizzes?${queryParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch quizzes');
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return [];
  }
};

/**
* Fetch past quizzes for a lecturer (with optional filtering)
* @param {string} lecturerId - The ID of the lecturer
* @param {Object} filters - Optional filters (e.g., date)
* @returns {Promise<Array>} - A list of past quizzes
*/
export const getPastQuizzes = async (lecturerId, filters = {}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found. Please log in.");
  }

  try {
    const queryParams = new URLSearchParams({
      lecturerId,
      ...filters,
    }).toString();

    const response = await fetch(`${API_URL}/quizzes?${queryParams}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.message === "Token is not valid") {
        // Token is invalid or expired
        localStorage.removeItem("token"); // Clear the invalid token
        window.location.href = "/auth/login"; // Redirect to login page
      }
      throw new Error(errorData.message || 'Failed to fetch past quizzes');
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching past quizzes:", error);
    return [];
  }
};

/**
* Fetch quizzes by date
* @param {string} date - The date to filter quizzes by (in ISO format)
* @returns {Promise<Array>} - A list of quizzes created on the specified date
*/
export const getQuizzesByDate = async (date) => {
  if (!date) {
    throw new Error("Date is required.");
  }

  try {
    const response = await fetch(`${API_URL}/quizzes?date=${date}`);
    if (!response.ok) {
      throw new Error('Failed to fetch quizzes by date');
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching quizzes by date:", error);
    return [];
  }
};

export const deleteQuiz = async (quizId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token found. Please log in.");
  }

  try {
    const response = await axios.delete(`${API_URL}/quizzes/${quizId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting quiz:", error.response?.data || error.message);
    throw error;
  }
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




export const submitFeedback = async (feedbackData) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(feedbackData),
    });
    return response.json();
  } catch (error) {
    throw new Error(error.message || "Failed to submit feedback");
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
  const maxRetries = 3; // Maximum number of retries
  const delay = (retryCount) => Math.pow(2, retryCount) * 1000; // Exponential backoff delay

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const token = localStorage.getItem('token');

      // Log the request payload before making the API call
      console.log("API Call - Creating session with:", { unitId, lecturerId, startTime, endTime });

      const response = await axios.post(
        `${API_URL}/sessions/create`,
        { unitId, lecturerId, startTime, endTime },  // Ensure correct payload
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.warn(`Attempt ${attempt + 1} failed: Too many requests. Retrying in ${delay(attempt) / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay(attempt))); // Wait before retrying
      } else {
        console.error("Error in API Call - createSession:", error.response ? error.response.data : error.message);
        throw error; // Re-throw the error if it's not a 429
      }
    }
  }
  throw new Error("Max retries reached. Unable to create session.");
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

// // ✅ Mark Attendance (Student Scans QR Code)
// export const markAttendance = async (sessionId, studentId, token) => {
//   try {
//     // Validate studentId is a valid ObjectId format
//     if (!/^[0-9a-fA-F]{24}$/.test(studentId)) {
//       throw new Error("Invalid student ID format");
//     }

//     const response = await axios.post(
//       `${API_URL}/attendance/mark`,
//       { sessionId, studentId },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : new Error(error.message || "Network error");
//   }
// };
export const markAttendance = async (sessionId, studentId, token, deviceId, qrToken) => {
  try {
    if (!/^[0-9a-fA-F]{24}$/.test(studentId)) {
      throw new Error("Invalid student ID format");
    }

    const response = await axios.post(
      `${API_URL}/attendance/mark`,
      { sessionId, studentId, deviceId, qrToken },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error(error.message || "Network error");
  }
};

export const regenerateQR = async (sessionId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/sessions/regenerate-qr`,
      { sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error(error.message || "Network error");
  }
};

// ✅ End Session (Lecturer Ends the Attendance Session)
export const endSession = async (sessionId) => {
  try {
    const response = await axios.post(`${API_URL}/sessions/end`, {
      sessionId
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error("Network error");
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

// export const getStudentAttendance = async (studentId) => {
//   try {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       throw new Error('No authentication token found');
//     }

//     const response = await axios.get(
//       `${API_URL}/attendance/student/${studentId}`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     if (!response.data || !response.data.attendanceRecords) {
//       console.warn('Unexpected response format:', response.data);
//       return { attendanceRecords: [] }; // Return empty array if no data
//     }

//     return response.data;
//   } catch (error) {
//     console.error('Error fetching student attendance:', error);
//     if (error.response) {
//       throw new Error(`Failed to fetch attendance: ${error.response.status} - ${error.response.data.message || error.message}`);
//     } else {
//       throw new Error(`Network error: ${error.message}`);
//     }
//   }
// };

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

// Get current session for a specific unit
export const getCurrentSession = async (selectedUnit) => {
  try {
    const token = getToken();
    if (!token) throw new Error("Authentication token missing");
    const response = await axios.get(`${API_URL}/sessions/current/${selectedUnit}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    return response.data; // Return the session object
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // Return null if no current session exists
    }
    console.error("Error fetching current session:", error);
    throw error;
  }
};

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

// export const getAttendanceTrends = async (unitId) => {
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
export default api;
