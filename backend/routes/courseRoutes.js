const express = require("express");
const { createCourse, getCoursesByDepartment } = require("../controllers/courseController");
const router = express.Router();

// Route to create a new course
router.post("/create", createCourse);

// Route to get courses by department
router.get("/:departmentId", getCoursesByDepartment);

module.exports = router;
