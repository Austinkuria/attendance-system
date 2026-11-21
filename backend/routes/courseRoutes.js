const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const {
  createCourse,
  getCoursesByDepartment,
  getCoursesByDepartmentById,
  getAllCourses,
  updateCourse,
  deleteCourse,
  getUnitsByCourse,
  addUnitToCourse,
  removeUnitFromCourse,
  bulkDeleteCourses,
  bulkUploadCourses,
  downloadCourseTemplate
} = require('../controllers/courseController');

// Batch and template routes (must precede dynamic :id routes)
router.get("/template", authenticate, authorize(['admin', 'super_admin']), downloadCourseTemplate);
router.post("/upload", authenticate, authorize(['admin', 'super_admin']), upload.single('file'), bulkUploadCourses);
router.post("/bulk-delete", authenticate, authorize(['admin', 'super_admin']), bulkDeleteCourses);

// Course management routes
router.post("/create", createCourse);
router.get("/", getAllCourses);
router.get('/:courseId/units', getUnitsByCourse);
router.get("/by-department", getCoursesByDepartment); // For query-based search
router.get("/:departmentId", getCoursesByDepartmentById); // For path-based search
router.put("/:id", updateCourse); // handle course updates
router.delete("/:id", deleteCourse); // handle course deletions

// Unit management routes
router.post('/:courseId/units', addUnitToCourse);
router.delete('/:courseId/units/:unitId', removeUnitFromCourse);

module.exports = router;