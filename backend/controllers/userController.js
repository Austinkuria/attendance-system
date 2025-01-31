const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const csv = require("fast-csv");
const fs = require("fs");

// Login API
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Signup API
const signup = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

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
    res.status(500).json({ message: 'Server error' });
  }
};

// getStudents
// In your userController.js
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('course', 'name') // Add this line to populate course names
      .select('firstName lastName email regNo year semester course');
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
      .select('firstName lastName email department assignedUnits');
    res.json(lecturers);
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
};


// Delete student
const deleteStudent = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);  // Use User model instead of Student
    res.json({ message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Import students
const importStudents = async (req, res) => {
  try {
    const filePath = req.file.path;
    let students = [];

    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true }))
      .on("data", (row) => {
        // Add role and map CSV fields
        students.push({
          ...row,
          role: 'student',
          password: bcrypt.hashSync('defaultpassword', 10)
        });
      })
      .on("end", async () => {
        await User.insertMany(students); // Use User model instead of Student
        fs.unlinkSync(filePath);
        res.json({ message: "Students imported successfully" });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export students
const downloadStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.setHeader("Content-Disposition", "attachment; filename=students.csv");
    res.setHeader("Content-Type", "text/csv");
    
    csv.write(students, { headers: true }).pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { login, signup, getStudents, getLecturers, deleteStudent, importStudents, downloadStudents };

