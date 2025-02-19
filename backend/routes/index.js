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
const { login, signup, getStudents, getLecturers, downloadStudents, deleteStudent, importStudents, getLecturerById, createSession, createLecturer, updateLecturer, deleteLecturer, importLecturers, downloadLecturers, sendResetLink, resetPassword, registerUser } = require("../controllers/userController");
const { createDepartment, getDepartments } = require("../controllers/departmentController");
const { createCourse, getCoursesByDepartment, getCoursesByDepartmentById } = require("../controllers/courseController");
const { createUser, bulkUploadStudents } = require("../controllers/adminController");
const rateLimit = require('express-rate-limit');

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

router.use('/students', studentRoutes);

// User routes
router.post("/auth/signup", signup,);
router.post("/auth/login", login);

// Department routes
router.use("/department", departmentRoutes);

// Course routes
router.use("/course", courseRoutes);

// Unit routes
router.use("/unit", unitRoutes);

// Attendance routes
router.use("/attendance/", authRateLimiter, authenticate, attendanceRoutes);

// Session routes
router.use("/sessions", authRateLimiter, authenticate, sessionRoutes);

router.use('/', userRoutes);
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
router.delete('/lecturers/delete/:id', authenticate, authorize(['admin']), deleteLecturer);
router.post('/lecturers/upload', authenticate, authorize(['admin']), upload.single('csvFile'), importLecturers);
router.get('/lecturers/download', authenticate, authorize(['admin']), downloadLecturers);

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
});
router.post("/auth/reset-password", resetPasswordLimiter, sendResetLink);
router.put("/auth/reset-password/:token", resetPassword); router.put("/auth/reset-password/:token", resetPassword);

module.exports = router;
