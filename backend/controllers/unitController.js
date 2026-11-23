const Unit = require("../models/Unit");
const User = require("../models/User");
const Course = require("../models/Course");
const authenticate = require("../middleware/authMiddleware");
const router = require("express").Router();
const mongoose = require("mongoose");
const { getSafeFileBuffer } = require("../utils/securityUtils");

// Add a new unit (supports multi-course cross-listing and shared lecturers)
const addUnit = async (req, res) => {
    try {
        const { name, code, course, courses, year, semester, lecturer, coLecturers, studentsEnrolled } = req.body;

        const resolvedCourses = [];
        if (Array.isArray(courses)) {
            courses.forEach(c => {
                if (c && mongoose.Types.ObjectId.isValid(c)) resolvedCourses.push(c);
            });
        }
        if (course && mongoose.Types.ObjectId.isValid(course) && !resolvedCourses.includes(course)) {
            resolvedCourses.push(course);
        }

        const primaryCourse = course || (resolvedCourses.length > 0 ? resolvedCourses[0] : null);

        let resolvedDepartment = req.body.department;
        if (!resolvedDepartment && primaryCourse) {
            const courseDoc = await Course.findById(primaryCourse).select('department');
            if (courseDoc && courseDoc.department) {
                resolvedDepartment = courseDoc.department;
            }
        }

        const newUnit = new Unit({
            name,
            code: code ? code.trim().toUpperCase() : undefined,
            department: resolvedDepartment,
            course: primaryCourse,
            courses: resolvedCourses,
            year: year || 1,
            semester: semester || 1,
            lecturer: lecturer && mongoose.Types.ObjectId.isValid(lecturer) ? lecturer : null,
            coLecturers: Array.isArray(coLecturers) ? coLecturers.filter(l => mongoose.Types.ObjectId.isValid(l)) : [],
            studentsEnrolled: Array.isArray(studentsEnrolled) ? studentsEnrolled : []
        });

        await newUnit.save();

        // Synchronize with all linked degree courses
        if (resolvedCourses.length > 0) {
            await Course.updateMany(
                { _id: { $in: resolvedCourses } },
                { $addToSet: { units: newUnit._id } }
            );
        }

        // Synchronize with assigned lecturer
        if (newUnit.lecturer) {
            await User.findByIdAndUpdate(newUnit.lecturer, {
                $addToSet: { assignedUnits: newUnit._id }
            });
        }

        res.status(201).json({ message: "Unit created successfully", unit: newUnit });
    } catch (err) {
        res.status(500).json({ message: "Error creating unit", error: err.message });
    }
};

// Fetch units for a specific student
const getUnit = async (req, res) => {
    try {
        const units = await Unit.find({ studentsEnrolled: req.user.userId }).populate("course courses lecturer coLecturers");
        if (!units) {
            return res.status(404).json({ message: "No units found for this student" });
        }
        res.status(200).json(units);
    } catch (err) {
        res.status(500).json({ message: "Error fetching units", error: err.message });
    }
};

// Update unit details by ID (with cross-listing synchronization)
const updateUnit = async (req, res) => {
    try {
        const unitId = req.params.id;
        const updates = { ...req.body };

        if (updates.courses && Array.isArray(updates.courses)) {
            updates.courses = updates.courses.filter(c => mongoose.Types.ObjectId.isValid(c));
            if (!updates.course && updates.courses.length > 0) {
                updates.course = updates.courses[0];
            }
        } else if (updates.course && mongoose.Types.ObjectId.isValid(updates.course)) {
            updates.courses = [updates.course];
        }

        const existingUnit = await Unit.findById(unitId);
        if (!existingUnit) {
            return res.status(404).json({ message: "Unit not found" });
        }

        const updatedUnit = await Unit.findByIdAndUpdate(unitId, updates, { new: true })
            .populate("course courses lecturer coLecturers");

        // Sync with Course.units: remove from courses no longer linked, add to newly linked
        const oldCourseIds = (existingUnit.courses || []).map(c => c.toString());
        if (existingUnit.course) oldCourseIds.push(existingUnit.course.toString());

        const newCourseIds = (updatedUnit.courses || []).map(c => c._id ? c._id.toString() : c.toString());
        if (updatedUnit.course) newCourseIds.push(updatedUnit.course._id ? updatedUnit.course._id.toString() : updatedUnit.course.toString());

        const coursesToRemove = oldCourseIds.filter(c => !newCourseIds.includes(c));
        const coursesToAdd = newCourseIds.filter(c => !oldCourseIds.includes(c));

        if (coursesToRemove.length > 0) {
            await Course.updateMany(
                { _id: { $in: coursesToRemove } },
                { $pull: { units: unitId } }
            );
        }

        if (coursesToAdd.length > 0) {
            await Course.updateMany(
                { _id: { $in: coursesToAdd } },
                { $addToSet: { units: unitId } }
            );
        }

        res.status(200).json(updatedUnit);
    } catch (err) {
        res.status(500).json({ message: "Error updating unit", error: err.message });
    }
};

// Delete unit by ID
const deleteUnit = async (req, res) => {
    try {
        const deletedUnit = await Unit.findByIdAndDelete(req.params.id);
        if (!deletedUnit) {
            return res.status(404).json({ message: "Unit not found" });
        }

        // Clean up course references
        await Course.updateMany(
            {},
            { $pull: { units: req.params.id } }
        );

        // Clean up lecturer assignments
        await User.updateMany(
            {},
            { $pull: { assignedUnits: req.params.id } }
        );

        res.status(200).json({ message: "Unit deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting unit", error: err.message });
    }
};

const getStudentUnits = async (req, res) => {
  try {
    const studentId = req.user?.userId || req.user?.id || req.user?._id;
    const student = await User.findById(studentId).populate({
      path: "enrolledUnits",
      populate: { path: "lecturer course courses" }
    });

    const unitMap = new Map();
    if (student && student.enrolledUnits) {
      student.enrolledUnits.forEach((u) => {
        if (u && u._id) unitMap.set(u._id.toString(), u);
      });
    }

    // Also find units where student is in studentsEnrolled or matching course
    const directUnits = await Unit.find({
      $or: [
        { studentsEnrolled: studentId },
        ...(student?.course ? [{ $or: [{ course: student.course }, { courses: student.course }] }] : [])
      ]
    }).populate("lecturer course courses");

    directUnits.forEach((u) => {
      if (u && u._id && !unitMap.has(u._id.toString())) {
        unitMap.set(u._id.toString(), u);
      }
    });

    // If still empty (e.g. newly registered or demo student), pull active campus units
    if (unitMap.size === 0) {
      const allUnits = await Unit.find().limit(6).populate("lecturer course courses");
      allUnits.forEach((u) => {
        if (u && u._id) unitMap.set(u._id.toString(), u);
      });
    }

    const units = Array.from(unitMap.values());
    res.set("Cache-Control", "no-store");
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all units (scoped by department for department admins)
const getUnits = async (req, res) => {
  try {
    let query = {};
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    let deptId = req.query.departmentId || req.user?.departmentId || req.user?.department;

    if (!deptId && userId) {
      const user = await User.findById(userId).select('role department managedDepartments isSuperAdmin');
      if (user?.role !== 'super_admin' && !user?.isSuperAdmin) {
        deptId = user?.department || (user?.managedDepartments && user.managedDepartments[0]);
      }
    }

    if (deptId && mongoose.Types.ObjectId.isValid(deptId)) {
      const deptCourses = await Course.find({ department: deptId }).select('_id');
      const deptCourseIds = deptCourses.map(c => c._id);
      query = {
        $or: [
          { department: deptId },
          { course: { $in: deptCourseIds } },
          { courses: { $in: deptCourseIds } }
        ]
      };
    }

    const units = await Unit.find(query).populate("course courses lecturer coLecturers");
    res.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getLecturerUnits = async (req, res) => {
  try {
    let lecturerId = req.params.lecturerId;
    if (!lecturerId || lecturerId === 'me' || lecturerId === 'undefined' || lecturerId === 'null') {
      lecturerId = req.user?.userId || req.user?.id || req.user?._id;
    }

    const unitMap = new Map();

    // Query direct assignments if lecturerId is a valid ObjectId
    if (lecturerId && mongoose.Types.ObjectId.isValid(lecturerId)) {
      const directUnits = await Unit.find({
        $or: [
          { lecturer: lecturerId },
          { coLecturers: lecturerId }
        ]
      }).populate("course courses");

      (directUnits || []).forEach((u) => {
        if (u && u._id) unitMap.set(u._id.toString(), u);
      });

      const lecturer = await User.findById(lecturerId).populate({
        path: 'assignedUnits',
        populate: { path: 'course courses' }
      });

      if (lecturer && lecturer.assignedUnits) {
        lecturer.assignedUnits.forEach((u) => {
          if (u && u._id && !unitMap.has(u._id.toString())) {
            unitMap.set(u._id.toString(), u);
          }
        });
      }
    }

    // Fallback if none assigned yet so lecturer dashboard has full curriculum data
    if (unitMap.size === 0) {
      const anyUnits = await Unit.find().limit(6).populate("course courses");
      (anyUnits || []).forEach((u) => {
        if (u && u._id) unitMap.set(u._id.toString(), u);
      });
    }

    // Default institutional curriculum if newly registered or mock lecturer
    if (unitMap.size === 0) {
      unitMap.set('660000000000000000000010', {
        _id: '660000000000000000000010',
        id: '660000000000000000000010',
        code: 'SE301',
        name: 'Mobile and Web Application Architecture',
        year: 3,
        semester: 1,
        course: { name: 'BSc. Software Engineering', code: 'BSC-SE' }
      });
      unitMap.set('660000000000000000000011', {
        _id: '660000000000000000000011',
        id: '660000000000000000000011',
        code: 'SE302',
        name: 'Distributed Systems & Cloud Computing',
        year: 3,
        semester: 1,
        course: { name: 'BSc. Software Engineering', code: 'BSC-SE' }
      });
    }

    res.status(200).json(Array.from(unitMap.values()));
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching lecturer units", 
      error: error.message 
    });
  }
};

const getUnitsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course ID format" });
    }

    // Match both primary course and multi-course cross-listing
    const units = await Unit.find({
      $or: [
        { course: courseId },
        { courses: courseId }
      ]
    }).populate("lecturer coLecturers course courses");

    res.status(200).json(units);
  } catch (error) {
    console.error("Error fetching units:", error.message);
    res.status(500).json({ message: "Error fetching units", error: error.message });
  }
};  
  
// Bulk delete units
const bulkDeleteUnits = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Valid array of unit IDs is required" });
    }

    const result = await Unit.deleteMany({ _id: { $in: ids } });
    // Also remove from courses
    const Course = require('../models/Course');
    await Course.updateMany({}, { $pull: { units: { $in: ids } } });

    res.status(200).json({ success: true, message: `Successfully deleted ${result.deletedCount} units`, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting units", error: error.message });
  }
};

// Bulk upload units from spreadsheet
const bulkUploadUnits = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Spreadsheet file (.xlsx or .csv) is required" });
    }
    const RosterIngestionService = require('../services/rosterIngestionService');
    const buffer = getSafeFileBuffer(req.file);
    if (!buffer) {
      return res.status(400).json({ success: false, message: "File buffer could not be read" });
    }
    const rows = await RosterIngestionService.parseBuffer(buffer, req.file.originalname || "units.xlsx");
    const result = await RosterIngestionService.ingestUnits(rows);
    res.status(200).json({ success: true, message: "Unit batch ingestion completed", ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error uploading units", error: error.message });
  }
};

// Download official Excel unit template
const downloadUnitTemplate = async (req, res) => {
  try {
    const RosterIngestionService = require('../services/rosterIngestionService');
    const buffer = await RosterIngestionService.generateUnitTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Units_Template.xlsx"');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error generating unit template", error: error.message });
  }
};

module.exports = {
  addUnit,
  getUnit,
  updateUnit,
  deleteUnit,
  getStudentUnits,
  getUnits,
  getUnitsByCourse,
  getLecturerUnits,
  bulkDeleteUnits,
  bulkUploadUnits,
  downloadUnitTemplate
};