const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Course = require('../models/Course');
const Unit = require('../models/Unit');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const RosterIngestionService = require('../services/rosterIngestionService');
const { generateCsvReport, generatePdfReport } = require('../utils/reportGenerator');
const logger = require('../utils/logger');

/**
 * Helper to resolve the authenticated admin's scoped department.
 * Super admins can pass an optional departmentId query/header.
 */
const resolveAdminDepartment = async (req) => {
  const userId = req.user?.userId || req.user?.id;
  let user = null;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    user = await User.findById(userId).select('role department managedDepartments isSuperAdmin');
  }

  let deptId = null;

  if (user?.role === 'super_admin' || user?.isSuperAdmin) {
    deptId = req.query.departmentId || req.headers['x-department-id'] || user?.department;
    if (!deptId && user?.managedDepartments && user.managedDepartments.length > 0) {
      deptId = user.managedDepartments[0];
    }
  } else {
    deptId = req.user?.departmentId || user?.department || (user?.managedDepartments && user.managedDepartments[0]);
  }

  let department = null;
  if (deptId && mongoose.Types.ObjectId.isValid(deptId)) {
    department = await Department.findById(deptId);
  }

  // Fallback if user is unassigned or demo environment
  if (!department) {
    department = await Department.findOne({ name: /Pure and Applied Sciences/i }) || await Department.findOne();
  }

  if (!department) {
    // Create baseline default department so system is fully operative
    department = await Department.create({
      name: 'Pure and Applied Sciences',
      code: 'PAS',
      description: 'Department of Pure and Applied Sciences'
    });
  }

  return department;
};

// ==============================================================================
// 1. Department Overview & Actionable Alerts
// ==============================================================================

exports.getDepartmentOverview = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const deptId = department._id;

    // Fetch department entities in parallel
    const [students, courses, lecturers] = await Promise.all([
      User.find({ role: 'student', department: deptId }).select('_id firstName lastName regNo course year semester isActive').lean(),
      Course.find({ department: deptId }).populate('units').lean(),
      User.find({ role: 'lecturer', department: deptId }).populate('assignedUnits').lean()
    ]);

    const courseIds = courses.map(c => c._id);

    // Calculate attendance across sessions of department units
    const units = await Unit.find({
      $or: [
        { course: { $in: courseIds } },
        { courses: { $in: courseIds } }
      ]
    }).select('_id').lean();

    const unitIds = units.map(u => u._id);

    // Get attendance records for department units
    const sessions = await Session.find({ unit: { $in: unitIds } }).select('_id attendeesCount').lean();
    const sessionIds = sessions.map(s => s._id);

    let totalPresent = 0;
    let totalPossible = 0;

    if (sessionIds.length > 0) {
      const attendances = await Attendance.find({ session: { $in: sessionIds } }).select('status').lean();
      totalPossible = attendances.length;
      totalPresent = attendances.filter(a => a.status === 'Present' || a.status === 'Late').length;
    }

    const overallRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

    // Course Roster with unit count, student count, and individual attendance progress
    const courseRoster = await Promise.all(courses.map(async (c) => {
      const studentCount = students.filter(s => String(s.course) === String(c._id)).length;
      const cUnits = c.units || [];
      const cUnitIds = cUnits.map(u => u._id);

      const cSessions = await Session.find({ unit: { $in: cUnitIds } }).select('_id').lean();
      const cSessionIds = cSessions.map(s => s._id);

      let cPresent = 0;
      let cPossible = 0;
      if (cSessionIds.length > 0) {
        const cAtts = await Attendance.find({ session: { $in: cSessionIds } }).select('status').lean();
        cPossible = cAtts.length;
        cPresent = cAtts.filter(a => a.status === 'Present' || a.status === 'Late').length;
      }

      const cRate = cPossible > 0 ? Math.round((cPresent / cPossible) * 100) : 0;

      return {
        id: c._id,
        _id: c._id,
        name: c.name,
        code: c.code || 'N/A',
        unitsCount: cUnits.length,
        studentCount: studentCount,
        attendanceRate: cRate
      };
    }));

    // Actionable "Needs Attention" Alerts
    const needsAttention = [];

    // Alert 1: Lecturers without assigned units
    lecturers.forEach(l => {
      if (!l.assignedUnits || l.assignedUnits.length === 0) {
        needsAttention.push({
          id: `lecturer-${l._id}`,
          type: 'unassigned_lecturer',
          title: `${l.firstName} ${l.lastName} has no units assigned.`,
          actionText: 'Assign units',
          actionType: 'assign_units',
          targetId: l._id,
          targetName: `${l.firstName} ${l.lastName}`
        });
      }
    });

    // Alert 2: Courses without students enrolled
    courses.forEach(c => {
      const enrolledCount = students.filter(s => String(s.course) === String(c._id)).length;
      if (enrolledCount === 0) {
        needsAttention.push({
          id: `course-${c._id}`,
          type: 'empty_course',
          title: `${c.code || c.name} has no students enrolled yet.`,
          actionText: 'Add student',
          actionType: 'add_student',
          targetId: c._id,
          targetCode: c.code
        });
      }
    });

    res.status(200).json({
      success: true,
      scope: {
        id: department._id,
        name: department.name,
        code: department.code || 'PAS',
        description: department.description || ''
      },
      kpis: {
        studentsCount: students.length,
        coursesCount: courses.length,
        lecturersCount: lecturers.length,
        attendanceRate: overallRate
      },
      courseRoster,
      needsAttention
    });
  } catch (error) {
    logger.error('Error in getDepartmentOverview:', error);
    res.status(500).json({ success: false, message: 'Failed to load department overview', error: error.message });
  }
};

// ==============================================================================
// 2. Department-Scoped Students Management
// ==============================================================================

exports.getStudents = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { search, course, year, semester, status } = req.query;

    const query = { role: 'student', department: department._id };

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { firstName: { $regex: term, $options: 'i' } },
        { lastName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { regNo: { $regex: term, $options: 'i' } }
      ];
    }

    if (course && course !== 'all') {
      query.course = course;
    }
    if (year && year !== 'all') {
      query.year = parseInt(year, 10);
    }
    if (semester && semester !== 'all') {
      query.semester = parseInt(semester, 10);
    }
    if (status && status !== 'all') {
      query.isActive = status === 'Active' || status === 'true';
    }

    const students = await User.find(query)
      .populate('course', 'name code')
      .populate('enrolledUnits', 'name code year semester')
      .sort({ regNo: 1, createdAt: -1 })
      .lean();

    // Map student attendance rates
    const studentIds = students.map(s => s._id);
    const attendances = await Attendance.find({ student: { $in: studentIds } }).select('student status').lean();

    const attMap = {};
    attendances.forEach(a => {
      const sId = String(a.student);
      if (!attMap[sId]) attMap[sId] = { present: 0, total: 0 };
      attMap[sId].total += 1;
      if (a.status === 'Present' || a.status === 'Late') attMap[sId].present += 1;
    });

    const formatted = students.map(s => {
      const att = attMap[String(s._id)] || { present: 0, total: 0 };
      const rate = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;
      return {
        _id: s._id,
        id: s._id,
        regNo: s.regNo || 'N/A',
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: `${s.firstName} ${s.lastName}`,
        email: s.email,
        year: s.year || 1,
        semester: s.semester || 1,
        courseId: s.course?._id || '',
        courseName: s.course?.name || s.course?.code || 'Unassigned',
        enrolledUnitsCount: (s.enrolledUnits || []).length,
        isActive: s.isActive !== false,
        attendanceRate: rate
      };
    });

    res.status(200).json({
      success: true,
      scope: { id: department._id, name: department.name, code: department.code || 'PAS' },
      students: formatted
    });
  } catch (error) {
    logger.error('Error fetching department students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { firstName, lastName, email, regNo, course, year, semester, password } = req.body;

    if (!firstName || !lastName || !email || !regNo || !course) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, reg number, and course are required' });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { regNo: regNo.toUpperCase() }]
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.email === email.toLowerCase() ? 'Email already registered' : 'Registration number already exists'
      });
    }

    const rawPassword = password || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newStudent = new User({
      role: 'student',
      firstName,
      lastName,
      email: email.toLowerCase(),
      regNo: regNo.toUpperCase(),
      password: hashedPassword,
      department: department._id,
      course,
      year: parseInt(year, 10) || 1,
      semester: parseInt(semester, 10) || 1,
      isActive: true,
      isVerified: true,
      mustChangePassword: true,
      createdBy: req.user?.userId
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      student: {
        id: newStudent._id,
        fullName: `${newStudent.firstName} ${newStudent.lastName}`,
        email: newStudent.email,
        regNo: newStudent.regNo
      },
      temporaryPassword: rawPassword
    });
  } catch (error) {
    logger.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll student', error: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;
    const { firstName, lastName, email, regNo, course, year, semester, isActive } = req.body;

    const student = await User.findOne({ _id: id, role: 'student', department: department._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in your department' });
    }

    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (email) student.email = email.toLowerCase();
    if (regNo) student.regNo = regNo.toUpperCase();
    if (course) student.course = course;
    if (year !== undefined) student.year = parseInt(year, 10);
    if (semester !== undefined) student.semester = parseInt(semester, 10);
    if (isActive !== undefined) student.isActive = Boolean(isActive);

    await student.save();
    res.status(200).json({ success: true, message: 'Student updated successfully', student });
  } catch (error) {
    logger.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Failed to update student', error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;

    const student = await User.findOneAndDelete({ _id: id, role: 'student', department: department._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in your department' });
    }

    // Clean up enrollment from units
    await Unit.updateMany({ studentsEnrolled: id }, { $pull: { studentsEnrolled: id } });

    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    logger.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: 'Failed to delete student', error: error.message });
  }
};

exports.getStudentUnits = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;

    const student = await User.findOne({ _id: id, role: 'student', department: department._id })
      .populate('enrolledUnits')
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in your department' });
    }

    // Also get all available units under the department
    const courses = await Course.find({ department: department._id }).select('_id').lean();
    const courseIds = courses.map(c => c._id);

    const availableUnits = await Unit.find({
      $or: [
        { course: { $in: courseIds } },
        { courses: { $in: courseIds } }
      ]
    }).lean();

    res.status(200).json({
      success: true,
      enrolledUnits: student.enrolledUnits || [],
      availableUnits: availableUnits || []
    });
  } catch (error) {
    logger.error('Error fetching student units:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student units', error: error.message });
  }
};

exports.enrolStudentInUnit = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;
    const { unitId } = req.body;

    if (!unitId) {
      return res.status(400).json({ success: false, message: 'Unit ID is required' });
    }

    const student = await User.findOne({ _id: id, role: 'student', department: department._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in your department' });
    }

    await User.findByIdAndUpdate(id, { $addToSet: { enrolledUnits: unitId } });
    await Unit.findByIdAndUpdate(unitId, { $addToSet: { studentsEnrolled: id } });

    const updatedStudent = await User.findById(id).populate('enrolledUnits').lean();
    res.status(200).json({ success: true, message: 'Enrolled in unit successfully', enrolledUnits: updatedStudent.enrolledUnits });
  } catch (error) {
    logger.error('Error enrolling student in unit:', error);
    res.status(500).json({ success: false, message: 'Failed to enrol student in unit', error: error.message });
  }
};

exports.removeStudentFromUnit = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id, unitId } = req.params;

    const student = await User.findOne({ _id: id, role: 'student', department: department._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in your department' });
    }

    await User.findByIdAndUpdate(id, { $pull: { enrolledUnits: unitId } });
    await Unit.findByIdAndUpdate(unitId, { $pull: { studentsEnrolled: id } });

    res.status(200).json({ success: true, message: 'Unit removed from student curriculum' });
  } catch (error) {
    logger.error('Error removing student from unit:', error);
    res.status(500).json({ success: false, message: 'Failed to remove unit', error: error.message });
  }
};

exports.bulkStudentsAction = async (req, res) => {
  try {
    const { action, studentIds, unitId, year, semester } = req.body || {};

    if (!action || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Action and array of studentIds are required' });
    }

    const department = await resolveAdminDepartment(req);

    // Ensure all target students belong to the admin's department
    const targetFilter = { _id: { $in: studentIds }, role: 'student', department: department._id };

    switch (action) {
      case 'enrol_unit':
        if (!unitId) {
          return res.status(400).json({ success: false, message: 'unitId is required for enrol_unit' });
        }
        await User.updateMany(targetFilter, { $addToSet: { enrolledUnits: unitId } });
        await Unit.findByIdAndUpdate(unitId, { $addToSet: { studentsEnrolled: { $each: studentIds } } });
        return res.status(200).json({ success: true, message: `Enrolled ${studentIds.length} students into unit` });

      case 'change_semester':
        const updateDoc = {};
        if (year) updateDoc.year = parseInt(year, 10);
        if (semester) updateDoc.semester = parseInt(semester, 10);
        await User.updateMany(targetFilter, { $set: updateDoc });
        return res.status(200).json({ success: true, message: `Updated academic stage for ${studentIds.length} students` });

      case 'deactivate':
        await User.updateMany(targetFilter, { $set: { isActive: false } });
        return res.status(200).json({ success: true, message: `Deactivated ${studentIds.length} students` });

      case 'activate':
        await User.updateMany(targetFilter, { $set: { isActive: true } });
        return res.status(200).json({ success: true, message: `Activated ${studentIds.length} students` });

      case 'delete':
        const delRes = await User.deleteMany(targetFilter);
        await Unit.updateMany({ studentsEnrolled: { $in: studentIds } }, { $pull: { studentsEnrolled: { $in: studentIds } } });
        return res.status(200).json({ success: true, message: `Permanently deleted ${delRes.deletedCount} students` });

      default:
        return res.status(400).json({ success: false, message: `Unsupported bulk action: ${action}` });
    }
  } catch (error) {
    logger.error('Error performing bulk student action:', error);
    res.status(500).json({ success: false, message: 'Bulk operation failed', error: error.message });
  }
};

// ==============================================================================
// 3. Department-Scoped Courses Management
// ==============================================================================

exports.getCourses = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const courses = await Course.find({ department: department._id })
      .populate('units')
      .sort({ code: 1, name: 1 })
      .lean();

    const courseIds = courses.map(c => c._id);
    const students = await User.find({ role: 'student', course: { $in: courseIds } }).select('course').lean();

    const formatted = await Promise.all(courses.map(async (c) => {
      const studentCount = students.filter(s => String(s.course) === String(c._id)).length;
      const cUnits = c.units || [];
      const cUnitIds = cUnits.map(u => u._id);

      const sessions = await Session.find({ unit: { $in: cUnitIds } }).select('_id').lean();
      const sessionIds = sessions.map(s => s._id);

      let present = 0;
      let total = 0;
      if (sessionIds.length > 0) {
        const atts = await Attendance.find({ session: { $in: sessionIds } }).select('status').lean();
        total = atts.length;
        present = atts.filter(a => a.status === 'Present' || a.status === 'Late').length;
      }
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        _id: c._id,
        id: c._id,
        code: c.code || 'N/A',
        name: c.name,
        department: c.department || department._id,
        durationYears: c.durationYears || c.duration || 4,
        unitsCount: cUnits.length,
        studentCount,
        attendanceRate: rate,
        units: cUnits
      };
    }));

    res.status(200).json({
      success: true,
      scope: { id: department._id, name: department.name, code: department.code || 'PAS' },
      courses: formatted
    });
  } catch (error) {
    logger.error('Error fetching department courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses', error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { name, code, durationYears } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Course code and programme title are required' });
    }

    const existing = await Course.findOne({
      department: department._id,
      $or: [{ code: code.toUpperCase() }, { name }]
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Course with this code or title already exists in your department' });
    }

    const newCourse = new Course({
      name,
      code: code.toUpperCase(),
      department: department._id,
      durationYears: parseInt(durationYears, 10) || 4,
      units: []
    });

    await newCourse.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course: newCourse
    });
  } catch (error) {
    logger.error('Error creating course:', error);
    res.status(500).json({ success: false, message: 'Failed to create course', error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;
    const { name, code, durationYears } = req.body;

    const course = await Course.findOne({ _id: id, department: department._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in your department' });
    }

    if (name) course.name = name;
    if (code) course.code = code.toUpperCase();
    if (durationYears !== undefined) course.durationYears = parseInt(durationYears, 10) || course.durationYears;

    await course.save();
    res.status(200).json({ success: true, message: 'Course updated successfully', course });
  } catch (error) {
    logger.error('Error updating course:', error);
    res.status(500).json({ success: false, message: 'Failed to update course', error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;

    const course = await Course.findOneAndDelete({ _id: id, department: department._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in your department' });
    }

    res.status(200).json({ success: true, message: 'Course removed successfully' });
  } catch (error) {
    logger.error('Error deleting course:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course', error: error.message });
  }
};

exports.getCourseUnits = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;

    const course = await Course.findOne({ _id: id, department: department._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in your department' });
    }

    const units = await Unit.find({
      $or: [
        { course: id },
        { courses: id }
      ]
    }).lean();

    res.status(200).json({ success: true, units });
  } catch (error) {
    logger.error('Error fetching course units:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course units', error: error.message });
  }
};

exports.addCourseUnit = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;
    const { name, code, year, semester } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Unit name and code are required' });
    }

    const course = await Course.findOne({ _id: id, department: department._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in your department' });
    }

    let unit = await Unit.findOne({ code: code.toUpperCase() });

    if (!unit) {
      unit = new Unit({
        name,
        code: code.toUpperCase(),
        course: course._id,
        courses: [course._id],
        year: parseInt(year, 10) || 1,
        semester: parseInt(semester, 10) || 1,
        studentsEnrolled: []
      });
      await unit.save();
    } else {
      // Cross-list existing unit to this programme
      await Unit.findByIdAndUpdate(unit._id, { $addToSet: { courses: course._id } });
    }

    await Course.findByIdAndUpdate(id, { $addToSet: { units: unit._id } });

    res.status(201).json({ success: true, message: 'Unit added and linked to programme', unit });
  } catch (error) {
    logger.error('Error adding course unit:', error);
    res.status(500).json({ success: false, message: 'Failed to add unit to course', error: error.message });
  }
};

exports.removeCourseUnit = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id, unitId } = req.params;

    const course = await Course.findOne({ _id: id, department: department._id });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in your department' });
    }

    await Course.findByIdAndUpdate(id, { $pull: { units: unitId } });
    await Unit.findByIdAndUpdate(unitId, { $pull: { courses: id } });

    res.status(200).json({ success: true, message: 'Unit unlinked from course syllabus' });
  } catch (error) {
    logger.error('Error removing course unit:', error);
    res.status(500).json({ success: false, message: 'Failed to unlink unit', error: error.message });
  }
};

exports.getDepartmentUnits = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const courses = await Course.find({ department: department._id }).select('_id').lean();
    const courseIds = courses.map(c => c._id);

    const units = await Unit.find({
      $or: [
        { department: department._id },
        { course: { $in: courseIds } },
        { courses: { $in: courseIds } }
      ]
    }).populate('course courses lecturer').lean();

    res.status(200).json({
      success: true,
      scope: { id: department._id, name: department.name, code: department.code || 'PAS' },
      units: units || []
    });
  } catch (error) {
    logger.error('Error fetching department units:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department units', error: error.message });
  }
};

// ==============================================================================
// 4. Department-Scoped Lecturers Management
// ==============================================================================

exports.getLecturers = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { search, unit, status } = req.query;

    const query = { role: 'lecturer', department: department._id };

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { firstName: { $regex: term, $options: 'i' } },
        { lastName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } }
      ];
    }

    if (unit && unit !== 'all') {
      query.assignedUnits = unit;
    }
    if (status && status !== 'all') {
      query.isActive = status === 'Active' || status === 'true';
    }

    const lecturers = await User.find(query)
      .populate('assignedUnits', 'name code')
      .sort({ firstName: 1 })
      .lean();

    const formatted = lecturers.map(l => ({
      _id: l._id,
      id: l._id,
      firstName: l.firstName,
      lastName: l.lastName,
      fullName: `${l.firstName} ${l.lastName}`,
      email: l.email,
      assignedUnits: l.assignedUnits || [],
      assignedUnitsCount: (l.assignedUnits || []).length,
      isActive: l.isActive !== false
    }));

    res.status(200).json({
      success: true,
      scope: { id: department._id, name: department.name, code: department.code || 'PAS' },
      lecturers: formatted
    });
  } catch (error) {
    logger.error('Error fetching department lecturers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lecturers', error: error.message });
  }
};

exports.createLecturer = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { firstName, lastName, email, temporaryPassword, emailLoginDetails } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name, and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this email address already exists' });
    }

    const rawPassword = temporaryPassword || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newLecturer = new User({
      role: 'lecturer',
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      department: department._id,
      assignedUnits: [],
      isActive: true,
      isVerified: true,
      mustChangePassword: true,
      createdBy: req.user?.userId
    });

    await newLecturer.save();

    // If emailLoginDetails is checked, log or queue notification
    if (emailLoginDetails) {
      logger.info(`Login credentials queued for faculty member: ${email}`);
    }

    res.status(201).json({
      success: true,
      message: 'Lecturer registered successfully',
      lecturer: {
        id: newLecturer._id,
        fullName: `${newLecturer.firstName} ${newLecturer.lastName}`,
        email: newLecturer.email
      },
      temporaryPassword: rawPassword
    });
  } catch (error) {
    logger.error('Error creating lecturer:', error);
    res.status(500).json({ success: false, message: 'Failed to create lecturer', error: error.message });
  }
};

exports.updateLecturer = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;
    const { firstName, lastName, email, assignedUnits, isActive } = req.body;

    const lecturer = await User.findOne({ _id: id, role: 'lecturer', department: department._id });
    if (!lecturer) {
      return res.status(404).json({ success: false, message: 'Lecturer not found in your department' });
    }

    if (firstName) lecturer.firstName = firstName;
    if (lastName) lecturer.lastName = lastName;
    if (email) lecturer.email = email.toLowerCase();
    if (assignedUnits !== undefined) lecturer.assignedUnits = assignedUnits;
    if (isActive !== undefined) lecturer.isActive = Boolean(isActive);

    await lecturer.save();
    res.status(200).json({ success: true, message: 'Lecturer updated successfully', lecturer });
  } catch (error) {
    logger.error('Error updating lecturer:', error);
    res.status(500).json({ success: false, message: 'Failed to update lecturer', error: error.message });
  }
};

exports.deleteLecturer = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;

    const lecturer = await User.findOneAndDelete({ _id: id, role: 'lecturer', department: department._id });
    if (!lecturer) {
      return res.status(404).json({ success: false, message: 'Lecturer not found in your department' });
    }

    // Clean up unit lecturer assignments
    await Unit.updateMany({ lecturer: id }, { $set: { lecturer: null } });
    await Unit.updateMany({ coLecturers: id }, { $pull: { coLecturers: id } });

    res.status(200).json({ success: true, message: 'Lecturer removed successfully' });
  } catch (error) {
    logger.error('Error deleting lecturer:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lecturer', error: error.message });
  }
};

exports.assignLecturerUnit = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id } = req.params;
    const { unitId } = req.body;

    if (!unitId) {
      return res.status(400).json({ success: false, message: 'Unit ID is required' });
    }

    const lecturer = await User.findOne({ _id: id, role: 'lecturer', department: department._id });
    if (!lecturer) {
      return res.status(404).json({ success: false, message: 'Lecturer not found in your department' });
    }

    await User.findByIdAndUpdate(id, { $addToSet: { assignedUnits: unitId } });
    await Unit.findByIdAndUpdate(unitId, { $addToSet: { coLecturers: id } });

    const updated = await User.findById(id).populate('assignedUnits').lean();
    res.status(200).json({ success: true, message: 'Unit assigned to lecturer', assignedUnits: updated.assignedUnits });
  } catch (error) {
    logger.error('Error assigning lecturer unit:', error);
    res.status(500).json({ success: false, message: 'Failed to assign unit', error: error.message });
  }
};

exports.unassignLecturerUnit = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { id, unitId } = req.params;

    const lecturer = await User.findOne({ _id: id, role: 'lecturer', department: department._id });
    if (!lecturer) {
      return res.status(404).json({ success: false, message: 'Lecturer not found in your department' });
    }

    await User.findByIdAndUpdate(id, { $pull: { assignedUnits: unitId } });
    await Unit.findByIdAndUpdate(unitId, { $pull: { coLecturers: id } });

    res.status(200).json({ success: true, message: 'Unit unassigned from lecturer' });
  } catch (error) {
    logger.error('Error unassigning lecturer unit:', error);
    res.status(500).json({ success: false, message: 'Failed to unassign unit', error: error.message });
  }
};

// ==============================================================================
// 5. Official Spreadsheet Template Download (.xlsx)
// ==============================================================================

exports.downloadTemplate = async (req, res) => {
  try {
    const { entity } = req.params;

    let buffer = null;
    let filename = '';

    switch (entity) {
      case 'students':
        buffer = await RosterIngestionService.generateStudentTemplate();
        filename = 'Students_Template.xlsx';
        break;
      case 'courses':
        buffer = await RosterIngestionService.generateCourseTemplate();
        filename = 'Courses_Template.xlsx';
        break;
      case 'lecturers':
        buffer = await RosterIngestionService.generateLecturerTemplate();
        filename = 'Lecturers_Template.xlsx';
        break;
      case 'units':
        buffer = await RosterIngestionService.generateUnitTemplate();
        filename = 'Units_Template.xlsx';
        break;
      default:
        return res.status(400).json({ success: false, message: `Unknown template entity: ${entity}` });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    logger.error('Error downloading template:', error);
    res.status(500).json({ success: false, message: 'Failed to generate template', error: error.message });
  }
};

// ==============================================================================
// 6. Row-Validated Bulk Import (.xlsx & .csv)
// ==============================================================================

exports.importSpreadsheet = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { entity } = req.params;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx) or CSV file' });
    }

    const rows = await RosterIngestionService.parseBuffer(req.file.buffer, req.file.originalname);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'The uploaded file contains no data rows' });
    }

    const creatorId = req.user?.userId;
    let result = null;

    switch (entity) {
      case 'students':
        result = await RosterIngestionService.ingestStudents(rows, creatorId, department._id);
        break;
      case 'courses':
        result = await RosterIngestionService.ingestCourses(rows, department._id);
        break;
      case 'lecturers':
        result = await RosterIngestionService.ingestLecturers(rows, creatorId, department._id);
        break;
      case 'units':
        result = await RosterIngestionService.ingestUnits(rows);
        break;
      default:
        return res.status(400).json({ success: false, message: `Unknown import entity: ${entity}` });
    }

    res.status(200).json({
      success: true,
      message: `Batch import complete: ${result.successfulCount} enrolled, ${result.duplicateCount} duplicates skipped, ${result.errorCount} errors`,
      report: result
    });
  } catch (error) {
    logger.error('Error during bulk import:', error);
    res.status(500).json({ success: false, message: 'Server error during spreadsheet import', error: error.message });
  }
};

// ==============================================================================
// 7. Department Analytics & PDF/CSV Export
// ==============================================================================

exports.getAnalytics = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { courseId, unitId, view = 'weekly' } = req.query;

    const deptCourses = await Course.find({ department: department._id }).populate('units').lean();
    const deptCourseIds = deptCourses.map(c => c._id);

    // Target units
    let targetUnitIds = [];
    if (unitId && unitId !== 'all') {
      targetUnitIds = [unitId];
    } else if (courseId && courseId !== 'all') {
      const selectedC = deptCourses.find(c => String(c._id) === String(courseId));
      targetUnitIds = (selectedC?.units || []).map(u => u._id);
    } else {
      deptCourses.forEach(c => {
        (c.units || []).forEach(u => targetUnitIds.push(u._id));
      });
    }

    const sessions = await Session.find({ unit: { $in: targetUnitIds } })
      .populate('unit', 'name code')
      .sort({ startTime: 1 })
      .lean();

    const sessionIds = sessions.map(s => s._id);
    const attendances = await Attendance.find({ session: { $in: sessionIds } }).lean();

    const totalPossible = attendances.length;
    const totalPresent = attendances.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const totalAbsent = totalPossible - totalPresent;
    const overallRate = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;

    // Build timeline trends (Weekly or Daily)
    const trendsMap = new Map();
    sessions.forEach(sess => {
      const d = sess.startTime ? new Date(sess.startTime) : new Date();
      const key = view === 'daily'
        ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
        : `Week ${Math.ceil(d.getDate() / 7)} (${d.toLocaleDateString('en-GB', { month: 'short' })})`;

      if (!trendsMap.has(key)) {
        trendsMap.set(key, { label: key, present: 0, absent: 0, total: 0 });
      }

      const sAtts = attendances.filter(a => String(a.session) === String(sess._id));
      const sPres = sAtts.filter(a => a.status === 'Present' || a.status === 'Late').length;
      const sAbs = sAtts.length - sPres;

      const cur = trendsMap.get(key);
      cur.present += sPres;
      cur.absent += sAbs;
      cur.total += sAtts.length;
    });

    const trends = Array.from(trendsMap.values()).map(t => ({
      period: t.label,
      present: t.present,
      absent: t.absent,
      rate: t.total > 0 ? Math.round((t.present / t.total) * 100) : 0
    }));

    // Units ranked by attendance rate
    const unitsMap = new Map();
    sessions.forEach(sess => {
      const u = sess.unit;
      if (!u) return;
      const uId = String(u._id);
      if (!unitsMap.has(uId)) {
        unitsMap.set(uId, { id: u._id, code: u.code, name: u.name, present: 0, total: 0 });
      }
      const sAtts = attendances.filter(a => String(a.session) === String(sess._id));
      const sPres = sAtts.filter(a => a.status === 'Present' || a.status === 'Late').length;
      const item = unitsMap.get(uId);
      item.present += sPres;
      item.total += sAtts.length;
    });

    const rankedUnits = Array.from(unitsMap.values())
      .map(u => ({
        ...u,
        rate: u.total > 0 ? Math.round((u.present / u.total) * 100) : 0
      }))
      .sort((a, b) => b.rate - a.rate);

    res.status(200).json({
      success: true,
      scope: { id: department._id, name: department.name, code: department.code || 'PAS' },
      summary: {
        totalPresent,
        totalAbsent,
        totalPossible,
        attendanceRate: overallRate
      },
      trends,
      rankedUnits
    });
  } catch (error) {
    logger.error('Error in getDepartmentAnalytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const department = await resolveAdminDepartment(req);
    const { format = 'csv' } = req.query;

    const courses = await Course.find({ department: department._id }).populate('units').lean();
    const courseIds = courses.map(c => c._id);

    const units = await Unit.find({
      $or: [
        { course: { $in: courseIds } },
        { courses: { $in: courseIds } }
      ]
    }).lean();

    const unitIds = units.map(u => u._id);
    const sessions = await Session.find({ unit: { $in: unitIds } }).populate('unit').lean();
    const sessionIds = sessions.map(s => s._id);

    const attendances = await Attendance.find({ session: { $in: sessionIds } })
      .populate('student', 'firstName lastName regNo email')
      .populate({
        path: 'session',
        populate: { path: 'unit' }
      })
      .lean();

    const records = attendances.map(a => ({
      session: a.session,
      unitCode: a.session?.unit?.code || 'N/A',
      unitName: a.session?.unit?.name || 'Unit',
      status: a.status,
      check_in_method: a.check_in_method,
      attendedAt: a.attendedAt || a.createdAt,
      studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'N/A',
      studentRegNo: a.student?.regNo || 'N/A'
    }));

    const deptInfo = {
      fullName: `Department of ${department.name}`,
      regNumber: department.code || 'DEPT',
      courseName: 'All Programmes'
    };

    if (format === 'pdf') {
      const pdfBuffer = generatePdfReport(records, deptInfo);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${department.code || 'dept'}_attendance_report.pdf"`);
      return res.send(pdfBuffer);
    }

    const csvContent = generateCsvReport(records, deptInfo);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${department.code || 'dept'}_attendance_report.csv"`);
    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting report:', error);
    res.status(500).json({ success: false, message: 'Failed to export report', error: error.message });
  }
};
