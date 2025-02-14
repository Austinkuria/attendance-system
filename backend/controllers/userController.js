const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const csv = require("fast-csv");
const fs = require("fs");
const { parse } = require('json2csv'); 
const validationResult = require('express-validator').validationResult;

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
  const { firstName, lastName, email, password, role, regNo, course: courseName, department: deptName, year, semester } = req.body;

  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { regNo }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? 'Email already in use' 
          : 'Registration number already exists'
      });
    }

    let departmentId, courseId;

    if (role === 'student') {
      try {
        // Find department by name
        const department = await Department.findOne({ name: deptName });
        if (!department) {
          return res.status(400).json({ message: "Department not found" });
        }
        departmentId = department._id;
    
        // Find course by name within the department
        const course = await Course.findOne({ name: courseName, department: departmentId });
        if (!course) {
          return res.status(400).json({ message: "Course not found in the specified department" });
        }
        courseId = course._id;
      } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
      }
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      ...(role === 'student' && { 
        regNo, 
        course: courseId,  // Now storing ObjectId
        department: departmentId,  // Now storing ObjectId
        year, 
        semester 
      })
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
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
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Can only delete student accounts' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Import students
const importStudents = async (req, res) => {
  try {
    const filePath = req.file.path;
    let studentsData = [];

    // First pass: read all data from CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true }))
        .on("data", (row) => {
          studentsData.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // Process each student
    const students = [];
    for (const row of studentsData) {
      // Find department by name
      const department = await Department.findOne({ name: row.department });
      if (!department) {
        throw new Error(`Department not found: ${row.department}`);
      }

      // Find course by name and department
      const course = await Course.findOne({ 
        name: row.course,
        department: department._id 
      });
      if (!course) {
        throw new Error(`Course not found: ${row.course} in department ${row.department}`);
      }

      students.push({
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        regNo: row.regNo,
        role: 'student',
        department: department._id,
        course: course._id,
        year: row.year,
        semester: row.semester,
        password: bcrypt.hashSync('defaultpassword', 10)
      });
    }

    // Insert all students
    await User.insertMany(students);
    fs.unlinkSync(filePath);
    res.json({ message: "Students imported successfully" });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to import students. Please check department and course names in CSV.'
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

  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    await user.save();

    res.json({ message: 'Profile updated successfully' });
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
  updateUserProfile 
};
