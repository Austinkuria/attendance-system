const express = require('express');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const upload = require("../middleware/uploadMiddleware");
const departmentRoutes = require("../routes/departmentRoutes");
const courseRoutes = require("../routes/courseRoutes");
const unitRoutes = require("../routes/unitRoutes");
const attendanceRoutes = require("./attendance.routes");
const sessionRoutes = require("./sessionRoutes");
const feedbackRoutes = require('./feedback.routes');
const authRoutes = require('./auth.routes');
const router = express.Router();
const { login, signup, getStudents, getLecturers, downloadStudents, deleteStudent, importStudents, getLecturerById, createSession, createLecturer, updateLecturer, deleteLecturer, importLecturers, downloadLecturers, sendResetLink, resetPassword, registerUser } = require("../controllers/userController");
const { createDepartment, getDepartments } = require("../controllers/departmentController");
const { createCourse, getCoursesByDepartment, getCoursesByDepartmentById } = require("../controllers/courseController");
const { createUser, bulkUploadStudents } = require("../controllers/adminController");
const { apiLimiter, sensitiveLimiter, authLimiter } = require('../middleware/rateLimiter');
const systemFeedbackRoutes = require('./systemFeedback.routes');
const logger = require('../utils/logger');

logger.info('Loading main routes...');
// Remove excessive debug logging that clutters production logs
if (process.env.NODE_ENV !== 'production') {
    logger.debug('Loading attendance routes');
}

router.use('/students', studentRoutes);

// User routes
router.post("/auth/signup", signup);
router.post("/auth/login", login);

// Add auth routes
router.use('/auth', authRoutes);

// Department routes
router.use("/department", departmentRoutes);

// Course routes
router.use("/course", courseRoutes);

// Unit routes
router.use("/unit", unitRoutes);

// Attendance routes
router.use("/attendance/", authLimiter, authenticate, attendanceRoutes);

// Session routes
router.use("/sessions", authLimiter, authenticate, sessionRoutes);

router.use('/', userRoutes);

router.use('/feedback', feedbackRoutes);
// Students
router.get('/students', getStudents);

// Lecturers
router.get('/lecturers', getLecturers);

// Admin routes
router.post("/user", authenticate, authorize(["admin"]), createUser);
router.get("/download", downloadStudents);
router.delete("/students/:id", deleteStudent);

router.post('/lecturers/create', authenticate, authorize(["admin"]), createLecturer);
router.put('/lecturers/update/:id', authenticate, authorize(["admin"]), updateLecturer);
router.delete('/lecturers/delete/:id', authenticate, authorize(['admin']), deleteLecturer);
router.post('/lecturers/upload', authenticate, authorize(['admin']), upload.single('csvFile'), importLecturers);
router.get('/lecturers/download', authenticate, authorize(['admin']), downloadLecturers);

router.post("/auth/reset-password", sensitiveLimiter, sendResetLink);
router.put("/auth/reset-password/:token", resetPassword);

router.use("/system-feedback", authenticate, systemFeedbackRoutes);

module.exports = router;