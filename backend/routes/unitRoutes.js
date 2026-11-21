const express = require("express");
const {
  addUnit,
  getUnit,
  updateUnit,
  deleteUnit,
  getStudentUnits,
  getUnitsByCourse,
  getUnits,
  getLecturerUnits,
  bulkDeleteUnits,
  bulkUploadUnits,
  downloadUnitTemplate
} = require("../controllers/unitController");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Batch and template routes (must precede dynamic :id routes)
router.get("/template", authenticate, authorize(["admin", "super_admin"]), downloadUnitTemplate);
router.post("/upload", authenticate, authorize(["admin", "super_admin"]), upload.single("file"), bulkUploadUnits);
router.post("/bulk-delete", authenticate, authorize(["admin", "super_admin"]), bulkDeleteUnits);

router.post("/add", addUnit); // Create a new unit
router.get("/student/units", authenticate, getStudentUnits); // Fetch units for a student
router.get("/", authenticate, authorize(["admin", "super_admin"]), getUnits); // Fetch all units

router.get("/course/:courseId/units", authenticate, getUnitsByCourse);
router.get("/lecturer/units/me", authenticate, getLecturerUnits);
router.get("/lecturer/units/:lecturerId", authenticate, getLecturerUnits);

router.get("/:id", getUnit); // Get unit details by ID
router.put("/update/:id", updateUnit); // Update unit details
router.delete("/delete/:id", deleteUnit); // Delete a unit

module.exports = router;