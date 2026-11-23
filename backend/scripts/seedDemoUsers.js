require('dotenv').config();
const dns = require('dns');

// Resolve MongoDB Atlas SRV records reliably across local networks/ISPs
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  // Use system resolver if custom DNS servers cannot be set
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Unit = require('../models/Unit');

const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'DemoPassword123!';

const seedDemoAccounts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-system';
    console.log('Connecting to MongoDB for demo seeding...');
    await mongoose.connect(mongoUri);

    // Find or create default department
    let department = await Department.findOne({ name: 'School of Computing' });
    if (!department) {
      department = await Department.create({
        name: 'School of Computing',
        description: 'Department of Computer Science and Technology'
      });
      console.log('Created demo department: School of Computing');
    }

    // Find or create default course
    let course = await Course.findOne({ code: 'BSSE' });
    if (!course) {
      course = await Course.create({
        name: 'Bachelor of Science in Software Engineering',
        code: 'BSSE',
        department: department._id
      });
      console.log('Created demo course: BSSE');
    }

    // Find or create demo units
    let unit = await Unit.findOne({ code: 'SE301' });
    if (!unit) {
      unit = await Unit.create({
        name: 'Mobile and Web Application Architecture',
        code: 'SE301',
        course: course._id,
        year: 3,
        semester: 1
      });
      console.log('Created demo unit: SE301');
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    const demoUsers = [
      {
        email: 'superadmin@demo.ac.ke',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'super_admin',
        isSuperAdmin: true,
        isActive: true,
        isVerified: true,
        mustChangePassword: false,
        password: hashedPassword
      },
      {
        email: 'admin@demo.ac.ke',
        firstName: 'Department',
        lastName: 'Admin',
        role: 'department_admin',
        department: department._id,
        managedDepartments: [department._id],
        isActive: true,
        isVerified: true,
        mustChangePassword: false,
        password: hashedPassword
      },
      {
        email: 'lecturer@demo.ac.ke',
        firstName: 'Senior',
        lastName: 'Lecturer',
        role: 'lecturer',
        department: department._id,
        assignedUnits: [unit._id],
        isActive: true,
        isVerified: true,
        mustChangePassword: false,
        password: hashedPassword
      },
      {
        email: 'student@demo.ac.ke',
        firstName: 'Alex',
        lastName: 'Kuria',
        regNo: 'SCM/DEMO/22',
        role: 'student',
        department: department._id,
        course: course._id,
        enrolledUnits: [unit._id],
        year: 3,
        semester: 1,
        isActive: true,
        isVerified: true,
        mustChangePassword: false,
        password: hashedPassword
      }
    ];

    for (const demo of demoUsers) {
      const existing = await User.findOne({ email: demo.email });
      if (existing) {
        Object.assign(existing, demo);
        await existing.save();
        console.log(`Updated demo account: ${demo.email} (${demo.role})`);
      } else {
        await User.create(demo);
        console.log(`Created demo account: ${demo.email} (${demo.role})`);
      }
    }

    // Link lecturer to unit
    const lecturer = await User.findOne({ email: 'lecturer@demo.ac.ke' });
    if (lecturer && unit) {
      unit.lecturer = lecturer._id;
      if (!unit.studentsEnrolled) unit.studentsEnrolled = [];
      const student = await User.findOne({ email: 'student@demo.ac.ke' });
      if (student && !unit.studentsEnrolled.includes(student._id)) {
        unit.studentsEnrolled.push(student._id);
      }
      await unit.save();
    }

    console.log('Demo accounts seeded successfully!');
    console.log('Default credentials configured for demo accounts.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed demo accounts:', error);
    process.exit(1);
  }
};

seedDemoAccounts();
