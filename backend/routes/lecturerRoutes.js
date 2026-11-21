const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const { getLecturerDashboardData } = require('../controllers/lecturerDashboardController');

// All lecturer routes require authentication and lecturer or admin role
router.get('/dashboard', authenticate, authorize(['lecturer', 'admin', 'super_admin']), getLecturerDashboardData);

module.exports = router;
