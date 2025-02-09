const Unit = require("../models/Unit");
const User = require("../models/User");
const Course = require("../models/Course");
const authenticate = require("../middleware/authMiddleware");
const router = require("express").Router();

// Add a new unit
const addUnit = async (req, res) => {
    try {
        const { name, code, course, year, semester, lecturer, studentsEnrolled } = req.body;

        const newUnit = new Unit({
            name,
            code,
            course,
            year,
            semester,
            lecturer,
            studentsEnrolled
        });

        await newUnit.save();
        res.status(201).json({ message: "Unit created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error creating unit", error: err.message });
    }
};

// Fetch units for a specific student
const getUnit = async (req, res) => {
    try {
        const units = await Unit.find({ studentsEnrolled: req.user.userId }).populate("course lecturer");
        if (!units) {
            return res.status(404).json({ message: "No units found for this student" });
        }
        res.status(200).json(units);
    } catch (err) {
        res.status(500).json({ message: "Error fetching units", error: err.message });
    }
};

// Update unit details by ID
const updateUnit = async (req, res) => {
    try {
        const updatedUnit = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUnit) {
            return res.status(404).json({ message: "Unit not found" });
        }
        res.status(200).json(updatedUnit);
    } catch (err) {
        res.status(500).json({ message: "Error updating unit", error: err.message });
    }
};

// Delete unit by ID
const deleteUnit = async (req, res) => {
    try {
        const deletedUnit = await Unit.findByIdAndDelete(req.params.id);
        if (!deletedUnit) {
            return res.status(404).json({ message: "Unit not found" });
        }
        res.status(200).json({ message: "Unit deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting unit", error: err.message });
    }
};

const getStudentUnits = async (req, res) => {
    try {
      const studentId = req.user.id; // Get student ID from JWT
      const student = await User.findById(studentId).populate("units");
  
      if (!student || !student.units.length) {
        return res.status(404).json({ message: "No units found for this student." });
      }
  
      res.set("Cache-Control", "no-store"); // Prevent caching of the response
      res.json(student.units);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

// Get all units (for admin)
const getUnits = async (req, res) => {
    try {
        const units = await Unit.find();  // Ensure Unit model exists
        res.json(units);
    } catch (error) {
        console.error("Error fetching units:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Fetch units for a specific lecturer
const getLecturerUnits = async (req, res) => {
    try {
      const { lecturerId } = req.params;
      const lecturer = await User.findById(lecturerId)
        .populate({
          path: 'assignedUnits',
          populate: {
            path: 'course',
            model: 'Course'
          }
        });
  
      if (!lecturer) {
        return res.status(404).json({ message: "Lecturer not found" });
      }
  
      res.status(200).json(lecturer.assignedUnits);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching lecturer units", 
        error: error.message 
      });
    }
  };
  
module.exports = { addUnit, getUnit, updateUnit, deleteUnit, getStudentUnits, getUnits, getLecturerUnits };