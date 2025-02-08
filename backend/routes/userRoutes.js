const express = require("express");
const { check } = require('express-validator');
const { registerUser, loginUser, getUserProfile } = require("../controllers/userController");
const authenticate = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/auth/login", [
  check('email').isEmail().withMessage('Enter a valid email address'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], loginUser); // Login user

router.get("users/profile", authenticate, getUserProfile); // Get user profile (protected route)

router.post("/auth/signup", [
  check('firstName').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long').matches(/^[A-Za-z]+$/).withMessage('First name must not contain numbers'),
  check('lastName').isLength({ min: 3 }).withMessage('Last name must be at least 3 characters long').matches(/^[A-Za-z]+$/).withMessage('Last name must not contain numbers'),
  check('email').isEmail().withMessage('Enter a valid email address'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], registerUser); // Register user (student, lecturer, admin)

module.exports = router;