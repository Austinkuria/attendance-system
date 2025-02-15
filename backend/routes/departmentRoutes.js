const express = require("express");
const { createDepartment, getDepartments } = require("../controllers/departmentController");
const router = express.Router();
const Department = require("../models/Department");

// POST route for creating a department
router.post("/create", createDepartment);

// GET route for fetching all departments
router.get("/", getDepartments);

// Backend endpoint to fetch departments
router.get("/department", getDepartments);

  //fetch department by ID
  router.get("/:id", async (req, res) => {
    try {
        const department = await Department.findById(req.params.id).populate("courses");
        if (!department) {
            return res.status(404).json({ message: "Department not found" });
        }
        res.status(200).json(department);
    } catch (error) {
        res.status(500).json({ message: "Error fetching department", error: error.message });
    }
});


module.exports = router;
