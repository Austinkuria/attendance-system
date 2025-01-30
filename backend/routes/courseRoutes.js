const express = require("express");
const { createCourse, getCoursesByDepartment, getAllCourses } = require("../controllers/courseController");
const router = express.Router();

// Route to create a new course
router.post("/create", createCourse);

// Get all courses
router.get("/", getAllCourses);

// Route to get courses by department
router.get("/:departmentId", getCoursesByDepartment);

module.exports = router;
