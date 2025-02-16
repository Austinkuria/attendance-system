const express = require('express');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const upload = require("../middleware/uploadMiddleware");
const departmentRoutes = require("../routes/departmentRoutes");
const courseRoutes = require("../routes/courseRoutes");
const unitRoutes = require("../routes/unitRoutes");
const attendanceRoutes = require("../routes/attendance.routes");
const sessionRoutes = require("./sessionRoutes");
const router = express.Router();
const quizRoutes = require('./quizRoutes');
const { login, signup, getStudents, getLecturers, downloadStudents, deleteStudent, importStudents, getLecturerById, createAttendanceSession,createLecturer,updateLecturer } = require("../controllers/userController");
const { createDepartment, getDepartments } = require("../controllers/departmentController");
const { createCourse, getCoursesByDepartment, getCoursesByDepartmentById } = require("../controllers/courseController");
const { createUser, bulkUploadStudents } = require("../controllers/adminController");

router.use('/', userRoutes);
router.use('/students', studentRoutes);

// User routes
router.post("/auth/signup", signup);
router.post("/auth/login", login);

// Department routes
router.use("/department", departmentRoutes); 

// Course routes
router.use("/course", courseRoutes);

// Unit routes
router.use("/unit", unitRoutes);

// Attendance routes
router.use("/attendance/", authenticate, attendanceRoutes);

// Session routes
router.use("/sessions", authenticate, sessionRoutes);

// Students
router.get('/students', getStudents);

// Lecturers
router.get('/lecturers', getLecturers);

// Quiz routes
router.use('/quizzes', quizRoutes);

// Admin routes
router.post("/user", authenticate, authorize(["admin"]), createUser);
router.get("/download", downloadStudents);
router.delete("/students/:id", deleteStudent);

router.post('/lecturers/create', authenticate, authorize(["admin"]), createLecturer);
router.put('/lecturers/update/:id', authenticate, authorize(["admin"]), updateLecturer);

module.exports = router;
