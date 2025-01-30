const Course = require("../models/course");

// Create a new course
const createCourse = async (req, res) => {
    try {
        const { name, code, departmentId } = req.body;

        const newCourse = new Course({
            name,
            code,
            department: departmentId
        });

        await newCourse.save();
        res.status(201).json({ message: "Course created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error creating course", error: err.message });
    }
};

// Get all courses for a specific department
const getCoursesByDepartment = async (req, res) => {
    try {
        const departmentId = req.params.departmentId;
        const courses = await Course.find({ department: departmentId });

        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({ message: "Error fetching courses", error: err.message });
    }
};

// Get all courses
const getAllCourses = async (req, res) => {
    try {
      const courses = await Course.find().populate('department');
      res.status(200).json(courses);
    } catch (err) {
      res.status(500).json({ message: "Error fetching courses", error: err.message });
    }
  };

module.exports = { createCourse, getCoursesByDepartment, getAllCourses };
