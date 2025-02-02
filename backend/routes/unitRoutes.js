const express = require("express");
const { addUnit, getUnit, updateUnit, deleteUnit, getStudentUnits, getUnits } = require("../controllers/unitController");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");

router.post("/add", addUnit); // Create a new unit
router.get("/student/units", authenticate, getUnit); // Fetch units for a student (put this before the dynamic id)
router.get("/student/units", authenticate, getStudentUnits);
// Fetch all units (for admin)
router.get("/", authenticate, authorize(["admin"]), getUnits); // Use /unit to fetch all units

router.get("/:id", getUnit); // Get unit details by ID
router.put("/update/:id", updateUnit); // Update unit details
router.delete("/delete/:id", deleteUnit); // Delete a unit

module.exports = router;