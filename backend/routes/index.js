const express = require("express");
const { login, signup, getStudents, getLecturers, downloadStudents,deleteStudent, importStudents,getLecturerById } = require("../controllers/userController");
const { createDepartment, getDepartments } = require("../controllers/departmentController");
const { createCourse, getCoursesByDepartment } = require("../controllers/courseController");
const { createUser, bulkUploadStudents } = require("../controllers/adminController");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const upload = require("../middleware/uploadMiddleware");

const departmentRoutes = require("../routes/departmentRoutes"); 
const courseRoutes = require("../routes/courseRoutes");
const unitRoutes = require("../routes/unitRoutes");
const router = express.Router();

// User routes
router.post("/signup", signup); 
router.post("/login", login); 

// Department routes (admin only)
router.use("/department", departmentRoutes);  // Register department routes under /department

// Course routes (admin only)
router.use("/course", courseRoutes);

// Unit routes
router.use("/unit", unitRoutes);


// Define the /api/students route
router.get('/students', getStudents);

// Define the  route for lecture
router.get('/lecturers', getLecturers);

// Admin routes (admin only)
router.post("/user", authenticate, authorize(["admin"]), createUser);
router.post("/upload-students", authenticate, authorize(["admin"]), upload.single("csvFile"), bulkUploadStudents);

router.post("/upload", upload.single("csvFile"), importStudents);
router.get("/download", downloadStudents);
router.delete("/students/:id", deleteStudent);

// Update import route to use correct path
router.post('/students/upload', upload.single("csvFile"), importStudents);

// leecturerbyid
// router.get("/lecturer/:id", getLecturerById);

module.exports = router;