const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCoursesByDepartment,
  getAllCourses,
  updateCourse,
  deleteCourse,
  getUnitsByCourse,
  addUnitToCourse,
  removeUnitFromCourse
} = require('../controllers/courseController');

// Correct route order
router.post("/create", createCourse);
router.get("/", getAllCourses);
router.get('/:courseId/units', getUnitsByCourse);
router.get("/:departmentId", getCoursesByDepartment); 

// Unit management routes
router.post('/:courseId/units', addUnitToCourse);
router.delete('/:courseId/units/:unitId', removeUnitFromCourse);

module.exports = router;