const express = require("express");
const { createDepartment, getDepartments } = require("../controllers/departmentController");
const router = express.Router();

// POST route for creating a department
router.post("/create", createDepartment);

// GET route for fetching all departments
router.get("/", getDepartments);

// Backend endpoint to fetch departments
router.get("/department", async (req, res) => {
    try {
      const departments = await getDepartments.find();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });

module.exports = router;
