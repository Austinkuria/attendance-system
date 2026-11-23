const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Course = require('../models/Course');
const Unit = require('../models/Unit');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Department = require('../models/Department');
const { dispatchWebhook } = require('../utils/webhookUtils');
const logger = require('../utils/logger');
const { escapeRegex } = require('../utils/securityUtils');

/**
 * POST /api/v1/integrations/roster/sync
 * Idempotent bulk upsert for university SIS / ERP semester roster ingestion.
 */
const syncRoster = async (req, res) => {
  try {
    const {
      source_system = 'sis_sync',
      course_code,
      course_name,
      unit_code,
      unit_name,
      department_name,
      year = 1,
      semester = 1,
      students = []
    } = req.body;

    if (!unit_code || !unit_name || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PAYLOAD',
        message: 'Required fields: unit_code, unit_name, students array'
      });
    }

    // 1. Resolve or create Department
    let department = null;
    if (department_name) {
      const safeDeptName = escapeRegex(String(department_name).trim());
      department = await Department.findOne({
        name: { $regex: new RegExp(`^${safeDeptName}$`, 'i') }
      });
      if (!department) {
        department = await Department.create({
          name: department_name.trim(),
          description: `Imported via ${source_system}`
        });
      }
    } else {
      department = await Department.findOne();
      if (!department) {
        department = await Department.create({
          name: 'General Studies',
          description: 'Default integration department'
        });
      }
    }

    // 2. Resolve or create Course
    const resolvedCourseCode = (course_code || 'GEN').toUpperCase().trim();
    let course = await Course.findOne({ code: resolvedCourseCode });
    if (!course) {
      course = await Course.create({
        name: course_name || `${resolvedCourseCode} Degree Programme`,
        code: resolvedCourseCode,
        department: department._id,
        source_system
      });
    }

    // 3. Resolve or create Unit
    const resolvedUnitCode = unit_code.toUpperCase().trim();
    let unit = await Unit.findOne({ code: resolvedUnitCode });
    if (!unit) {
      unit = await Unit.create({
        name: unit_name.trim(),
        code: resolvedUnitCode,
        course: course._id,
        year: Number(year) || 1,
        semester: Number(semester) || 1,
        source_system,
        studentsEnrolled: []
      });

      // Link unit to course
      await Course.findByIdAndUpdate(course._id, { $addToSet: { units: unit._id } });
    }

    // 4. Idempotently Process Students
    let createdCount = 0;
    let updatedCount = 0;
    let enrolledCount = 0;
    const errors = [];

    const defaultPasswordHash = await bcrypt.hash('Student@2026', 10);

    for (const stu of students) {
      try {
        if (!stu.email || !stu.regNo) {
          errors.push({ student: stu, reason: 'Missing email or regNo' });
          continue;
        }

        const email = stu.email.toLowerCase().trim();
        const regNo = stu.regNo.trim();
        const externalId = stu.external_id ? String(stu.external_id).trim() : null;

        // Search by regNo, external_id, or email
        let student = await User.findOne({
          $or: [
            { regNo },
            ...(externalId ? [{ external_id: externalId }] : []),
            { email }
          ]
        });

        if (student) {
          // Update existing student details
          const updates = {
            firstName: stu.firstName || student.firstName,
            lastName: stu.lastName || student.lastName,
            year: Number(stu.year) || student.year,
            semester: Number(stu.semester) || student.semester,
            course: course._id,
            department: department._id,
            source_system
          };
          if (externalId && !student.external_id) {
            updates.external_id = externalId;
          }

          await User.findByIdAndUpdate(student._id, {
            $set: updates,
            $addToSet: { enrolledUnits: unit._id }
          });
          updatedCount++;
        } else {
          // Create new student record
          student = await User.create({
            role: 'student',
            firstName: stu.firstName || 'Student',
            lastName: stu.lastName || regNo,
            email,
            password: defaultPasswordHash,
            regNo,
            year: Number(stu.year) || 1,
            semester: Number(stu.semester) || 1,
            course: course._id,
            department: department._id,
            external_id: externalId,
            source_system,
            isVerified: true,
            mustChangePassword: true,
            enrolledUnits: [unit._id]
          });
          createdCount++;
        }

        // Add to unit enrolled students
        await Unit.findByIdAndUpdate(unit._id, {
          $addToSet: { studentsEnrolled: student._id }
        });
        enrolledCount++;
      } catch (err) {
        errors.push({ student: stu.regNo || stu.email, reason: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Roster synchronised successfully',
      unit: {
        id: unit._id,
        code: unit.code,
        name: unit.name
      },
      counts: {
        totalReceived: students.length,
        created: createdCount,
        updated: updatedCount,
        enrolled: enrolledCount,
        failed: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    logger.error('Roster sync error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to synchronise roster with integration API',
      error: err.message
    });
  }
};

/**
 * GET /api/v1/integrations/students/:regNumber/eligibility
 * Returns per-unit attendance percentages and an exam eligibility clearance flag.
 */
const getStudentExamEligibility = async (req, res) => {
  try {
    const { regNumber } = req.params;
    const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 75;

    if (!regNumber) {
      return res.status(400).json({
        success: false,
        message: 'Student registration number or external ID is required'
      });
    }

    const trimmedIdentifier = decodeURIComponent(regNumber).trim();
    const safeIdentifier = escapeRegex(trimmedIdentifier);

    // Find student
    const student = await User.findOne({
      $or: [
        { regNo: { $regex: new RegExp(`^${safeIdentifier}$`, 'i') } },
        { external_id: trimmedIdentifier }
      ],
      role: 'student'
    })
      .populate('enrolledUnits', 'name code year semester')
      .populate('course', 'name code')
      .populate('department', 'name');

    if (!student) {
      return res.status(404).json({
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: `No student found matching registration or external ID: ${trimmedIdentifier}`
      });
    }

    const enrolledUnits = student.enrolledUnits || [];
    const unitBreakdown = [];
    let eligibleCount = 0;
    let ineligibleCount = 0;

    for (const unit of enrolledUnits) {
      // Find all sessions held for this unit
      const sessions = await Session.find({ unit: unit._id }).select('_id startTime endTime ended');
      const totalSessions = sessions.length;

      let attendedSessions = 0;
      if (totalSessions > 0) {
        const sessionIds = sessions.map(s => s._id);
        attendedSessions = await Attendance.countDocuments({
          student: student._id,
          session: { $in: sessionIds },
          status: 'Present'
        });
      }

      // If no sessions have been conducted yet, student is held harmless (100%)
      const attendanceRate = totalSessions === 0
        ? 100
        : Math.round((attendedSessions / totalSessions) * 10000) / 100;

      const isUnitEligible = attendanceRate >= threshold;
      if (isUnitEligible) {
        eligibleCount++;
      } else {
        ineligibleCount++;
      }

      unitBreakdown.push({
        unitId: unit._id,
        unitCode: unit.code,
        unitName: unit.name,
        totalSessions,
        attendedSessions,
        attendanceRate,
        threshold,
        eligible: isUnitEligible,
        status: isUnitEligible ? 'Eligible' : 'Attendance Barred'
      });
    }

    const overallExamEligible = ineligibleCount === 0;

    return res.status(200).json({
      success: true,
      student: {
        id: student._id,
        regNo: student.regNo,
        externalId: student.external_id,
        fullName: student.fullName,
        email: student.email,
        course: student.course?.name || 'N/A',
        department: student.department?.name || 'N/A'
      },
      institutionalThreshold: `${threshold}%`,
      examEligible: overallExamEligible,
      summary: {
        totalEnrolledUnits: enrolledUnits.length,
        eligibleUnits: eligibleCount,
        ineligibleUnits: ineligibleCount,
        clearanceStatus: overallExamEligible ? 'CLEARED_FOR_EXAMS' : 'ATTENDANCE_DEFICIT'
      },
      units: unitBreakdown
    });
  } catch (err) {
    logger.error('Student exam eligibility query error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate student exam eligibility',
      error: err.message
    });
  }
};

/**
 * POST /api/v1/integrations/webhooks
 * Register or test signed outbound webhook event delivery.
 */
const handleWebhookRegisterOrTest = async (req, res) => {
  try {
    const { event = 'session.closed', destination_url, secret, test_data } = req.body;

    if (!destination_url) {
      return res.status(400).json({
        success: false,
        message: 'destination_url is required'
      });
    }

    const payload = test_data || {
      sessionId: `ses_${crypto.randomBytes(6).toString('hex')}`,
      unitCode: 'SE301',
      unitName: 'Mobile and Web Application Architecture',
      attendeeCount: 42,
      endedAt: new Date().toISOString()
    };

    const result = await dispatchWebhook(event, payload, destination_url, secret);

    return res.status(200).json({
      success: result.success,
      event,
      destinationUrl: destination_url,
      deliveryStatus: result.status || 'Failed',
      error: result.error
    });
  } catch (err) {
    logger.error('Webhook test error:', err);
    return res.status(500).json({
      success: false,
      message: 'Webhook dispatch failed',
      error: err.message
    });
  }
};

module.exports = {
  syncRoster,
  getStudentExamEligibility,
  handleWebhookRegisterOrTest
};
