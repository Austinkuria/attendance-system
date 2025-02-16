const express = require("express");
const { check } = require('express-validator');
const {
  registerUser,
  login,
  signup,
  getUserProfile,
  updateUserProfile,
  getStudents,
  createLecturer,
  updateLecturer,
  updateStudent,
  deleteStudent,
  importStudents,
  downloadStudents,
  deleteLecturer,
  importLecturers,
  downloadLecturers,
  sendResetLink,
  resetPassword
} = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();
const quizController = require('../controllers/quizController');
const { passwordValidation, validateLogin, validateSignup } = require("../validators/authValidation");

// Auth routes
router.post("/auth/signup", [
  check('firstName').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long').matches(/^[A-Za-z]+$/).withMessage('First name must not contain numbers'),
  check('lastName').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long').matches(/^[A-Za-z]+$/).withMessage('Last name must not contain numbers'),
  check('email').isEmail().withMessage('Enter a valid email address'),
  passwordValidation  // Use the password validation rule
], registerUser, signup);

router.post("/auth/login", [
  check('email').isEmail().withMessage('Enter a valid email address'),
  passwordValidation  // Use the same password validation rule
], login);

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

router.post('/create', authenticate, authorize(["admin"]), createLecturer);
router.put('/update/:id', authenticate, authorize(["admin"]), updateLecturer);
router.delete('/delete/:id', authenticate, authorize(['admin']), deleteLecturer);
router.post('/upload', authenticate, authorize(['admin']), upload.single('csvFile'), importLecturers);
router.get('/download', authenticate, authorize(['admin']), downloadLecturers);


router.post("/auth/reset-password", [
  check('email').isEmail().withMessage('Enter a valid email address')
], sendResetLink);
router.post("/auth/reset-password/:token", resetPassword);

module.exports = router;
