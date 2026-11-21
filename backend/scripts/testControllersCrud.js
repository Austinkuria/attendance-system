const assert = require('assert');
const superAdminController = require('../controllers/superAdminController');
const portalController = require('../controllers/departmentAdminPortalController');

async function testControllers() {
  console.log('====================================================');
  console.log('1. Verifying Super Admin Controller Function Exports');
  console.log('====================================================');

  const requiredSuperAdminFuncs = [
    // Users CRUD
    'getAllUsers',
    'getUserById',
    'createUser',
    'updateUser',
    'deleteUser',
    'resetUserPassword',
    'bulkUpdateUserStatus',
    'bulkDeleteUsers',
    // Departments CRUD
    'createDepartment',
    'getAllDepartments',
    'updateDepartment',
    'deleteDepartment',
    'assignAdminToDepartment',
    // Admins CRUD
    'createDepartmentAdmin',
    'getDepartmentAdmins',
    'getDepartmentAdminById',
    'updateDepartmentAdmin',
    'deleteDepartmentAdmin',
    // Courses CRUD
    'getAllCourses',
    'createCourse',
    'updateCourse',
    'deleteCourse',
    // Ingestion & Export
    'exportData',
    'downloadTemplate',
    'importSpreadsheet',
    'getActivityLogs'
  ];

  for (const fn of requiredSuperAdminFuncs) {
    assert(typeof superAdminController[fn] === 'function', `Super Admin must export function: ${fn}`);
  }
  console.log(`✓ All ${requiredSuperAdminFuncs.length} Super Admin CRUD & Export functions exported.`);

  console.log('====================================================');
  console.log('2. Verifying Dept Admin Portal Controller Exports');
  console.log('====================================================');

  const requiredDeptAdminFuncs = [
    // Students CRUD & Units
    'getStudents',
    'createStudent',
    'updateStudent',
    'deleteStudent',
    'getStudentUnits',
    'enrolStudentInUnit',
    'removeStudentFromUnit',
    'bulkStudentsAction',
    // Courses & Units CRUD
    'getCourses',
    'createCourse',
    'updateCourse',
    'deleteCourse',
    'getDepartmentUnits',
    'getCourseUnits',
    'addCourseUnit',
    'removeCourseUnit',
    // Lecturers CRUD & Units
    'getLecturers',
    'createLecturer',
    'updateLecturer',
    'deleteLecturer',
    'assignLecturerUnit',
    'unassignLecturerUnit',
    // Templates & Ingestion & Analytics
    'downloadTemplate',
    'importSpreadsheet',
    'getDepartmentOverview',
    'getAnalytics',
    'exportReport'
  ];

  for (const fn of requiredDeptAdminFuncs) {
    assert(typeof portalController[fn] === 'function', `Department Admin must export function: ${fn}`);
  }
  console.log(`✓ All ${requiredDeptAdminFuncs.length} Department Admin CRUD & Export functions exported.`);

  console.log('====================================================');
  console.log('3. Testing Guardrails & Validation in Handlers');
  console.log('====================================================');

  // Test 3.1: Super Admin exportData with unsupported entity
  let statusCaptured = null;
  let jsonCaptured = null;
  const mockRes = {
    status: (code) => {
      statusCaptured = code;
      return {
        json: (data) => {
          jsonCaptured = data;
        }
      };
    },
    setHeader: () => {},
    send: () => {},
    end: () => {}
  };

  await superAdminController.exportData(
    { params: { entity: 'invalid_entity_xyz' }, query: {} },
    mockRes
  );
  assert.strictEqual(statusCaptured, 400);
  assert.strictEqual(jsonCaptured.success, false);
  console.log('✓ Unsupported entity in exportData returns 400 rejection.');

  // Test 3.2: Super Admin importSpreadsheet with missing file
  statusCaptured = null;
  jsonCaptured = null;
  await superAdminController.importSpreadsheet(
    { params: { entity: 'students' }, body: {}, file: null },
    mockRes
  );
  assert.strictEqual(statusCaptured, 400);
  assert.strictEqual(jsonCaptured.success, false);
  assert(jsonCaptured.message.includes('upload an Excel'), 'Must instruct user to upload Excel/CSV');
  console.log('✓ Missing file in importSpreadsheet returns 400 rejection.');

  // Test 3.3: Department Admin bulkStudentsAction with invalid payload
  statusCaptured = null;
  jsonCaptured = null;
  await portalController.bulkStudentsAction(
    { body: {}, user: { userId: '507f1f77bcf86cd799439011' } },
    mockRes
  );
  assert.strictEqual(statusCaptured, 400);
  assert.strictEqual(jsonCaptured.success, false);
  console.log('✓ Missing action in bulkStudentsAction returns 400 rejection.');

  console.log('====================================================');
  console.log('All Controller Guardrails & CRUD API Tests Passed!');
  console.log('====================================================');
}

testControllers().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
