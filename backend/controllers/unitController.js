const Unit = require("../models/Unit");
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
const getUnits = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }
    const response = await fetch("http://localhost:5000/api/unit", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch units");
    }
    return response.json();
  };

module.exports = { addUnit, getUnit, updateUnit, deleteUnit, getStudentUnits, getUnits };
