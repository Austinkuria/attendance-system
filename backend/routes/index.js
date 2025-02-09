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

router.use('/', userRoutes);
router.use('/students', studentRoutes);

// lecturer routes
router.use('/')
router.post("/auth/signup",userRoutes);
router.post("/auth/login", userRoutes);

// Department routes (admin only)
router.use("/department", departmentRoutes);  // Register department routes under /department

// Course routes (admin only)
router.use("/course", courseRoutes);

// Unit routes
router.use("/unit", unitRoutes);

// Attendance routes
router.use("/attendance/", authenticate, attendanceRoutes);

// Session routes
router.use("/sessions", authenticate, sessionRoutes);


// Define the  route for lecture
router.get('/lecturers', userRoutes);

// Admin routes (admin only)
router.post("/user", authenticate, authorize(["admin"]), userRoutes);
router.post("/upload-students", authenticate, authorize(["admin"]), upload.single("csvFile"), userRoutes);
router.post("/upload", upload.single("csvFile"),userRoutesRoutes);
router.get("/download",userRoutes);
router.delete("/students/:id",userRoutes);

// Update import route to use correct path
router.post('/students/upload', upload.single("csvFile"), userRoutes);
module.exports = router;
