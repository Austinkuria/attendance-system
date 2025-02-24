const Course = require('../models/Course');
const Unit = require('../models/Unit'); //  Import the Unit model
const mongoose = require('mongoose');

// Create a new course
const createCourse = async (req, res) => {
  try {
    console.log("Received data:", req.body);

    const { name, code, departmentId } = req.body;

    if (!name || !code || !departmentId) {
      return res.status(400).json({ message: "Name, code, and department ID are required" });
    }

    console.log("Checking if course already exists...");

    // Check if a course with the same name or code already exists in the department
    const existingCourse = await Course.findOne({
      $or: [{ name }, { code }],
      department: departmentId,
    });

    if (existingCourse) {
      return res.status(409).json({ message: "Course with this name or code already exists in this department" });
    }

    console.log("No duplicate course found, proceeding to save...");

    const newCourse = new Course({
      name,
      code,
      department: departmentId,
    });

    await newCourse.save();
    res.status(201).json({ message: "Course created successfully", course: newCourse });

  } catch (err) {
    console.error("Error creating course:", err.message);
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
    const courses = await Course.find().populate({
      path: "department",
      select: "name", // Only fetch department name to reduce unnecessary data
      strictPopulate: false // Prevent errors if department is missing
    });

    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching courses", error: err.message });
  }
};

// const getAllCourses = async (req, res) => {
//   try {
//       const courses = await Course.find().populate("department");
//       res.status(200).json(courses);
//   } catch (err) {
//       res.status(500).json({ message: "Error fetching courses", error: err.message });
//   }
// };

// Update a course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, departmentId } = req.body;

    if (!name || !code || !departmentId) {
      return res.status(400).json({ error: "Name, code, and department ID are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ error: "Invalid Course ID or Department ID format" });
    }

    console.log("Checking if another course already exists with the same name or code...");

    // Check for duplicates excluding the current course being updated
    const existingCourse = await Course.findOne({
      $or: [{ name }, { code }],
      department: departmentId,
      _id: { $ne: id }, // Exclude the current course from the check
    });

    if (existingCourse) {
      return res.status(409).json({ error: "Another course with this name or code already exists in this department" });
    }

    console.log("No duplicate course found, proceeding to update...");

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { name, code, department: departmentId },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    console.log("Updated Course:", updatedCourse);
    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: error.message });
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

// Remove unit from course
const removeUnitFromCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Ensure the unit exists before removing it
    const unit = await Unit.findById(req.params.unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    course.units.pull(req.params.unitId);
    await course.save();
    await Unit.findByIdAndDelete(req.params.unitId);

    res.status(200).json({ message: "Unit removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// Get units for a course
const getUnitsByCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate('units')
      .exec();

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course.units);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Add unit to course
const addUnitToCourse = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ 
        success: false,
        message: "Name and code are required" 
      });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    const unit = new Unit({
      name,
      code,
      course: course._id,
      year: req.body.year || 1,
      semester: req.body.semester || 1
    });

    await unit.save();
    course.units.push(unit);
    await course.save();

    res.status(201).json({ 
      success: true,
      message: "Unit added successfully",
      data: unit 
    });
  } catch (error) {
    console.error("Error adding unit:", error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding unit',
      error: error.message 
    });
  }
};

module.exports = { createCourse, getCoursesByDepartment, getCoursesByDepartmentById, getAllCourses, updateCourse, deleteCourse, getUnitsByCourse, addUnitToCourse, removeUnitFromCourse };
