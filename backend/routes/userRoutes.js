const express = require("express");
const { registerUser, loginUser, getUserProfile } = require("../controllers/userController");
const router = express.Router();

router.post("/auth/login", loginUser); // Login user
router.get("/profile", getUserProfile); // Get user profile (protected route)
router.post("/auth/signup", registerUser); // Register user (student, lecturer, admin)
module.exports = router;
