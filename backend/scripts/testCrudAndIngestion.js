const assert = require('assert');
const ExcelJS = require('exceljs');
const RosterIngestionService = require('../services/rosterIngestionService');
const { generateCsvReport, generatePdfReport } = require('../utils/reportGenerator');

async function runTestSuite() {
  console.log('====================================================');
  console.log('1. Testing Roster Ingestion Templates (.xlsx)');
  console.log('====================================================');

  // Test 1.1: Student Template
  const studentBuffer = await RosterIngestionService.generateStudentTemplate();
  assert(Buffer.isBuffer(studentBuffer), 'Student template must be a Buffer');
  assert(studentBuffer.length > 500, 'Student template buffer must not be empty');
  const wbStudent = new ExcelJS.Workbook();
  await wbStudent.xlsx.load(studentBuffer);
  const studentSheet = wbStudent.getWorksheet(1);
  assert.strictEqual(studentSheet.name, 'Students');
  const studentHeaders = studentSheet.getRow(1).values.filter(Boolean);
  assert(studentHeaders.includes('First Name'), 'Must include First Name');
  assert(studentHeaders.includes('Registration Number'), 'Must include Registration Number');
  console.log('✓ Student template generation verified (headers:', studentHeaders.length, ')');

  // Test 1.2: Lecturer Template
  const lecturerBuffer = await RosterIngestionService.generateLecturerTemplate();
  assert(Buffer.isBuffer(lecturerBuffer), 'Lecturer template must be a Buffer');
  const wbLecturer = new ExcelJS.Workbook();
  await wbLecturer.xlsx.load(lecturerBuffer);
  const lecturerSheet = wbLecturer.getWorksheet(1);
  assert.strictEqual(lecturerSheet.name, 'Lecturers');
  console.log('✓ Lecturer template generation verified');

  // Test 1.3: Admin Template
  const adminBuffer = await RosterIngestionService.generateAdminTemplate();
  assert(Buffer.isBuffer(adminBuffer), 'Admin template must be a Buffer');
  const wbAdmin = new ExcelJS.Workbook();
  await wbAdmin.xlsx.load(adminBuffer);
  const adminSheet = wbAdmin.getWorksheet(1);
  assert(adminSheet.name.includes('Admin'), 'Sheet name should include Admin');
  console.log('✓ Admin template generation verified (sheet:', adminSheet.name, ')');

  // Test 1.4: Course Template
  const courseBuffer = await RosterIngestionService.generateCourseTemplate();
  assert(Buffer.isBuffer(courseBuffer), 'Course template must be a Buffer');
  const wbCourse = new ExcelJS.Workbook();
  await wbCourse.xlsx.load(courseBuffer);
  const courseSheet = wbCourse.getWorksheet(1);
  assert.strictEqual(courseSheet.name, 'Courses');
  console.log('✓ Course template generation verified');

  // Test 1.5: Unit Template
  const unitBuffer = await RosterIngestionService.generateUnitTemplate();
  assert(Buffer.isBuffer(unitBuffer), 'Unit template must be a Buffer');
  const wbUnit = new ExcelJS.Workbook();
  await wbUnit.xlsx.load(unitBuffer);
  const unitSheet = wbUnit.getWorksheet(1);
  assert.strictEqual(unitSheet.name, 'Units');
  console.log('✓ Unit template generation verified');

  console.log('====================================================');
  console.log('2. Testing Spreadsheet Buffer Parser (.xlsx & .csv)');
  console.log('====================================================');

  // Test 2.1: Parse XLSX template buffer
  const parsedFromXlsx = await RosterIngestionService.parseBuffer(studentBuffer, 'student_test.xlsx');
  assert(Array.isArray(parsedFromXlsx), 'Parsed XLSX output must be an array');
  assert(parsedFromXlsx.length >= 1, 'Should contain sample rows from template');
  assert(parsedFromXlsx[0].firstName || parsedFromXlsx[0].email, 'Must parse normalized fields correctly');
  console.log('✓ XLSX buffer parsing verified (parsed rows:', parsedFromXlsx.length, ')');

  // Test 2.2: Parse CSV buffer
  const sampleCsv = `First Name,Last Name,Email,Registration Number,Year,Semester
John,Doe,john.doe@test.ac.ke,SCT211-0001/2023,2,1
Jane,Smith,jane.smith@test.ac.ke,SCT211-0002/2023,2,1`;
  const parsedFromCsv = await RosterIngestionService.parseBuffer(Buffer.from(sampleCsv), 'students.csv');
  assert.strictEqual(parsedFromCsv.length, 2, 'CSV should parse 2 rows');
  assert.strictEqual(parsedFromCsv[0].firstName, 'John');
  assert.strictEqual(parsedFromCsv[1].lastName, 'Smith');
  console.log('✓ CSV buffer parsing verified (parsed rows:', parsedFromCsv.length, ')');

  console.log('====================================================');
  console.log('3. Testing Report Generation Utilities (CSV & PDF)');
  console.log('====================================================');

  const sampleRecords = [
    {
      studentName: 'Alice Williams',
      studentRegNo: 'SCT211-0012/2023',
      unitCode: 'CS101',
      unitName: 'Introduction to Programming',
      status: 'Present',
      check_in_method: 'QR_SCAN',
      attendedAt: new Date().toISOString()
    },
    {
      studentName: 'Bob Jones',
      studentRegNo: 'SCT211-0034/2023',
      unitCode: 'CS102',
      unitName: 'Data Structures',
      status: 'Late',
      check_in_method: 'DYNAMIC_QR',
      attendedAt: new Date().toISOString()
    }
  ];

  const deptMeta = {
    fullName: 'Department of Computer Science',
    regNumber: 'DCS',
    courseName: 'Bachelor of Science in Computer Science'
  };

  const csvReport = generateCsvReport(sampleRecords, deptMeta);
  assert(typeof csvReport === 'string', 'CSV report must be string');
  assert(csvReport.includes('Alice Williams'), 'CSV report must include student');
  assert(csvReport.includes('CS101'), 'CSV report must include unit');
  console.log('✓ CSV Report generation verified');

  const pdfReport = generatePdfReport(sampleRecords, deptMeta);
  assert(Buffer.isBuffer(pdfReport), 'PDF report must be a Buffer');
  assert(pdfReport.length > 500, 'PDF buffer must not be empty');
  assert(pdfReport.toString('utf-8', 0, 5) === '%PDF-', 'Must start with PDF header %PDF-');
  console.log('✓ PDF Report generation verified');

  console.log('====================================================');
  console.log('All Ingestion & Export Engine Verifications Passed!');
  console.log('====================================================');
}

runTestSuite().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
