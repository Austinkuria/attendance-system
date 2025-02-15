
const Course = require("../models/Course");

// Create a new course
const createCourse = async (req, res) => {
    try {
        const { name, code, departmentId } = req.body;

        if (!name || !code || !departmentId) {
            return res.status(400).json({ message: "Name, code, and department ID are required" });
        }

        const newCourse = new Course({
            name,
            code,
            department: departmentId
        });

        await newCourse.save();
        res.status(201).json({ message: "Course created successfully", course: newCourse });
    } catch (err) {
        res.status(500).json({ message: "Error creating course", error: err.message });
    }
};

// Get all courses for a specific department
const getCoursesByDepartment = async (req, res) => {
    try {
        const { department, name } = req.query;

        console.log("Received Query Params:", req.query); // Debugging

        if (!department) {
            return res.status(400).json({ message: "Department ID is required" });
        }

        let filter = { department };

        if (name) {
            filter.name = { $regex: new RegExp(name.trim(), "i") }; // Case-insensitive search
        }

        console.log("MongoDB Filter:", filter); // Debugging

        const courses = await Course.find(filter);
        console.log("Courses Found:", courses); // Debugging

        if (!courses.length) {
            return res.status(404).json({ message: "No courses found for this department" });
        }

        res.status(200).json(courses);
    } catch (err) {
        console.error("Error fetching courses:", err);
        res.status(500).json({ message: "Error fetching courses", error: err.message });
    }
};

// Get courses by department using path parameter
const getCoursesByDepartmentById = async (req, res) => {
    try {
        const departmentId = req.params.departmentId;

        console.log("Fetching courses for department:", departmentId); // Debugging

        const courses = await Course.find({ department: departmentId });

        if (!courses.length) {
            return res.status(404).json({ message: "No courses found for this department" });
        }

        res.status(200).json(courses);
    } catch (err) {
        console.error("Error fetching courses:", err);
        res.status(500).json({ message: "Error fetching courses", error: err.message });
    }
};

// Get all courses
const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate("department");
        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({ message: "Error fetching courses", error: err.message });
    }
};

// Update a course
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCourse = await Course.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json(updatedCourse);
    } catch (err) {
        res.status(500).json({ message: "Error updating course", error: err.message });
    }
};

// Delete a course
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.status(200).json({ message: "Course deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting course", error: err.message });
    }
};

module.exports = {
    createCourse,
    getCoursesByDepartment,
    getCoursesByDepartmentById,
    getAllCourses,
    updateCourse,
    deleteCourse
};
