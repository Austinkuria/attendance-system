const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorizeMiddleware');
const upload = require('../middleware/uploadMiddleware');
const portalController = require('../controllers/departmentAdminPortalController');

// All endpoints in this router are restricted to department_admin, admin, or super_admin
router.use(authenticate);
router.use(authorize(['admin', 'department_admin', 'super_admin']));

// Department Overview & Actionable Alerts
router.get('/overview', portalController.getDepartmentOverview);

// Department Students CRUD + Unit Assignment
router.get('/students', portalController.getStudents);
router.post('/students', portalController.createStudent);
router.put('/students/:id', portalController.updateStudent);
router.delete('/students/:id', portalController.deleteStudent);
router.get('/students/:id/units', portalController.getStudentUnits);
router.post('/students/:id/units', portalController.enrolStudentInUnit);
router.delete('/students/:id/units/:unitId', portalController.removeStudentFromUnit);
router.post('/students/bulk', portalController.bulkStudentsAction);

// Department Courses CRUD + Units
router.get('/units', portalController.getDepartmentUnits);
router.get('/courses', portalController.getCourses);
router.post('/courses', portalController.createCourse);
router.put('/courses/:id', portalController.updateCourse);
router.delete('/courses/:id', portalController.deleteCourse);
router.get('/courses/:id/units', portalController.getCourseUnits);
router.post('/courses/:id/units', portalController.addCourseUnit);
router.delete('/courses/:id/units/:unitId', portalController.removeCourseUnit);

// Department Lecturers CRUD + Unit Assignment
router.get('/lecturers', portalController.getLecturers);
router.post('/lecturers', portalController.createLecturer);
router.put('/lecturers/:id', portalController.updateLecturer);
router.delete('/lecturers/:id', portalController.deleteLecturer);
router.post('/lecturers/:id/units', portalController.assignLecturerUnit);
router.delete('/lecturers/:id/units/:unitId', portalController.unassignLecturerUnit);

// Excel Template Download & Row-Validated Bulk Import
router.get('/templates/:entity', portalController.downloadTemplate);
router.post('/import/:entity', upload.single('file'), portalController.importSpreadsheet);

// Analytics & Reports
router.get('/analytics/export', portalController.exportReport);
router.get('/analytics', portalController.getAnalytics);
router.get('/export', portalController.exportReport);

module.exports = router;
