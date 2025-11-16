/**
 * Department-Scoped Authorization Middleware
 * Ensures department admins can ONLY access data from their managed departments
 * Prevents cross-department data access for security and privacy
 */

const User = require("../models/User");
const mongoose = require("mongoose");

/**
 * Check if user has access to a specific department
 * @param {Object} req - Express request object
 * @param {String} departmentId - Department ID to check access for
 * @returns {Boolean} - True if user has access
 */
const hasDepartmentAccess = async (req, departmentId) => {
    const user = req.user;

    // Super admins have access to ALL departments
    if (user.role === 'super_admin' || user.isSuperAdmin) {
        return true;
    }

    // Department admins can only access their managed departments
    if (user.role === 'department_admin') {
        const fullUser = await User.findById(user.userId).select('managedDepartments');

        if (!fullUser || !fullUser.managedDepartments) {
            return false;
        }

        // Check if the department is in their managed departments list
        return fullUser.managedDepartments.some(
            deptId => deptId.toString() === departmentId.toString()
        );
    }

    // Lecturers and students can only access their own department
    if (user.role === 'lecturer' || user.role === 'student') {
        const fullUser = await User.findById(user.userId).select('department');
        return fullUser && fullUser.department.toString() === departmentId.toString();
    }

    return false;
};

/**
 * Middleware to enforce department-scoped access
 * Use this on routes that access department-specific data
 * 
 * Usage:
 *   router.get('/students', authenticate, requireDepartmentAccess, getStudents);
 * 
 * The department ID can be in:
 *   - req.query.departmentId
 *   - req.params.departmentId
 *   - req.body.department or req.body.departmentId
 */
const requireDepartmentAccess = async (req, res, next) => {
    try {
        // Extract department ID from request
        const departmentId =
            req.query.departmentId ||
            req.params.departmentId ||
            req.body.department ||
            req.body.departmentId;

        if (!departmentId) {
            // If no department specified, allow for now (filtered at query level)
            return next();
        }

        if (!mongoose.isValidObjectId(departmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID format"
            });
        }

        const hasAccess = await hasDepartmentAccess(req, departmentId);

        if (!hasAccess) {
            console.log(`🚫 Department access denied for user ${req.user.userId} to department ${departmentId}`);
            return res.status(403).json({
                success: false,
                message: "Access denied: You don't have permission to access this department's data"
            });
        }

        console.log(`✅ Department access granted for user ${req.user.userId} to department ${departmentId}`);
        next();

    } catch (error) {
        console.error('Department access check error:', error);
        res.status(500).json({
            success: false,
            message: "Error checking department access",
            error: error.message
        });
    }
};

/**
 * Get list of departments the current user can access
 * @param {Object} req - Express request object
 * @returns {Array} - Array of department IDs user can access
 */
const getAccessibleDepartments = async (req) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('role isSuperAdmin department managedDepartments');

        if (!user) {
            return [];
        }

        // Super admin can access ALL departments
        if (user.role === 'super_admin' || user.isSuperAdmin) {
            const Department = require('../models/Department');
            const allDepts = await Department.find({ isActive: true }).select('_id');
            return allDepts.map(d => d._id);
        }

        // Department admin can access their managed departments
        if (user.role === 'department_admin') {
            return user.managedDepartments || [];
        }

        // Lecturers and students can only access their own department
        if (user.department) {
            return [user.department];
        }

        return [];

    } catch (error) {
        console.error('Error getting accessible departments:', error);
        return [];
    }
};

/**
 * Middleware to add accessible departments to request
 * Useful for filtering queries by department
 * 
 * Usage:
 *   router.get('/students', authenticate, attachAccessibleDepartments, getStudents);
 *   
 * Then in controller:
 *   const students = await User.find({ 
 *     role: 'student',
 *     department: { $in: req.accessibleDepartments }
 *   });
 */
const attachAccessibleDepartments = async (req, res, next) => {
    try {
        req.accessibleDepartments = await getAccessibleDepartments(req);
        next();
    } catch (error) {
        console.error('Error attaching accessible departments:', error);
        res.status(500).json({
            success: false,
            message: "Error determining accessible departments",
            error: error.message
        });
    }
};

/**
 * Check if user is a super admin
 * Use this to restrict routes to super admin only
 */
const requireSuperAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('role isSuperAdmin');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== 'super_admin' && !user.isSuperAdmin) {
            console.log(`🚫 Super admin access denied for user ${req.user.userId}`);
            return res.status(403).json({
                success: false,
                message: "Access denied: Super admin privileges required"
            });
        }

        console.log(`✅ Super admin access granted for user ${req.user.userId}`);
        next();

    } catch (error) {
        console.error('Super admin check error:', error);
        res.status(500).json({
            success: false,
            message: "Error checking super admin status",
            error: error.message
        });
    }
};

/**
 * Validate that a department admin is trying to manage a department they control
 * Use this when creating/updating students, lecturers within a department
 */
const validateDepartmentAdminAccess = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('role isSuperAdmin managedDepartments');

        // Super admins bypass this check
        if (user.role === 'super_admin' || user.isSuperAdmin) {
            return next();
        }

        // Must be a department admin
        if (user.role !== 'department_admin') {
            return res.status(403).json({
                success: false,
                message: "Only department admins and super admins can perform this action"
            });
        }

        // Check if they're managing the target department
        const targetDepartment = req.body.department || req.body.departmentId || req.params.departmentId;

        if (!targetDepartment) {
            return res.status(400).json({
                success: false,
                message: "Department ID is required"
            });
        }

        const hasAccess = user.managedDepartments.some(
            deptId => deptId.toString() === targetDepartment.toString()
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to manage this department"
            });
        }

        next();

    } catch (error) {
        console.error('Department admin validation error:', error);
        res.status(500).json({
            success: false,
            message: "Error validating department admin access",
            error: error.message
        });
    }
};

module.exports = {
    requireDepartmentAccess,
    attachAccessibleDepartments,
    requireSuperAdmin,
    validateDepartmentAdminAccess,
    hasDepartmentAccess,
    getAccessibleDepartments
};
