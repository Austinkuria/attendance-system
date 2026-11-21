const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Course = require('../models/Course');
const Department = require('../models/Department');
const User = require('../models/User');

async function check() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri);
  const depts = await Department.find();
  console.log('--- DEPARTMENTS ---');
  depts.forEach(d => console.log(d._id.toString(), d.name, d.code));
  
  const courses = await Course.find();
  console.log('--- COURSES ---');
  courses.forEach(c => console.log(c._id.toString(), c.code, c.name, 'dept:', c.department ? c.department.toString() : 'NONE'));

  const admins = await User.find({ role: { $in: ['admin', 'department_admin'] } });
  console.log('--- DEPT ADMINS ---');
  admins.forEach(a => console.log(a._id.toString(), a.email, a.role, 'dept:', a.department ? a.department.toString() : 'NONE'));

  process.exit(0);
}
check().catch(err => {
  console.error(err);
  process.exit(1);
});
