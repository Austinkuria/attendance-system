const express = require("express");
const { registerUser, loginUser, getUserProfile } = require("../controllers/userController");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");

router.post("/auth/login", loginUser); // Login user
router.get("/profile", authenticate, getUserProfile); // Get user profile (protected route)
router.post("/auth/signup", registerUser); // Register user (student, lecturer, admin)

module.exports = router;