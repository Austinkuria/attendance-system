const express = require("express");
const { check } = require('express-validator');
const { 
  getStudents,
  updateStudent,
  deleteStudent,
  importStudents,
  downloadStudents,
  registerUser,
  updateStudentV2,
  getStudentUnits,
  enrollStudentInUnit,
  removeStudentFromUnit
} = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const upload = require("../middleware/uploadMiddleware");
const departmentRoutes = require("./departmentRoutes");

const router = express.Router();

// Student management routes
router.get("/", authenticate, authorize(['admin']), getStudents);

// Keep the original route for backwards compatibility
router.put("/:id", authenticate, authorize(['admin']), [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('regNo').notEmpty().withMessage('Registration number is required'),
  check('course').custom(value => {
    if (!value || (typeof value !== 'string' && typeof value !== 'object')) {
      throw new Error('Invalid course selection');
    }
    return true;
  }),  
  check('department').notEmpty().withMessage('Department is required'),
  check('year').isInt({ min: 1, max: 4 }).withMessage('Valid year is required'),
  check('semester').isInt({ min: 1, max: 3 }).withMessage('Valid semester is required')
], updateStudent);

// Add new v2 route with more flexible validation
router.put("/v2/:id", authenticate, authorize(['admin']), [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('regNo').notEmpty().withMessage('Registration number is required'),
  // More lenient validation for course and department
  check('year').isInt({ min: 1, max: 4 }).withMessage('Valid year is required'),
  check('semester').isInt({ min: 1, max: 3 }).withMessage('Valid semester is required')
], updateStudentV2);

router.delete("/:id", authenticate, authorize(['admin']), deleteStudent);
router.get("/download", authenticate, authorize(['admin']), downloadStudents);
router.post("/upload", authenticate, authorize(['admin']), upload.single('csvFile'), importStudents);

router.post("/", authenticate, authorize(["admin"]), registerUser);

// Student-unit management routes
router.get("/:studentId/units", authenticate, authorize(['admin']), getStudentUnits);
router.post("/:studentId/units", authenticate, authorize(['admin']), enrollStudentInUnit);
router.delete("/:studentId/units/:unitId", authenticate, authorize(['admin']), removeStudentFromUnit);

router.use("/departments", departmentRoutes);

module.exports = router;
