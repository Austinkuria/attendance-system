/**
 * Super Admin Routes
 * CRITICAL: All routes here are ONLY accessible by super admin
 * Used for managing department admins and system-wide operations
 */

const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

const {
    createDepartmentAdmin,
    getDepartmentAdmins,
    getDepartmentAdminById,
    updateDepartmentAdmin,
    deleteDepartmentAdmin,
    assignDepartments,
    getDepartmentAdminStats
} = require('../controllers/superAdminController');

const authenticate = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/departmentAuthMiddleware');

// Apply authentication and super admin check to ALL routes
router.use(authenticate);
router.use(requireSuperAdmin);

// ============================================
// DEPARTMENT ADMIN MANAGEMENT
// ============================================

/**
 * @route   POST /api/super-admin/department-admins
 * @desc    Create a new department admin
 * @access  Super Admin Only
 */
router.post('/department-admins', [
    check('firstName')
        .isLength({ min: 2 })
        .withMessage('First name must be at least 2 characters')
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('First name can only contain letters'),
    check('lastName')
        .isLength({ min: 2 })
        .withMessage('Last name must be at least 2 characters')
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('Last name can only contain letters'),
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
        .normalizeEmail(),
    check('managedDepartments')
        .isArray({ min: 1 })
        .withMessage('At least one department must be assigned'),
    check('password')
        .optional()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
], createDepartmentAdmin);

/**
 * @route   GET /api/super-admin/department-admins
 * @desc    Get all department admins
 * @access  Super Admin Only
 */
router.get('/department-admins', getDepartmentAdmins);

/**
 * @route   GET /api/super-admin/department-admins/stats
 * @desc    Get department admin statistics
 * @access  Super Admin Only
 */
router.get('/department-admins/stats', getDepartmentAdminStats);

/**
 * @route   GET /api/super-admin/department-admins/:id
 * @desc    Get a specific department admin by ID
 * @access  Super Admin Only
 */
router.get('/department-admins/:id', getDepartmentAdminById);

/**
 * @route   PUT /api/super-admin/department-admins/:id
 * @desc    Update a department admin
 * @access  Super Admin Only
 */
router.put('/department-admins/:id', [
    check('firstName')
        .optional()
        .isLength({ min: 2 })
        .withMessage('First name must be at least 2 characters'),
    check('lastName')
        .optional()
        .isLength({ min: 2 })
        .withMessage('Last name must be at least 2 characters'),
    check('email')
        .optional()
        .isEmail()
        .withMessage('Please enter a valid email address')
], updateDepartmentAdmin);

/**
 * @route   DELETE /api/super-admin/department-admins/:id
 * @desc    Delete (deactivate) a department admin
 * @access  Super Admin Only
 */
router.delete('/department-admins/:id', deleteDepartmentAdmin);

/**
 * @route   POST /api/super-admin/department-admins/:id/assign-departments
 * @desc    Assign departments to a department admin
 * @access  Super Admin Only
 */
router.post('/department-admins/:id/assign-departments', [
    check('departmentIds')
        .isArray({ min: 1 })
        .withMessage('At least one department must be provided')
], assignDepartments);

module.exports = router;
