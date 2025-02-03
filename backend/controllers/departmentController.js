const Department = require("../models/Department");

// Create a new department
const createDepartment = async (req, res) => {
    try {
        const { name } = req.body;

        const newDepartment = new Department({ name });
        await newDepartment.save();

        res.status(201).json({ message: "Department created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error creating department", error: err.message });
    }
};

// Get all departments
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        res.status(200).json(departments);
    } catch (err) {
        res.status(500).json({ message: "Error fetching departments", error: err.message });
    }
};

module.exports = { createDepartment, getDepartments };
