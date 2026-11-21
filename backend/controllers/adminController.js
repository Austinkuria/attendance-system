const User = require("../models/User");
const Course = require("../models/Course");
const Department = require("../models/Department");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const RosterIngestionService = require("../services/rosterIngestionService");
const logger = require("../utils/logger");

// Create a new user (student, lecturer, or department admin)
const createUser = async (req, res) => {
    try {
        const { role, firstName, lastName, regNo, email, password, department, course, year, semester } = req.body;

        if (!email || !firstName || !lastName || !role) {
            return res.status(400).json({ success: false, message: "Role, first name, last name, and email are required" });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                ...(regNo ? [{ regNo: regNo.toUpperCase() }] : [])
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email.toLowerCase() ? "Email already registered" : "Registration number already exists"
            });
        }

        // Generate temporary password and activation token if password not provided
        const rawPassword = password || crypto.randomBytes(10).toString('hex');
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        const rawActivationToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawActivationToken).digest('hex');

        const newUser = new User({
            role,
            firstName,
            lastName,
            regNo: regNo ? regNo.toUpperCase() : undefined,
            email: email.toLowerCase(),
            password: hashedPassword,
            department: department || undefined,
            course: course || undefined,
            year: year ? parseInt(year, 10) : undefined,
            semester: semester ? parseInt(semester, 10) : undefined,
            isActive: true,
            isVerified: false,
            mustChangePassword: true,
            verificationToken: tokenHash,
            verificationTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000),
            createdBy: req.user ? req.user.userId : undefined
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: `${role.replace('_', ' ')} created successfully`,
            user: {
                id: newUser._id,
                name: `${newUser.firstName} ${newUser.lastName}`,
                email: newUser.email,
                role: newUser.role
            },
            activationToken: rawActivationToken
        });
    } catch (err) {
        logger.error("Error creating user:", err);
        res.status(500).json({ success: false, message: "Error creating user", error: err.message });
    }
};

// Bulk upload students via Excel (.xlsx) or CSV
const bulkUploadStudents = async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ success: false, message: "Please upload an Excel (.xlsx) or CSV file" });
        }

        const rows = await RosterIngestionService.parseBuffer(req.file.buffer, req.file.originalname);

        if (!rows || rows.length === 0) {
            return res.status(400).json({ success: false, message: "The uploaded file contains no student records" });
        }

        const creatorId = req.user ? req.user.userId : null;
        const result = await RosterIngestionService.ingestStudents(rows, creatorId);

        res.status(200).json({
            success: true,
            message: `Roster processing complete: ${result.successfulCount} enrolled, ${result.duplicateCount} duplicates skipped, ${result.errorCount} errors`,
            report: result
        });
    } catch (error) {
        logger.error("Error during bulk student upload:", error);
        res.status(500).json({ success: false, message: "Server error during bulk upload", error: error.message });
    }
};

// Download official Excel template for student ingestion
const downloadStudentTemplate = async (req, res) => {
    try {
        const buffer = await RosterIngestionService.generateStudentTemplate();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="students_roster_template.xlsx"');
        res.send(buffer);
    } catch (error) {
        logger.error("Error generating student template:", error);
        res.status(500).json({ success: false, message: "Failed to generate template", error: error.message });
    }
};

module.exports = { createUser, bulkUploadStudents, downloadStudentTemplate };
