const Course = require('../models/Course');
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

  // Remove unit from course
//   const removeUnitFromCourse = async (req, res) => {
//     try {
//       const course = await Course.findById(req.params.courseId);
//       course.units.pull(req.params.unitId);
//       await course.save();
      
//       await Unit.findByIdAndDelete(req.params.unitId);
      
//       res.status(200).json({ message: "Unit removed successfully" });
//     } catch (err) {
//       res.status(500).json({ message: "Error removing unit", error: err.message });
//     }
//   };

  
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
        return res.status(400).json({ message: "Name and code are required" });
      }
  
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      const unit = new Unit({
        name,
        code,
        course: course._id,
        // Add default values or additional fields as needed
        year: req.body.year || 1,
        semester: req.body.semester || 1
      });
  
      await unit.save();
      course.units.push(unit);
      await course.save();
  
      res.status(201).json(unit);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
  // Remove unit from course
  const removeUnitFromCourse = async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      course.units.pull(req.params.unitId);
      await course.save();
      await Unit.findByIdAndDelete(req.params.unitId);
  
      res.status(200).json({ message: 'Unit removed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };

module.exports = { createCourse, getCoursesByDepartment,getCoursesByDepartmentById , getAllCourses, updateCourse, deleteCourse, getUnitsByCourse, addUnitToCourse, removeUnitFromCourse };
