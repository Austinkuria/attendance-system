const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const csv = require("fast-csv");
const fs = require("fs");
const { parse } = require('json2csv');
const validationResult = require('express-validator').validationResult;
const mongoose = require('mongoose');
const crypto = require('crypto');
const transporter = require("../config/emailConfig");
const path = require('path');
const Unit = require('../models/Unit');
const RosterIngestionService = require('../services/rosterIngestionService');
const { getSafeFileBuffer, safeUnlink } = require('../utils/securityUtils');
const {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies
} = require('../utils/authUtils');
const { autoEnrollStudent } = require('../utils/enrollment.utils');
const {
  generateVerificationToken,
  sendVerificationEmail,
  sendVerificationSuccessEmail
} = require('../services/email.service');

// Login API
const login = async (req, res) => {
  const { email, password } = req.body;

  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Find user with all necessary fields
    const user = await User.findOne({ email: { $eq: email } })
      .select('_id password role firstName lastName email regNo year semester department course')
      .populate('department', 'name')
      .populate('course', 'name code');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get client IP
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, ipAddress);

    // Set tokens in httpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Return user data (NO TOKEN in response body for security)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        regNo: user.regNo,
        year: user.year,
        semester: user.semester,
        department: user.department,
        course: user.course
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Signup API
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, year, semester, course } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: { $eq: email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
        field: "email"
      });
    }

    // Validate student-specific fields
    if (role === "student") {
      if (!year || !semester) {
        return res.status(400).json({
          success: false,
          message: "Year and semester are required for students",
          fields: ["year", "semester"]
        });
      }

      if (year < 1 || year > 4) {
        return res.status(400).json({
          success: false,
          message: "Invalid academic year (must be between 1 and 4)",
          field: "year"
        });
      }

      if (semester < 1 || semester > 3) {
        return res.status(400).json({
          success: false,
          message: "Invalid semester (must be between 1 and 3)",
          field: "semester"
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
      ...(role === "student" && { year, semester, course }),
    });

    await newUser.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, firstName);

      res.status(201).json({
        success: true,
        message: "Registration successful! Please check your email to verify your account.",
        requiresVerification: true
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);

      // User is created but email failed - they can request resend
      res.status(201).json({
        success: true,
        message: "Registration successful! However, we couldn't send the verification email. Please request a new one.",
        requiresVerification: true,
        emailError: true
      });
    }
  } catch (error) {
    console.error("Signup Error:", error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        message: err.message,
        field: err.path
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: "Signup failed. Please try again later.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Register user
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, role, regNo, course: courseId, department: departmentId, year, semester } = req.body;

  // Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if email or regNo already exists
    const existingUser = await User.findOne({ $or: [{ email }, { regNo }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? "Email already in use"
          : "Registration number already exists"
      });
    }

    // Validate department and course for students
    if (role === "student") {
      console.log("Received Department ID:", departmentId);
      console.log("Received Course ID:", courseId);

      if (!mongoose.isValidObjectId(departmentId) || !mongoose.isValidObjectId(courseId)) {
        return res.status(400).json({ message: "Invalid department or course ID format" });
      }

      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(400).json({ message: "Department not found" });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(400).json({ message: "Course not found" });
      }

    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      ...(role === "student" && {
        regNo,
        course: courseId,
        department: departmentId,
        year: Number(year) || 1,
        semester: Number(semester) || 1
      }),
      ...(role === "lecturer" && {
        department: departmentId
      }),
      isVerified: true, // Admin-created users are pre-verified
      mustChangePassword: true, // Force password change on first login
      createdBy: req.user?._id // Track who created this user
    });

    // Save user to database
    await newUser.save();

    // AUTO-ENROLL STUDENTS IN UNITS
    if (role === "student") {
      try {
        const enrollmentResult = await autoEnrollStudent(
          newUser._id,
          courseId,
          Number(year) || 1,
          Number(semester) || 1
        );

        console.log(`Auto-enrollment complete:`, enrollmentResult);

        return res.status(201).json({
          success: true,
          message: "Student created and enrolled successfully",
          user: {
            id: newUser._id,
            name: `${newUser.firstName} ${newUser.lastName}`,
            email: newUser.email,
            regNo: newUser.regNo
          },
          enrollment: {
            enrolledUnits: enrollmentResult.enrolledCount,
            totalUnits: enrollmentResult.totalUnits,
            units: enrollmentResult.units
          }
        });

      } catch (enrollmentError) {
        console.error('User created but enrollment failed:', enrollmentError);

        // User was created but enrollment failed - still return success
        return res.status(201).json({
          success: true,
          message: "Student created successfully, but unit enrollment failed. Please enroll manually.",
          user: {
            id: newUser._id,
            name: `${newUser.firstName} ${newUser.lastName}`,
            email: newUser.email,
            regNo: newUser.regNo
          },
          enrollmentError: enrollmentError.message
        });
      }
    }

    // For lecturers and admins
    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
      user: {
        id: newUser._id,
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};


// getStudents
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('course', 'name')
      .populate('department', 'name')
      .select('firstName lastName email regNo year department semester course');
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
};


// getLecturers
const getLecturers = async (req, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' })
      .populate('department', 'name')
      .populate('assignedUnits', 'name code')
      .select('firstName lastName email department assignedUnits');
    res.json(lecturers);
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
};


// Update student
const updateStudent = async (req, res) => {
  const { firstName, lastName, email, regNo, course, department, year, semester } = req.body;

  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if email or regNo is already taken by another user
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        { $or: [{ email }, { regNo }] }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'Email already in use'
          : 'Registration number already exists'
      });
    }

    // Validate department and course IDs
    if (!mongoose.isValidObjectId(department) || !mongoose.isValidObjectId(course)) {
      return res.status(400).json({ message: 'Invalid department or course ID format' });
    }

    // Verify course exists
    const courseDoc = await Course.findById(String(course));
    if (!courseDoc) {
      return res.status(400).json({ message: 'Course not found' });
    }

    // Verify department exists (assuming you have a Department model)
    const deptDoc = await Department.findById(String(department));
    if (!deptDoc) {
      return res.status(400).json({ message: 'Department not found' });
    }

    // Update student fields
    student.firstName = firstName;
    student.lastName = lastName;
    student.email = email;
    student.regNo = regNo;
    student.course = course; // Use the ID
    student.department = department; // Use the ID
    student.year = year;
    student.semester = semester;

    await student.save();
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// New improved update student function that handles IDs properly
const updateStudentV2 = async (req, res) => {
  const { firstName, lastName, email, regNo, course, department, year, semester } = req.body;

  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if email or regNo is already taken by another user
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        { $or: [{ email }, { regNo }] }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email
          ? 'Email already in use'
          : 'Registration number already exists'
      });
    }

    // Update student fields without requiring department and course validation
    // This makes the function more robust
    let updateData = {
      firstName,
      lastName,
      email,
      regNo,
      year,
      semester
    };

    // Only update course and department if they are valid MongoDB ObjectIds
    if (course && mongoose.Types.ObjectId.isValid(course)) {
      updateData.course = course;
    }

    if (department && mongoose.Types.ObjectId.isValid(department)) {
      updateData.department = department;
    }

    // Use findByIdAndUpdate for atomic update
    const updatedStudent = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Failed to update student' });
    }

    res.json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (error) {
    console.error("Error in updateStudentV2:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete student

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (student.role !== "student") {
      return res.status(400).json({ message: "Can only delete student accounts" });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// import students
const importStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Spreadsheet file (.xlsx or .csv) is required" });
    }

    const buffer = getSafeFileBuffer(req.file);
    if (!buffer) {
      return res.status(400).json({ success: false, error: "File buffer could not be read" });
    }

    const rows = await RosterIngestionService.parseBuffer(buffer, req.file.originalname || "roster.csv");
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, error: "No student records found in file" });
    }

    const creatorId = req.user ? req.user.userId : null;
    const result = await RosterIngestionService.ingestStudents(rows, creatorId);

    // Clean up temporary file if disk storage was used
    if (req.file.path) {
      safeUnlink(req.file.path);
    }

    res.json({
      message: "Students imported successfully",
      successCount: result.successfulCount,
      errorCount: result.errorCount,
      duplicateCount: result.duplicateCount,
      errors: result.errors,
      inserted: result.inserted
    });
  } catch (error) {
    console.error("Error importing students:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Download students
const downloadStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('course', 'name')
      .select('firstName lastName email regNo course year semester');

    const csvData = students.map(student => ({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      regNo: student.regNo,
      course: student.course?.name || '',
      department: student.department?.name || '',
      year: student.year,
      semester: student.semester
    }));

    const csv = parse(csvData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    // Handle non-ObjectId IDs (e.g. demo tokens or test identifiers)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const existingUser = await User.findOne({ email: req.user.email })
        .populate('course', 'name')
        .populate('department', 'name')
        .select('firstName lastName email regNo year department semester course role');

      if (existingUser) {
        return res.json(existingUser);
      }

      return res.json({
        _id: userId,
        firstName: req.user.firstName || 'Alex',
        lastName: req.user.lastName || 'Kuria',
        email: req.user.email || 'student@demo.ac.ke',
        regNo: req.user.regNo || 'SCM/DEMO/22',
        year: req.user.year || 3,
        semester: req.user.semester || 1,
        course: { name: 'Bachelor of Science in Software Engineering' },
        department: { name: 'School of Computing' },
        role: req.user.role || 'student'
      });
    }

    const user = await User.findById(userId)
      .populate('course', 'name')
      .populate('department', 'name') // Populate department name
      .select('firstName lastName email regNo year department semester course role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  const { firstName, middleName, lastName, email } = req.body;

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user?.userId; // Ensure userId exists
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: Missing user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (firstName) user.firstName = firstName.trim();
    if (middleName !== undefined) user.middleName = middleName ? middleName.trim() : "";
    if (lastName) user.lastName = lastName.trim();
    if (email && user.role !== "student") user.email = email.trim(); // Institutional protection for students

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new lecturer
const createLecturer = async (req, res) => {
  try {
    const { firstName, lastName, email, password, department } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: `A lecturer with the email ${email} already exists.` });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new lecturer
    const newLecturer = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      department,
      role: "lecturer",
      // year: null, // Set as null or a default value
      // semester: null, // Set as null or a default value
    });

    await newLecturer.save();

    res.status(201).json({ message: "Lecturer created successfully", lecturer: newLecturer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update lecturer
const updateLecturer = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, department, assignedUnits } = req.body;

    // Check if lecturer exists
    const lecturer = await User.findById(id);
    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    // Update lecturer details
    lecturer.firstName = firstName || lecturer.firstName;
    lecturer.lastName = lastName || lecturer.lastName;
    lecturer.email = email || lecturer.email;
    lecturer.department = department || lecturer.department;

    // Update assigned units if provided
    if (assignedUnits) {
      lecturer.assignedUnits = assignedUnits;
    }

    await lecturer.save();

    res.status(200).json({ message: "Lecturer updated successfully", lecturer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete lecturer
const deleteLecturer = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the lecturer by ID and delete
    const lecturer = await User.findByIdAndDelete(id); // Using findByIdAndDelete

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer not found" });
    }

    res.status(200).json({ message: "Lecturer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Import lecturers
const importLecturers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Spreadsheet file (.xlsx or .csv) is required" });
    }

    const buffer = getSafeFileBuffer(req.file);
    if (!buffer) {
      return res.status(400).json({ success: false, error: "File buffer could not be read" });
    }

    const rows = await RosterIngestionService.parseBuffer(buffer, req.file.originalname || "lecturers.xlsx");
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, error: "No lecturer records found in file" });
    }

    const creatorId = req.user ? req.user.userId : null;
    const result = await RosterIngestionService.ingestLecturers(rows, creatorId);

    if (req.file.path) {
      safeUnlink(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed ${result.totalRows} rows. ${result.successfulCount} lecturers added.`,
      ...result
    });
  } catch (error) {
    console.error("Lecturer import error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to import lecturers."
    });
  }
};

// Download lecturers
const downloadLecturers = async (req, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' })
      .populate('department', 'name')
      .populate('assignedUnits', 'name') // Populate assigned units
      .select('firstName lastName email department assignedUnits');

    const csvData = lecturers.map(lecturer => ({
      firstName: lecturer.firstName,
      lastName: lecturer.lastName,
      email: lecturer.email,
      department: lecturer.department?.name || '',
      assignedUnits: lecturer.assignedUnits?.map(unit => unit.name).join(', ') || '', // Convert array to string
    }));

    const csv = parse(csvData, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=lecturers.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send reset link
const sendResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate Reset Token and Hash It
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = await bcrypt.hash(resetToken, 10);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    console.log("Stored token:", user.resetPasswordToken);
    console.log("Stored expiry:", new Date(user.resetPasswordExpires));
    console.log("Current time:", new Date());

    const clientUrl =
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL_PROD
        : process.env.CLIENT_URL_DEV;

    const resetLink = `${clientUrl}/auth/reset-password/${resetToken}`;

    // Define the absolute path to your logo for email
    const logoPath = path.join(__dirname, '../public/assets/logo.jpg');

    // Email Template
    const mailOptions = {
      from: `"Smart QR Code based Student Attendance System" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333;">
          <!-- Header Section with Styled Logo -->
          <div style="padding: 20px; background-color: #f8f9fa; border-bottom: 3px solid #6C63FF; text-align: center;">
            <div style="display: inline-block; padding: 10px;">
              <img src="cid:logo" alt="QRollCall Logo" 
                style="width: 80px; height: 80px; border-radius: 10px; border: 3px solid #6C63FF; padding: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); background-color: white;" />
            </div>
            <h2 style="color: #6C63FF; margin: 10px 0;">Smart QR Code based Student Attendance System</h2>
          </div>
    
          <!-- Main Content -->
          <div style="padding: 30px 20px; background-color: #ffffff;">
            <h1 style="color: #2d3956; font-size: 24px; margin-bottom: 25px; text-align: center;">
              Password Reset Request
            </h1>
    
            <p style="margin-bottom: 15px; line-height: 1.6;">Hi ${user.firstName} ${user.lastName},</p>
            <p style="margin-bottom: 20px; line-height: 1.6;">You requested to reset your password. Click the button below to set up a new password:</p>
    
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #6C63FF; color: #ffffff; padding: 12px 30px; 
                        text-decoration: none; border-radius: 8px; display: inline-block; 
                        font-weight: 500; letter-spacing: 0.5px; transition: all 0.3s ease;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                Reset Password
              </a>
            </div>
    
            <!-- Details Section -->
            <div style="margin: 25px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                Link expires in: <strong>1 hour</strong><br>
                If you did not request this, please ignore this email.
              </p>
            </div>
    
            <!-- Fallback Text -->
            <p style="color: #94a3b8; font-size: 13px; margin: 20px 0;">
              If the button doesn't work, copy and paste this link in your browser:<br>
              <span style="color: #6C63FF; word-break: break-all;">${resetLink}</span>
            </p>
    
            <!-- Thank You & Auto-Reply Notice -->
            <div style="margin-top: 30px;">
              <p style="margin: 0 0 15px 0; color: #2d3956; line-height: 1.6;">
                Thank you for choosing Smart QR Code based Student Attendance System.<br>
                <strong>Best regards,</strong><br>
                <span style="color: #6C63FF;">Customer Support Team</span>
              </p>
              
              <p style="margin: 0; color: #64748b; font-size: 12px; font-style: italic;">
                Please note: This is an automated message. Do not reply to this email. 
                For assistance, please contact us using the information in the footer below.
              </p>
            </div>
          </div>
    
          <!-- Footer -->
          <div style="padding: 25px 20px; background-color: #2d3956; color: #ffffff; text-align: center;">
            <div style="margin-bottom: 15px;">
              <a href="${clientUrl || 'https://qrollcall.austinmaina.co.ke'}" style="color: #ffffff; text-decoration: none; font-weight: 500;">
                Smart QR Code based Student Attendance System
              </a>
            </div>
            
            <div style="font-size: 12px; line-height: 1.6; color: #cbd5e1;">
              <p style="margin: 5px 0;">12 Main Street, Kutus, Kenya</p>
              <p style="margin: 5px 0;">
                <a href="${clientUrl || 'https://qrollcall.austinmaina.co.ke'}/request-access" style="color: #cbd5e1; text-decoration: none;">Support & Contact Form</a>
              </p>
              <p style="margin: 15px 0 0; color: #94a3b8;">
                © ${new Date().getFullYear()} Smart QR Code based Student Attendance System. All rights reserved
              </p>
            </div>
          </div>
        </div>
      `,
      attachments: [{
        filename: 'logo.jpg',
        path: logoPath,
        cid: 'logo' // Content ID referenced in the HTML img src
      }]
    };

    // Send Email
    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user(s) with a reset token (hashed token cannot be directly searched)
    const users = await User.find({ resetPasswordToken: { $exists: true } });

    // Check if any user has the token (compare using bcrypt)
    let user = null;
    for (const u of users) {
      const isMatch = await bcrypt.compare(token, u.resetPasswordToken);
      if (isMatch) {
        user = u;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Check if token is expired
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and remove reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password successfully reset" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get student units
const getStudentUnits = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Find the student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get enrolled units with details
    const units = await Unit.find({
      _id: { $in: student.enrolledUnits }
    });

    res.status(200).json(units);
  } catch (error) {
    console.error("Error fetching student units:", error);
    res.status(500).json({ message: "Error fetching student units", error: error.message });
  }
};

// Enroll student in a unit
const enrollStudentInUnit = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { unitId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Find the student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the unit
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Check if student is already enrolled in this unit
    if (student.enrolledUnits.includes(unitId)) {
      return res.status(400).json({ message: "Student is already enrolled in this unit" });
    }

    // Add unit to student's enrolledUnits array
    student.enrolledUnits.push(unitId);
    await student.save();

    // Add student to unit's studentsEnrolled array
    if (!unit.studentsEnrolled.includes(studentId)) {
      unit.studentsEnrolled.push(studentId);
      await unit.save();
    }

    res.status(200).json({ message: "Unit enrolled successfully" });
  } catch (error) {
    console.error("Error enrolling student in unit:", error);
    res.status(500).json({ message: "Error enrolling student in unit", error: error.message });
  }
};

// Remove student from a unit
const removeStudentFromUnit = async (req, res) => {
  try {
    const { studentId, unitId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    // Find the student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the unit
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // Remove unit from student's enrolledUnits array
    student.enrolledUnits = student.enrolledUnits.filter(id => id.toString() !== unitId.toString());
    await student.save();

    // Remove student from unit's studentsEnrolled array
    if (unit.studentsEnrolled) {
      unit.studentsEnrolled = unit.studentsEnrolled.filter(id => id.toString() !== studentId.toString());
      await unit.save();
    }

    res.status(200).json({ message: "Unit removed successfully" });
  } catch (error) {
    console.error("Error removing student from unit:", error);
    res.status(500).json({ message: "Error removing student from unit", error: error.message });
  }
};

// Bulk update student active status
const bulkUpdateStudentStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: "Valid array of student IDs and isActive boolean are required" });
    }

    const result = await User.updateMany(
      { _id: { $in: ids }, role: 'student' },
      { $set: { isActive } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} students`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating student status", error: error.message });
  }
};

// Bulk delete students
const bulkDeleteStudents = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Valid array of student IDs is required" });
    }

    const result = await User.deleteMany({ _id: { $in: ids }, role: 'student' });
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} students`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting students", error: error.message });
  }
};

// Bulk update lecturer status
const bulkUpdateLecturerStatus = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: "Valid array of lecturer IDs and isActive boolean are required" });
    }

    const result = await User.updateMany(
      { _id: { $in: ids }, role: 'lecturer' },
      { $set: { isActive } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} lecturers`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating lecturer status", error: error.message });
  }
};

// Bulk delete lecturers
const bulkDeleteLecturers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Valid array of lecturer IDs is required" });
    }

    const result = await User.deleteMany({ _id: { $in: ids }, role: 'lecturer' });
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} lecturers`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting lecturers", error: error.message });
  }
};

// Download official Excel lecturer template
const downloadLecturerTemplate = async (req, res) => {
  try {
    const buffer = await RosterIngestionService.generateLecturerTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Lecturers_Template.xlsx"');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error generating lecturer template", error: error.message });
  }
};

module.exports = {
  login,
  signup,
  getStudents,
  getLecturers,
  updateStudent,
  deleteStudent,
  importStudents,
  downloadStudents,
  registerUser,
  getUserProfile,
  updateUserProfile,
  updateStudentV2,
  createLecturer,
  updateLecturer,
  deleteLecturer,
  importLecturers,
  downloadLecturers,
  sendResetLink,
  resetPassword,
  getStudentUnits,
  enrollStudentInUnit,
  removeStudentFromUnit,
  bulkUpdateStudentStatus,
  bulkDeleteStudents,
  bulkUpdateLecturerStatus,
  bulkDeleteLecturers,
  downloadLecturerTemplate
};
