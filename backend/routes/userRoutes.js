const express = require("express");
const { check } = require('express-validator');
const rateLimit = require('express-rate-limit');
const {
  login,
  signup,
  registerUser,
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
  resetPassword,
  // updatePushToken
} = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorizeMiddleware");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();
// const { passwordValidation } = require("../validators/authValidation");

// Configure rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Auth routes
router.post("/auth/login", [
  check("email").isEmail().withMessage("Enter a valid email address(e.g., example@domain.com"),
  check("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    // .matches(/[A-Z]/)
    // .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
  // .matches(/[@$!%*?&]/)
  // .withMessage("Password must contain at least one special character (@$!%*?&)"),
], login);

// ⚠️ PUBLIC SELF-REGISTRATION DISABLED FOR SECURITY REASONS
// Students MUST be created by administrators to ensure proper:
//   - Department/course assignment
//   - Unit enrollment
//   - Access control
// If you need to enable public registration, uncomment the route below (NOT RECOMMENDED)

/* router.post("/auth/signup", [
  check('firstName').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long').matches(/^[A-Za-z]+$/).withMessage('First name must not contain numbers'),
  check('lastName').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long').matches(/^[A-Za-z]+$/).withMessage('Last name must not contain numbers'),
  check("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long")
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number"),
  check("email").isEmail().withMessage("Enter a valid email address(e.g., example@domain.com"),
], limiter, signup); */

// Profile routes
router.get("/users/profile", authenticate, getUserProfile);
router.put("/users/profile/update", authenticate, [
  check('firstName').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
  check('lastName').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long'),
  check("email").isEmail().withMessage("Enter a valid email address(e.g., example@domain.com"),
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
router.put("/auth/reset-password/:token", resetPassword);

// router.post('/update-push-token', authenticate, updatePushToken);

module.exports = router;
