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

  // Update a course
const updateCourse = async (req, res) => {
    try {
      const { id } = req.params;
      const updatedCourse = await Course.findByIdAndUpdate(id, req.body, { new: true });
      res.status(200).json(updatedCourse);
    } catch (err) {
      res.status(500).json({ message: "Error updating course", error: err.message });
    }
  };
  
  // Delete a course
  const deleteCourse = async (req, res) => {
    try {
      const { id } = req.params;
      await Course.findByIdAndDelete(id);
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
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      const unit = new Unit({
        ...req.body,
        course: req.params.courseId
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

module.exports = { createCourse, getCoursesByDepartment, getAllCourses, updateCourse, deleteCourse, getUnitsByCourse, addUnitToCourse, removeUnitFromCourse };
