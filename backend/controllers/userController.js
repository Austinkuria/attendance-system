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
// Login API
const login = async (req, res) => {
  const { email, password } = req.body;

  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '4h' });
    res.json({
      token, 
      user: { id: user._id, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Signup API
const signup = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
      if (!course || course.department.toString() !== departmentId) {
        return res.status(400).json({ message: "Course not found in the specified department" });
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
    });

    // Save user to database
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });

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
  const { firstName, lastName, email, regNo, course: courseName, department: deptName, year, semester } = req.body;

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

    // Find department by name
    const department = await Department.findOne({ name: deptName });
    if (!department) {
      return res.status(400).json({ message: 'Department not found' });
    }

    // Find course by name and department
    const course = await Course.findOne({ 
      name: courseName,
      department: department._id 
    });
    if (!course) {
      return res.status(400).json({ message: 'Course not found in the specified department' });
    }

    student.firstName = firstName;
    student.lastName = lastName;
    student.email = email;
    student.regNo = regNo;
    student.course = course._id;
    student.department = department._id;
    student.year = year;
    student.semester = semester;

    await student.save();
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error(error);
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
      return res.status(400).json({ error: "CSV file is required" });
    }

    const filePath = req.file.path;
    let studentsData = [];

    // Read CSV file and parse data
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true }))
        .on("data", (row) => studentsData.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    console.log("Parsed CSV Data:", studentsData);

    const students = [];
    const errors = [];

    // Process all students in parallel
    await Promise.all(
      studentsData.map(async (row) => {
        try {
          row.year = parseInt(row.year, 10);
          row.semester = parseInt(row.semester, 10);

          if (isNaN(row.year) || row.year < 1 || row.year > 4) {
            errors.push({ row, error: "Invalid year" });
            return;
          }
          if (isNaN(row.semester) || row.semester < 1 || row.semester > 3) {
            errors.push({ row, error: "Invalid semester" });
            return;
          }

          const department = await Department.findOne({ name: row.department });
          if (!department) {
            errors.push({ row, error: `Department not found: ${row.department}` });
            return;
          }

          const course = await Course.findOne({ name: row.course, department: department._id });
          if (!course) {
            errors.push({ row, error: `Course not found: ${row.course} in department ${row.department}` });
            return;
          }

          // Check for duplicate email or regNo
          const existingUser = await User.findOne({ $or: [{ email: row.email }, { regNo: row.regNo }] });
          if (existingUser) {
            errors.push({ row, error: "Student with this email or regNo already exists" });
            return;
          }

          let enrolledUnits = [];
          if (row.enrolledUnits) {
            const unitIds = row.enrolledUnits.split(",").map((id) => id.trim());
            const validUnits = await Unit.find({ _id: { $in: unitIds } });

            if (validUnits.length !== unitIds.length) {
              errors.push({ row, error: "Some enrolled units are invalid" });
              return;
            }
            enrolledUnits = validUnits.map((unit) => unit._id);
          }

          students.push({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            regNo: row.regNo,
            role: "student",
            department: department._id,
            course: course._id,
            year: row.year,
            semester: row.semester,
            password: bcrypt.hashSync("defaultpassword", 10),
            enrolledUnits,
          });
        } catch (err) {
          console.error("Error processing row:", row, err.message);
          errors.push({ row, error: err.message });
        }
      })
    );

    if (students.length > 0) {
      await User.insertMany(students);
    }

    fs.unlinkSync(filePath); // Remove CSV file after processing

    res.json({
      message: "Students imported successfully",
      successCount: students.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      error: error.message,
      message: "Failed to import students. Please check department and course names in CSV.",
    });
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
    const user = await User.findById(req.user.userId)
      .populate('course', 'name')
      .populate('department', 'name') // Populate department name
      .select('firstName lastName email regNo year department semester course role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  const { firstName, lastName, email } = req.body;

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

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;

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
      return res.status(400).json({ error: "CSV file is required" });
    }

    const filePath = req.file.path;
    let lecturersData = [];

    // Read CSV file and parse data
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true }))
        .on("data", (row) => lecturersData.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    console.log("Parsed CSV Data:", lecturersData);

    const lecturers = [];
    const errors = [];

    // Process all lecturers in parallel
    await Promise.all(
      lecturersData.map(async (row) => {
        try {
          // Validate required fields
          if (!row.firstName || !row.lastName || !row.email || !row.department) {
            errors.push({ row, error: "Missing required fields" });
            return;
          }

          // Check if the department exists
          const department = await Department.findOne({ name: row.department });
          if (!department) {
            errors.push({ row, error: `Department not found: ${row.department}` });
            return;
          }

          // Check for duplicate email
          const existingUser = await User.findOne({ email: row.email });
          if (existingUser) {
            errors.push({ row, error: `Lecturer with email ${row.email} already exists` });
            return;
          }

          lecturers.push({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            password: bcrypt.hashSync("defaultpassword", 10), // Default password
            department: department._id,
            role: "lecturer",
          });
        } catch (err) {
          console.error("Error processing row:", row, err.message);
          errors.push({ row, error: err.message });
        }
      })
    );

    if (lecturers.length > 0) {
      await User.insertMany(lecturers);
    }

    fs.unlinkSync(filePath); // Remove CSV file after processing

    res.json({
      message: "Lecturers imported successfully",
      successCount: lecturers.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({
      error: error.message,
      message: "Failed to import lecturers. Please check department names in CSV.",
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
  importStudents,
  createLecturer,
  updateLecturer,
  deleteLecturer,
  importLecturers,
  downloadLecturers,
};
