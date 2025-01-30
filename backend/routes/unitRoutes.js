const express = require("express");
const { addUnit, getUnit, updateUnit, deleteUnit, getStudentUnits } = require("../controllers/unitController");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");

router.post("/add", addUnit); // Create a new unit
router.get("/student/units", authenticate, getUnit); // Fetch units for a student (put this before the dynamic id)
router.get("/student/units", authenticate, getStudentUnits);
router.get("/:id", getUnit); // Get unit details by ID
router.put("/update/:id", updateUnit); // Update unit details
router.delete("/delete/:id", deleteUnit); // Delete a unit

module.exports = router;
