const User = require("../models/User");
const Course = require("../models/Course");
const Department = require("../models/department");
const fs = require("fs");
const csv = require("csv-parser");

// Create a new user (student or lecturer)
const createUser = async (req, res) => {
    try {
        const { role, firstName, lastName, regNo, email, password, department, course } = req.body;

        const newUser = new User({
            role,
            firstName,
            lastName,
            regNo,
            email,
            password,
            department,
            course
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error creating user", error: err.message });
    }
};

// adminController.js
const bulkUploadStudents = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded' });
      }
  
      const results = [];
      const errors = [];
  
      // Process CSV
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
  
      parser.on('readable', async () => {
        let record;
        while ((record = parser.read())) {
          try {
            const existingUser = await User.findOne({ 
              $or: [{ email: record.email }, { regNo: record.regNo }] 
            });
  
            if (existingUser) {
              errors.push({
                row: record,
                error: existingUser.email === record.email 
                  ? 'Email already exists' 
                  : 'Registration number already exists'
              });
              continue;
            }
  
            const hashedPassword = await bcrypt.hash(record.password, 10);
            
            const newStudent = new User({
              firstName: record.firstName,
              lastName: record.lastName,
              email: record.email,
              password: hashedPassword,
              role: 'student',
              regNo: record.regNo,
              course: record.course,
              year: parseInt(record.year),
              semester: parseInt(record.semester)
            });
  
            await newStudent.save();
            results.push(newStudent);
          } catch (error) {
            errors.push({ row: record, error: error.message });
          }
        }
      });
  
      parser.on('end', () => {
        res.status(200).json({
          message: 'Bulk upload completed',
          successCount: results.length,
          errorCount: errors.length,
          errors
        });
      });
  
      parser.write(req.file.buffer.toString());
      parser.end();
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during bulk upload' });
    }
  };

module.exports = { createUser, bulkUploadStudents };
