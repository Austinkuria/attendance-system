const User = require("../models/User");
const Course = require("../models/course");
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

// Bulk upload students via CSV
const bulkUploadStudents = async (req, res) => {
    try {
        const students = [];
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on("data", (row) => {
                students.push(row);
            })
            .on("end", async () => {
                for (let student of students) {
                    const { firstName, lastName, regNo, email, password, departmentId, courseId } = student;

                    const department = await Department.findById(departmentId);
                    const course = await Course.findById(courseId);

                    const newUser = new User({
                        role: "student",
                        firstName,
                        lastName,
                        regNo,
                        email,
                        password,
                        department,
                        course
                    });

                    await newUser.save();
                }

                res.status(200).json({ message: "Students uploaded successfully" });
            });
    } catch (err) {
        res.status(500).json({ message: "Error uploading students", error: err.message });
    }
};

module.exports = { createUser, bulkUploadStudents };
