const express = require("express");
const { check } = require('express-validator');
const { 
  registerUser, 
  login, 
  getUserProfile, 
  updateUserProfile, 
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

// Auth routes
router.post("/auth/login", [
  check('email').isEmail().withMessage('Enter a valid email address'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], loginUser);

router.post("/auth/signup", [
  check('firstName').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long').matches(/^[A-Za-z]+$/).withMessage('First name must not contain numbers'),
  check('lastName').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long').matches(/^[A-Za-z]+$/).withMessage('Last name must not contain numbers'),
  check('email').isEmail().withMessage('Enter a valid email address'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], registerUser);

// Profile routes
router.get("/users/profile", authenticate, getUserProfile);
router.put("/users/profile/update", authenticate, [
  check('firstName').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
  check('lastName').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long'),
  check('email').isEmail().withMessage('Enter a valid email address')
], updateUserProfile);

// Student management routes
router.get("/students", authenticate, authorize(['admin']), getStudents);

router.put("/students/:id", authenticate, authorize(['admin']), [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('regNo').notEmpty().withMessage('Registration number is required'),
  check('course').notEmpty().withMessage('Course is required'),
  check('department').notEmpty().withMessage('Department is required'),
  check('year').isInt({ min: 1, max: 4 }).withMessage('Valid year is required'),
  check('semester').isInt({ min: 1, max: 2 }).withMessage('Valid semester is required')
], updateStudent);

router.delete("/students/:id", authenticate, authorize(['admin']), deleteStudent);

router.post("/students/upload", authenticate, authorize(['admin']), upload.single('csvFile'), importStudents);
router.get("/students/download", authenticate, authorize(['admin']), downloadStudents);

module.exports = router;
