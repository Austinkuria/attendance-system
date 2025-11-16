/**
 * Student Enrollment Utilities
 * Handles automatic unit enrollment for students based on their academic profile
 */

const Unit = require('../models/Unit');
const User = require('../models/User');
const Course = require('../models/Course');

/**
 * Auto-enroll a student in all units for their course/year/semester
 * @param {String} studentId - MongoDB ObjectId of the student
 * @param {String} courseId - MongoDB ObjectId of the course
 * @param {Number} year - Academic year (1-6)
 * @param {Number} semester - Semester (1-3)
 * @returns {Promise<Object>} - Enrollment result with count and unit IDs
 */
const autoEnrollStudent = async (studentId, courseId, year, semester) => {
    try {
        console.log(`🎓 Auto-enrolling student ${studentId} in units for course ${courseId}, Year ${year}, Semester ${semester}`);

        // Find all units that match the student's academic profile
        const matchingUnits = await Unit.find({
            course: courseId,
            year: year,
            semester: semester
        }).select('_id name code');

        if (matchingUnits.length === 0) {
            console.log(`⚠️ No units found for course ${courseId}, Year ${year}, Semester ${semester}`);
            return {
                success: true,
                enrolledCount: 0,
                units: [],
                message: 'No units available for enrollment'
            };
        }

        const unitIds = matchingUnits.map(unit => unit._id);

        // Update student's enrolledUnits
        const student = await User.findById(studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        // Get existing enrolled units to avoid duplicates
        const existingUnits = student.enrolledUnits || [];
        const newUnits = unitIds.filter(unitId =>
            !existingUnits.some(existing => existing.toString() === unitId.toString())
        );

        // Add new units to student's enrolled units
        student.enrolledUnits = [...existingUnits, ...newUnits];
        await student.save();

        // Update each unit's studentsEnrolled array
        for (const unitId of newUnits) {
            await Unit.findByIdAndUpdate(
                unitId,
                { $addToSet: { studentsEnrolled: studentId } }, // $addToSet prevents duplicates
                { new: true }
            );
        }

        console.log(`✅ Successfully enrolled student in ${newUnits.length} units`);

        return {
            success: true,
            enrolledCount: newUnits.length,
            totalUnits: matchingUnits.length,
            units: matchingUnits.map(u => ({ id: u._id, name: u.name, code: u.code })),
            message: `Enrolled in ${newUnits.length} unit(s)`
        };

    } catch (error) {
        console.error('❌ Auto-enrollment error:', error);
        throw new Error(`Failed to auto-enroll student: ${error.message}`);
    }
};

/**
 * Remove student from all their enrolled units
 * Useful when deleting a student or changing their course
 * @param {String} studentId - MongoDB ObjectId of the student
 * @returns {Promise<Object>} - Removal result
 */
const unenrollStudentFromAllUnits = async (studentId) => {
    try {
        const student = await User.findById(studentId).select('enrolledUnits');
        if (!student) {
            throw new Error('Student not found');
        }

        const enrolledUnits = student.enrolledUnits || [];

        // Remove student from each unit's studentsEnrolled array
        for (const unitId of enrolledUnits) {
            await Unit.findByIdAndUpdate(
                unitId,
                { $pull: { studentsEnrolled: studentId } },
                { new: true }
            );
        }

        // Clear student's enrolledUnits array
        student.enrolledUnits = [];
        await student.save();

        return {
            success: true,
            removedCount: enrolledUnits.length,
            message: `Removed from ${enrolledUnits.length} unit(s)`
        };

    } catch (error) {
        console.error('❌ Unenrollment error:', error);
        throw new Error(`Failed to unenroll student: ${error.message}`);
    }
};

/**
 * Re-enroll student after changing year/semester/course
 * @param {String} studentId - MongoDB ObjectId of the student
 * @param {String} newCourseId - New course ID
 * @param {Number} newYear - New academic year
 * @param {Number} newSemester - New semester
 * @returns {Promise<Object>} - Re-enrollment result
 */
const reEnrollStudent = async (studentId, newCourseId, newYear, newSemester) => {
    try {
        // First, remove from all current units
        await unenrollStudentFromAllUnits(studentId);

        // Then enroll in new units
        const result = await autoEnrollStudent(studentId, newCourseId, newYear, newSemester);

        return {
            success: true,
            ...result,
            message: `Re-enrolled in ${result.enrolledCount} new unit(s)`
        };

    } catch (error) {
        console.error('❌ Re-enrollment error:', error);
        throw new Error(`Failed to re-enroll student: ${error.message}`);
    }
};

/**
 * Get enrollment statistics for a course/year/semester combination
 * @param {String} courseId - Course ID
 * @param {Number} year - Academic year
 * @param {Number} semester - Semester
 * @returns {Promise<Object>} - Statistics
 */
const getEnrollmentStats = async (courseId, year, semester) => {
    try {
        const units = await Unit.find({
            course: courseId,
            year: year,
            semester: semester,
            isActive: true
        }).populate('studentsEnrolled', 'firstName lastName regNo');

        const totalUnits = units.length;
        const totalStudents = await User.countDocuments({
            course: courseId,
            year: year,
            semester: semester,
            role: 'student',
            isActive: true
        });

        const unitsWithEnrollment = units.map(unit => ({
            unitId: unit._id,
            unitName: unit.name,
            unitCode: unit.code,
            enrolledCount: unit.studentsEnrolled ? unit.studentsEnrolled.length : 0,
            students: unit.studentsEnrolled || []
        }));

        return {
            totalUnits,
            totalStudents,
            units: unitsWithEnrollment,
            averageEnrollment: totalUnits > 0
                ? (unitsWithEnrollment.reduce((sum, u) => sum + u.enrolledCount, 0) / totalUnits).toFixed(2)
                : 0
        };

    } catch (error) {
        console.error('❌ Error getting enrollment stats:', error);
        throw new Error(`Failed to get enrollment statistics: ${error.message}`);
    }
};

/**
 * Bulk enroll multiple students
 * Useful for batch processing during CSV imports
 * @param {Array} students - Array of student objects with {id, courseId, year, semester}
 * @returns {Promise<Object>} - Bulk enrollment result
 */
const bulkEnrollStudents = async (students) => {
    try {
        const results = {
            success: [],
            failed: [],
            totalProcessed: 0
        };

        for (const student of students) {
            try {
                const result = await autoEnrollStudent(
                    student.id,
                    student.courseId,
                    student.year,
                    student.semester
                );

                results.success.push({
                    studentId: student.id,
                    enrolledCount: result.enrolledCount
                });
            } catch (error) {
                results.failed.push({
                    studentId: student.id,
                    error: error.message
                });
            }
            results.totalProcessed++;
        }

        return {
            success: results.failed.length === 0,
            totalProcessed: results.totalProcessed,
            successCount: results.success.length,
            failedCount: results.failed.length,
            details: results
        };

    } catch (error) {
        console.error('❌ Bulk enrollment error:', error);
        throw new Error(`Failed to bulk enroll students: ${error.message}`);
    }
};

module.exports = {
    autoEnrollStudent,
    unenrollStudentFromAllUnits,
    reEnrollStudent,
    getEnrollmentStats,
    bulkEnrollStudents
};
