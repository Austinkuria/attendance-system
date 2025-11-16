/**
 * Super Admin Controller
 * Handles super admin operations like creating department admins
 * CRITICAL: Only super admins can access these endpoints
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

/**
 * Create a new department admin
 * Only accessible by super admin
 * Department admin can manage multiple departments
 */
const createDepartmentAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password, managedDepartments } = req.body;

        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "A user with this email already exists"
            });
        }

        // Validate departments exist
        if (!managedDepartments || managedDepartments.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one department must be assigned to the admin"
            });
        }

        // Verify all departments exist
        const departments = await Department.find({
            _id: { $in: managedDepartments }
        });

        if (departments.length !== managedDepartments.length) {
            return res.status(400).json({
                success: false,
                message: "One or more departments not found"
            });
        }

        // Generate temporary password if not provided
        const finalPassword = password || crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        // Create department admin
        const newAdmin = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'department_admin',
            managedDepartments: managedDepartments,
            // Take first department as primary department for queries
            department: managedDepartments[0],
            isVerified: true, // Super admin created users are pre-verified
            mustChangePassword: !password, // Force change if auto-generated
            isActive: true,
            createdBy: req.user.userId
        });

        await newAdmin.save();

        console.log(`✅ Department admin created by super admin ${req.user.userId}`);
        console.log(`   Admin: ${newAdmin.email}`);
        console.log(`   Manages: ${departments.map(d => d.name).join(', ')}`);

        res.status(201).json({
            success: true,
            message: "Department admin created successfully",
            admin: {
                id: newAdmin._id,
                name: `${newAdmin.firstName} ${newAdmin.lastName}`,
                email: newAdmin.email,
                role: newAdmin.role,
                managedDepartments: departments.map(d => ({
                    id: d._id,
                    name: d.name,
                    code: d.code
                }))
            },
            // Only send temporary password if it was auto-generated
            ...(password ? {} : { temporaryPassword: finalPassword })
        });

    } catch (error) {
        console.error('❌ Error creating department admin:', error);
        res.status(500).json({
            success: false,
            message: "Error creating department admin",
            error: error.message
        });
    }
};

/**
 * Get all department admins
 * Only accessible by super admin
 */
const getDepartmentAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'department_admin' })
            .populate('managedDepartments', 'name code')
            .populate('department', 'name code')
            .select('firstName lastName email isActive managedDepartments department createdAt lastLogin');

        res.json({
            success: true,
            count: admins.length,
            admins: admins.map(admin => ({
                id: admin._id,
                name: `${admin.firstName} ${admin.lastName}`,
                email: admin.email,
                isActive: admin.isActive,
                managedDepartments: admin.managedDepartments,
                primaryDepartment: admin.department,
                createdAt: admin.createdAt,
                lastLogin: admin.lastLogin
            }))
        });

    } catch (error) {
        console.error('❌ Error fetching department admins:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching department admins",
            error: error.message
        });
    }
};

/**
 * Get a single department admin by ID
 * Only accessible by super admin
 */
const getDepartmentAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID format"
            });
        }

        const admin = await User.findOne({ _id: id, role: 'department_admin' })
            .populate('managedDepartments', 'name code')
            .populate('department', 'name code')
            .select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Department admin not found"
            });
        }

        res.json({
            success: true,
            admin: {
                id: admin._id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                isActive: admin.isActive,
                managedDepartments: admin.managedDepartments,
                primaryDepartment: admin.department,
                createdAt: admin.createdAt,
                lastLogin: admin.lastLogin,
                mustChangePassword: admin.mustChangePassword
            }
        });

    } catch (error) {
        console.error('❌ Error fetching department admin:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching department admin",
            error: error.message
        });
    }
};

/**
 * Update department admin
 * Only accessible by super admin
 */
const updateDepartmentAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, managedDepartments, isActive } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID format"
            });
        }

        const admin = await User.findOne({ _id: id, role: 'department_admin' });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Department admin not found"
            });
        }

        // Check if email is being changed and if it's already in use
        if (email && email !== admin.email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already in use by another user"
                });
            }
            admin.email = email.toLowerCase();
        }

        // Update basic info
        if (firstName) admin.firstName = firstName;
        if (lastName) admin.lastName = lastName;
        if (typeof isActive === 'boolean') admin.isActive = isActive;

        // Update managed departments if provided
        if (managedDepartments && managedDepartments.length > 0) {
            // Verify all departments exist
            const departments = await Department.find({
                _id: { $in: managedDepartments }
            });

            if (departments.length !== managedDepartments.length) {
                return res.status(400).json({
                    success: false,
                    message: "One or more departments not found"
                });
            }

            admin.managedDepartments = managedDepartments;
            admin.department = managedDepartments[0]; // Update primary department
        }

        await admin.save();

        const updatedAdmin = await User.findById(id)
            .populate('managedDepartments', 'name code')
            .populate('department', 'name code');

        console.log(`✅ Department admin updated by super admin ${req.user.userId}`);
        console.log(`   Admin: ${updatedAdmin.email}`);

        res.json({
            success: true,
            message: "Department admin updated successfully",
            admin: {
                id: updatedAdmin._id,
                name: `${updatedAdmin.firstName} ${updatedAdmin.lastName}`,
                email: updatedAdmin.email,
                isActive: updatedAdmin.isActive,
                managedDepartments: updatedAdmin.managedDepartments
            }
        });

    } catch (error) {
        console.error('❌ Error updating department admin:', error);
        res.status(500).json({
            success: false,
            message: "Error updating department admin",
            error: error.message
        });
    }
};

/**
 * Delete (deactivate) department admin
 * Only accessible by super admin
 * We deactivate rather than delete to preserve audit trail
 */
const deleteDepartmentAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID format"
            });
        }

        const admin = await User.findOne({ _id: id, role: 'department_admin' });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Department admin not found"
            });
        }

        // Deactivate instead of delete
        admin.isActive = false;
        await admin.save();

        console.log(`✅ Department admin deactivated by super admin ${req.user.userId}`);
        console.log(`   Admin: ${admin.email}`);

        res.json({
            success: true,
            message: "Department admin deactivated successfully"
        });

    } catch (error) {
        console.error('❌ Error deleting department admin:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting department admin",
            error: error.message
        });
    }
};

/**
 * Assign departments to an existing department admin
 * Only accessible by super admin
 */
const assignDepartments = async (req, res) => {
    try {
        const { id } = req.params;
        const { departmentIds } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID format"
            });
        }

        if (!departmentIds || departmentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one department ID is required"
            });
        }

        const admin = await User.findOne({ _id: id, role: 'department_admin' });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Department admin not found"
            });
        }

        // Verify departments exist
        const departments = await Department.find({
            _id: { $in: departmentIds }
        });

        if (departments.length !== departmentIds.length) {
            return res.status(400).json({
                success: false,
                message: "One or more departments not found"
            });
        }

        admin.managedDepartments = departmentIds;
        admin.department = departmentIds[0]; // Update primary department
        await admin.save();

        const updatedAdmin = await User.findById(id)
            .populate('managedDepartments', 'name code');

        res.json({
            success: true,
            message: "Departments assigned successfully",
            admin: {
                id: updatedAdmin._id,
                name: `${updatedAdmin.firstName} ${updatedAdmin.lastName}`,
                managedDepartments: updatedAdmin.managedDepartments
            }
        });

    } catch (error) {
        console.error('❌ Error assigning departments:', error);
        res.status(500).json({
            success: false,
            message: "Error assigning departments",
            error: error.message
        });
    }
};

/**
 * Get statistics about department admins
 * Only accessible by super admin
 */
const getDepartmentAdminStats = async (req, res) => {
    try {
        const totalAdmins = await User.countDocuments({ role: 'department_admin' });
        const activeAdmins = await User.countDocuments({ role: 'department_admin', isActive: true });
        const inactiveAdmins = totalAdmins - activeAdmins;

        // Get admins with most departments
        const admins = await User.find({ role: 'department_admin', isActive: true })
            .populate('managedDepartments', 'name');

        const departmentCounts = admins.map(admin => ({
            name: `${admin.firstName} ${admin.lastName}`,
            departmentCount: admin.managedDepartments.length
        })).sort((a, b) => b.departmentCount - a.departmentCount);

        res.json({
            success: true,
            stats: {
                total: totalAdmins,
                active: activeAdmins,
                inactive: inactiveAdmins,
                topAdmins: departmentCounts.slice(0, 5)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching admin stats:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching statistics",
            error: error.message
        });
    }
};

module.exports = {
    createDepartmentAdmin,
    getDepartmentAdmins,
    getDepartmentAdminById,
    updateDepartmentAdmin,
    deleteDepartmentAdmin,
    assignDepartments,
    getDepartmentAdminStats
};
