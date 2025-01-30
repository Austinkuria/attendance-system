const express = require("express");
const { createDepartment, getDepartments } = require("../controllers/departmentController");
const router = express.Router();

// POST route for creating a department
router.post("/create", createDepartment);

// GET route for fetching all departments
router.get("/", getDepartments);

module.exports = router;
