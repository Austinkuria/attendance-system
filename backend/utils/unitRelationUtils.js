const User = require('../models/User');
const Unit = require('../models/Unit');
const mongoose = require('mongoose');

/**
 * Synchronize the unit-student relationship across both models
 * @param {string} studentId - MongoDB ID of the student
 * @param {string} unitId - MongoDB ID of the unit
 * @param {boolean} isEnrolling - true if enrolling, false if removing
 */
const syncStudentUnitRelationship = async (studentId, unitId, isEnrolling) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(unitId)) {
      throw new Error('Invalid student or unit ID format');
    }

    // Find both documents
    const student = await User.findById(studentId);
    const unit = await Unit.findById(unitId);

    if (!student) throw new Error('Student not found');
    if (!unit) throw new Error('Unit not found');

    // Initialize arrays if they don't exist
    if (!student.enrolledUnits) student.enrolledUnits = [];
    if (!unit.studentsEnrolled) unit.studentsEnrolled = [];

    // Convert to string for comparison
    const studentIdStr = studentId.toString();
    const unitIdStr = unitId.toString();
    
    if (isEnrolling) {
      // Add to student's enrolledUnits if not already there
      if (!student.enrolledUnits.some(id => id.toString() === unitIdStr)) {
        student.enrolledUnits.push(unitId);
      }
      
      // Add to unit's studentsEnrolled if not already there
      if (!unit.studentsEnrolled.some(id => id.toString() === studentIdStr)) {
        unit.studentsEnrolled.push(studentId);
      }
    } else {
      // Remove from student's enrolledUnits
      student.enrolledUnits = student.enrolledUnits.filter(
        id => id.toString() !== unitIdStr
      );
      
      // Remove from unit's studentsEnrolled
      unit.studentsEnrolled = unit.studentsEnrolled.filter(
        id => id.toString() !== studentIdStr
      );
    }

    // Save both documents
    await Promise.all([student.save(), unit.save()]);
    return { student, unit };
  } catch (error) {
    console.error('Error syncing student-unit relationship:', error);
    throw error;
  }
};

/**
 * Get all units a student is enrolled in (consistent method)
 * @param {string} studentId - MongoDB ID of the student
 */
const getStudentEnrolledUnits = async (studentId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new Error('Invalid student ID format');
    }

    // Find the student with populated units
    const student = await User.findById(studentId).populate({
      path: 'enrolledUnits',
      select: 'name code course year semester',
      populate: {
        path: 'course',
        select: 'name'
      }
    });

    if (!student) throw new Error('Student not found');
    
    return student.enrolledUnits || [];
  } catch (error) {
    console.error('Error getting student enrolled units:', error);
    throw error;
  }
};

module.exports = {
  syncStudentUnitRelationship,
  getStudentEnrolledUnits
};
