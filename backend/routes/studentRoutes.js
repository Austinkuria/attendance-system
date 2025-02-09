const express = require("express");
const { check } = require('express-validator');
const { 
  getStudents,
  updateStudent,
  deleteStudent,
  importStudents,
  downloadStudents 
} = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Student management routes
router.get("/", authenticate, authorize(['admin']), getStudents);

router.put("/:id", authenticate, authorize(['admin']), [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('regNo').notEmpty().withMessage('Registration number is required'),
  check('course').notEmpty().withMessage('Course is required'),
  check('department').notEmpty().withMessage('Department is required'),
  check('year').isInt({ min: 1, max: 4 }).withMessage('Valid year is required'),
  check('semester').isInt({ min: 1, max: 2 }).withMessage('Valid semester is required')
], updateStudent);

router.delete("/:id", authenticate, authorize(['admin']), deleteStudent);

router.post("/upload", authenticate, authorize(['admin']), upload.single('csvFile'), importStudents);
router.get("/download", authenticate, authorize(['admin']), downloadStudents);

module.exports = router;
