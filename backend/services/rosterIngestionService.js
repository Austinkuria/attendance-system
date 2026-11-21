const ExcelJS = require('exceljs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Readable } = require('stream');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Unit = require('../models/Unit');
const logger = require('../utils/logger');

/**
 * Service handling spreadsheet (Excel / CSV) parsing, validation,
 * template generation, and batch ingestion for academic entities.
 */
class RosterIngestionService {
  /**
   * Parse either an Excel (.xlsx) or CSV buffer into structured raw rows
   * @param {Buffer} buffer - In-memory file buffer
   * @param {string} filename - Original uploaded filename
   * @returns {Promise<Array<Object>>}
   */
  static async parseBuffer(buffer, filename = 'file.csv') {
    const workbook = new ExcelJS.Workbook();
    const isCsv = filename.toLowerCase().endsWith('.csv');

    if (isCsv) {
      const stream = Readable.from(buffer.toString('utf-8'));
      await workbook.csv.read(stream);
    } else {
      await workbook.xlsx.load(buffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Spreadsheet contains no readable worksheets');
    }

    const rows = [];
    const headerMap = {};

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values;
      if (rowNumber === 1) {
        values.forEach((header, index) => {
          if (header) {
            const cleanKey = header.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            headerMap[cleanKey] = index;
          }
        });
      } else {
        const getVal = (aliases) => {
          for (const alias of aliases) {
            const idx = headerMap[alias];
            if (idx && values[idx] !== undefined && values[idx] !== null) {
              const val = values[idx];
              return typeof val === 'object' && val.text ? val.text.toString().trim() : val.toString().trim();
            }
          }
          return '';
        };

        rows.push({
          rowNumber,
          get: (aliases) => getVal(Array.isArray(aliases) ? aliases : [aliases]),
          // Standard student fields for backwards compatibility
          firstName: getVal(['firstname', 'first', 'givenname', 'name']),
          lastName: getVal(['lastname', 'last', 'surname']),
          email: getVal(['email', 'emailaddress', 'studentemail', 'lectureremail', 'adminemail']),
          regNo: getVal(['regno', 'registrationnumber', 'regnumber', 'studentid', 'admissionnumber']),
          year: parseInt(getVal(['year', 'yearofstudy', 'stage']) || '1', 10),
          semester: parseInt(getVal(['semester', 'term']) || '1', 10),
          course: getVal(['course', 'coursecode', 'programme', 'program']),
          department: getVal(['department', 'dept', 'deptcode']),
          code: getVal(['code', 'unitcode', 'coursecode']),
          title: getVal(['title', 'name', 'unitname', 'coursename'])
        });
      }
    });

    return rows;
  }

  /**
   * Batch ingest parsed student records
   */
  static async ingestStudents(rows, creatorId = null, forcedDepartmentId = null, forcedCourseId = null) {
    const emails = [];
    const regNos = [];
    const syntaxErrors = [];
    const candidates = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const row of rows) {
      const email = row.email || row.get(['email', 'studentemail']);
      const firstName = row.firstName || row.get(['firstname', 'first']);
      const lastName = row.lastName || row.get(['lastname', 'last']);
      const regNo = row.regNo || row.get(['regno', 'registrationnumber']);

      if (!email || !emailRegex.test(email)) {
        syntaxErrors.push({ row: row.rowNumber, regNo: regNo || 'N/A', error: 'Invalid or missing email address' });
        continue;
      }
      if (!firstName || !lastName) {
        syntaxErrors.push({ row: row.rowNumber, regNo: regNo || 'N/A', error: 'First name and last name are required' });
        continue;
      }
      if (!regNo) {
        syntaxErrors.push({ row: row.rowNumber, email, error: 'Registration number is required' });
        continue;
      }

      emails.push(email.toLowerCase());
      regNos.push(regNo.toUpperCase());
      candidates.push({ ...row, email, firstName, lastName, regNo });
    }

    if (candidates.length === 0) {
      return { totalRows: rows.length, successfulCount: 0, duplicateCount: 0, errorCount: syntaxErrors.length, errors: syntaxErrors, inserted: [] };
    }

    const existingUsers = await User.find({
      $or: [{ email: { $in: emails } }, { regNo: { $in: regNos } }]
    }).select('email regNo').lean();

    const existingEmails = new Set(existingUsers.map(u => (u.email || '').toLowerCase()));
    const existingRegNos = new Set(existingUsers.map(u => (u.regNo || '').toUpperCase()));

    const duplicates = [];
    const cleanRows = [];
    const batchEmails = new Set();
    const batchRegNos = new Set();

    for (const cand of candidates) {
      const lowerEmail = cand.email.toLowerCase();
      const upperRegNo = cand.regNo.toUpperCase();

      if (existingEmails.has(lowerEmail) || batchEmails.has(lowerEmail)) {
        duplicates.push({ row: cand.rowNumber, regNo: cand.regNo, email: cand.email, error: 'Email already exists' });
        continue;
      }
      if (existingRegNos.has(upperRegNo) || batchRegNos.has(upperRegNo)) {
        duplicates.push({ row: cand.rowNumber, regNo: cand.regNo, email: cand.email, error: 'Registration number already exists' });
        continue;
      }

      batchEmails.add(lowerEmail);
      batchRegNos.add(upperRegNo);
      cleanRows.push(cand);
    }

    let defaultDepartment = null;
    let defaultCourse = null;
    if (cleanRows.length > 0) {
      defaultDepartment = await Department.findOne();
      defaultCourse = await Course.findOne();
    }

    const newRecords = [];
    const auditInsertions = [];

    for (const item of cleanRows) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const randomPassword = crypto.randomBytes(12).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const deptId = forcedDepartmentId || (item.department && item.department.match(/^[0-9a-fA-F]{24}$/)
        ? item.department
        : (defaultDepartment ? defaultDepartment._id : null));

      const courseId = forcedCourseId || (item.course && item.course.match(/^[0-9a-fA-F]{24}$/)
        ? item.course
        : (defaultCourse ? defaultCourse._id : null));

      newRecords.push({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email.toLowerCase(),
        regNo: item.regNo.toUpperCase(),
        password: hashedPassword,
        role: 'student',
        year: item.year || 1,
        semester: item.semester || 1,
        department: deptId,
        course: courseId,
        isActive: true,
        isVerified: false,
        mustChangePassword: true,
        verificationToken: tokenHash,
        verificationTokenExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000),
        createdBy: creatorId
      });

      auditInsertions.push({
        regNo: item.regNo.toUpperCase(),
        email: item.email.toLowerCase(),
        name: `${item.firstName} ${item.lastName}`,
        activationToken: rawToken
      });
    }

    let insertedDocs = [];
    if (newRecords.length > 0) {
      insertedDocs = await User.insertMany(newRecords, { ordered: false });
    }

    logger.info(`Students Ingestion: Processed ${rows.length}. Inserted ${insertedDocs.length}, Duplicates ${duplicates.length}, Errors ${syntaxErrors.length}`);

    return {
      totalRows: rows.length,
      successfulCount: insertedDocs.length,
      duplicateCount: duplicates.length,
      errorCount: syntaxErrors.length,
      errors: [...syntaxErrors, ...duplicates],
      inserted: auditInsertions
    };
  }

  /**
   * Batch ingest Lecturers from spreadsheet
   */
  static async ingestLecturers(rows, creatorId = null, forcedDepartmentId = null) {
    const emails = [];
    const syntaxErrors = [];
    const candidates = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const row of rows) {
      const email = row.email || row.get(['email', 'lectureremail', 'workemail']);
      const firstName = row.firstName || row.get(['firstname', 'first', 'givenname']);
      const lastName = row.lastName || row.get(['lastname', 'last', 'surname']);
      const department = row.get(['department', 'dept', 'deptcode']);

      if (!email || !emailRegex.test(email)) {
        syntaxErrors.push({ row: row.rowNumber, error: 'Invalid or missing email address' });
        continue;
      }
      if (!firstName || !lastName) {
        syntaxErrors.push({ row: row.rowNumber, email, error: 'First name and last name are required' });
        continue;
      }

      emails.push(email.toLowerCase());
      candidates.push({ rowNumber: row.rowNumber, firstName, lastName, email, department });
    }

    if (candidates.length === 0) {
      return { totalRows: rows.length, successfulCount: 0, duplicateCount: 0, errorCount: syntaxErrors.length, errors: syntaxErrors, inserted: [] };
    }

    const existingUsers = await User.find({ email: { $in: emails } }).select('email').lean();
    const existingEmails = new Set(existingUsers.map(u => (u.email || '').toLowerCase()));

    const duplicates = [];
    const cleanRows = [];
    const batchEmails = new Set();

    for (const cand of candidates) {
      const lowerEmail = cand.email.toLowerCase();
      if (existingEmails.has(lowerEmail) || batchEmails.has(lowerEmail)) {
        duplicates.push({ row: cand.rowNumber, email: cand.email, error: 'Lecturer email already exists' });
        continue;
      }
      batchEmails.add(lowerEmail);
      cleanRows.push(cand);
    }

    let defaultDepartment = null;
    if (cleanRows.length > 0) {
      defaultDepartment = await Department.findOne();
    }

    const newRecords = [];
    const auditInsertions = [];

    for (const item of cleanRows) {
      const randomPassword = crypto.randomBytes(12).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const deptId = forcedDepartmentId || (item.department && item.department.match(/^[0-9a-fA-F]{24}$/)
        ? item.department
        : (defaultDepartment ? defaultDepartment._id : null));

      newRecords.push({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email.toLowerCase(),
        password: hashedPassword,
        role: 'lecturer',
        department: deptId,
        isActive: true,
        isVerified: true,
        mustChangePassword: true,
        createdBy: creatorId
      });

      auditInsertions.push({
        email: item.email.toLowerCase(),
        name: `${item.firstName} ${item.lastName}`,
        temporaryPassword: randomPassword
      });
    }

    let insertedDocs = [];
    if (newRecords.length > 0) {
      insertedDocs = await User.insertMany(newRecords, { ordered: false });
    }

    logger.info(`Lecturers Ingestion: Processed ${rows.length}. Inserted ${insertedDocs.length}, Duplicates ${duplicates.length}, Errors ${syntaxErrors.length}`);

    return {
      totalRows: rows.length,
      successfulCount: insertedDocs.length,
      duplicateCount: duplicates.length,
      errorCount: syntaxErrors.length,
      errors: [...syntaxErrors, ...duplicates],
      inserted: auditInsertions
    };
  }

  /**
   * Batch ingest Department Administrators from spreadsheet
   */
  static async ingestAdmins(rows, creatorId = null) {
    const emails = [];
    const syntaxErrors = [];
    const candidates = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const row of rows) {
      const email = row.email || row.get(['email', 'adminemail', 'workemail']);
      const firstName = row.firstName || row.get(['firstname', 'first', 'givenname']);
      const lastName = row.lastName || row.get(['lastname', 'last', 'surname']);
      const department = row.get(['department', 'dept', 'deptcode']);

      if (!email || !emailRegex.test(email)) {
        syntaxErrors.push({ row: row.rowNumber, error: 'Invalid or missing email address' });
        continue;
      }
      if (!firstName || !lastName) {
        syntaxErrors.push({ row: row.rowNumber, email, error: 'First name and last name are required' });
        continue;
      }

      emails.push(email.toLowerCase());
      candidates.push({ rowNumber: row.rowNumber, firstName, lastName, email, department });
    }

    if (candidates.length === 0) {
      return { totalRows: rows.length, successfulCount: 0, duplicateCount: 0, errorCount: syntaxErrors.length, errors: syntaxErrors, inserted: [] };
    }

    const existingUsers = await User.find({ email: { $in: emails } }).select('email').lean();
    const existingEmails = new Set(existingUsers.map(u => (u.email || '').toLowerCase()));

    const duplicates = [];
    const cleanRows = [];
    const batchEmails = new Set();

    for (const cand of candidates) {
      const lowerEmail = cand.email.toLowerCase();
      if (existingEmails.has(lowerEmail) || batchEmails.has(lowerEmail)) {
        duplicates.push({ row: cand.rowNumber, email: cand.email, error: 'Admin email already exists' });
        continue;
      }
      batchEmails.add(lowerEmail);
      cleanRows.push(cand);
    }

    let defaultDepartment = null;
    if (cleanRows.length > 0) {
      defaultDepartment = await Department.findOne();
    }

    const newRecords = [];
    const auditInsertions = [];

    for (const item of cleanRows) {
      const randomPassword = crypto.randomBytes(12).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const deptId = item.department && item.department.match(/^[0-9a-fA-F]{24}$/)
        ? item.department
        : (defaultDepartment ? defaultDepartment._id : null);

      newRecords.push({
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email.toLowerCase(),
        password: hashedPassword,
        role: 'department_admin',
        department: deptId,
        managedDepartments: deptId ? [deptId] : [],
        isActive: true,
        isVerified: true,
        mustChangePassword: true,
        createdBy: creatorId
      });

      auditInsertions.push({
        email: item.email.toLowerCase(),
        name: `${item.firstName} ${item.lastName}`,
        temporaryPassword: randomPassword
      });
    }

    let insertedDocs = [];
    if (newRecords.length > 0) {
      insertedDocs = await User.insertMany(newRecords, { ordered: false });
    }

    return {
      totalRows: rows.length,
      successfulCount: insertedDocs.length,
      duplicateCount: duplicates.length,
      errorCount: syntaxErrors.length,
      errors: [...syntaxErrors, ...duplicates],
      inserted: auditInsertions
    };
  }

  /**
   * Batch ingest Courses from spreadsheet
   */
  static async ingestCourses(rows, forcedDepartmentId = null) {
    const codes = [];
    const syntaxErrors = [];
    const candidates = [];

    for (const row of rows) {
      const code = row.code || row.get(['coursecode', 'code', 'id']);
      const name = row.title || row.get(['coursename', 'name', 'title']);
      const department = row.get(['department', 'dept', 'deptcode']);

      if (!code || !name) {
        syntaxErrors.push({ row: row.rowNumber, error: 'Course code and name are required' });
        continue;
      }

      codes.push(code.toUpperCase());
      candidates.push({ rowNumber: row.rowNumber, code: code.toUpperCase(), name, department });
    }

    if (candidates.length === 0) {
      return { totalRows: rows.length, successfulCount: 0, duplicateCount: 0, errorCount: syntaxErrors.length, errors: syntaxErrors, inserted: [] };
    }

    const existingCourses = await Course.find({ code: { $in: codes } }).select('code').lean();
    const existingCodes = new Set(existingCourses.map(c => (c.code || '').toUpperCase()));

    const duplicates = [];
    const cleanRows = [];
    const batchCodes = new Set();

    for (const cand of candidates) {
      if (existingCodes.has(cand.code) || batchCodes.has(cand.code)) {
        duplicates.push({ row: cand.rowNumber, code: cand.code, error: 'Course code already exists' });
        continue;
      }
      batchCodes.add(cand.code);
      cleanRows.push(cand);
    }

    let defaultDepartment = null;
    if (cleanRows.length > 0) {
      defaultDepartment = await Department.findOne();
    }

    const newRecords = cleanRows.map(c => ({
      code: c.code,
      name: c.name,
      department: forcedDepartmentId || (c.department && c.department.match(/^[0-9a-fA-F]{24}$/)
        ? c.department
        : (defaultDepartment ? defaultDepartment._id : null)),
      units: []
    }));

    let insertedDocs = [];
    if (newRecords.length > 0) {
      insertedDocs = await Course.insertMany(newRecords, { ordered: false });
    }

    return {
      totalRows: rows.length,
      successfulCount: insertedDocs.length,
      duplicateCount: duplicates.length,
      errorCount: syntaxErrors.length,
      errors: [...syntaxErrors, ...duplicates],
      inserted: insertedDocs
    };
  }

  /**
   * Batch ingest Units from spreadsheet
   */
  static async ingestUnits(rows) {
    const codes = [];
    const syntaxErrors = [];
    const candidates = [];

    for (const row of rows) {
      const code = row.code || row.get(['unitcode', 'code']);
      const name = row.title || row.get(['unitname', 'name', 'title']);
      const course = row.get(['course', 'coursecode']);
      const year = parseInt(row.get(['year', 'stage']) || '1', 10);
      const semester = parseInt(row.get(['semester', 'term']) || '1', 10);

      if (!code || !name) {
        syntaxErrors.push({ row: row.rowNumber, error: 'Unit code and unit name are required' });
        continue;
      }

      codes.push(code.toUpperCase());
      candidates.push({ rowNumber: row.rowNumber, code: code.toUpperCase(), name, course, year, semester });
    }

    if (candidates.length === 0) {
      return { totalRows: rows.length, successfulCount: 0, duplicateCount: 0, errorCount: syntaxErrors.length, errors: syntaxErrors, inserted: [] };
    }

    const existingUnits = await Unit.find({ code: { $in: codes } }).select('code').lean();
    const existingCodes = new Set(existingUnits.map(u => (u.code || '').toUpperCase()));

    const duplicates = [];
    const cleanRows = [];
    const batchCodes = new Set();

    for (const cand of candidates) {
      if (existingCodes.has(cand.code) || batchCodes.has(cand.code)) {
        duplicates.push({ row: cand.rowNumber, code: cand.code, error: 'Unit code already exists' });
        continue;
      }
      batchCodes.add(cand.code);
      cleanRows.push(cand);
    }

    let defaultCourse = null;
    if (cleanRows.length > 0) {
      defaultCourse = await Course.findOne();
    }

    const allCourses = await Course.find().select('_id code name').lean();
    const courseMap = new Map();
    allCourses.forEach(c => {
      if (c.code) courseMap.set(c.code.toUpperCase(), c._id);
      if (c.name) courseMap.set(c.name.toLowerCase(), c._id);
      courseMap.set(String(c._id), c._id);
    });

    const newRecords = cleanRows.map(u => {
      const resolvedCourseIds = [];
      if (u.course) {
        const rawTokens = String(u.course).split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
        for (const tok of rawTokens) {
          if (tok.match(/^[0-9a-fA-F]{24}$/) && courseMap.has(tok)) {
            resolvedCourseIds.push(courseMap.get(tok));
          } else if (courseMap.has(tok.toUpperCase())) {
            resolvedCourseIds.push(courseMap.get(tok.toUpperCase()));
          } else if (courseMap.has(tok.toLowerCase())) {
            resolvedCourseIds.push(courseMap.get(tok.toLowerCase()));
          }
        }
      }
      if (resolvedCourseIds.length === 0 && defaultCourse) {
        resolvedCourseIds.push(defaultCourse._id);
      }
      const primaryCourse = resolvedCourseIds[0] || null;

      return {
        code: u.code,
        name: u.name,
        course: primaryCourse,
        courses: resolvedCourseIds,
        year: isNaN(u.year) ? 1 : u.year,
        semester: isNaN(u.semester) ? 1 : u.semester,
        studentsEnrolled: []
      };
    });

    let insertedDocs = [];
    if (newRecords.length > 0) {
      insertedDocs = await Unit.insertMany(newRecords, { ordered: false });
      // Link inserted units to all associated cross-listed courses
      for (const unit of insertedDocs) {
        const targetCourses = (unit.courses && unit.courses.length > 0) ? unit.courses : (unit.course ? [unit.course] : []);
        for (const cId of targetCourses) {
          await Course.findByIdAndUpdate(cId, { $addToSet: { units: unit._id } });
        }
      }
    }

    return {
      totalRows: rows.length,
      successfulCount: insertedDocs.length,
      duplicateCount: duplicates.length,
      errorCount: syntaxErrors.length,
      errors: [...syntaxErrors, ...duplicates],
      inserted: insertedDocs
    };
  }

  /**
   * Helper to format Excel workbook headers
   */
  static _applyHeaderStyles(sheet) {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  static async generateStudentTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Students');
    sheet.columns = [
      { header: 'Registration Number', key: 'regNo', width: 24 },
      { header: 'First Name', key: 'firstName', width: 18 },
      { header: 'Last Name', key: 'lastName', width: 18 },
      { header: 'Student Email', key: 'email', width: 30 },
      { header: 'Year of Study (1-6)', key: 'year', width: 20 },
      { header: 'Semester (1-3)', key: 'semester', width: 16 }
    ];
    this._applyHeaderStyles(sheet);
    sheet.addRow({ regNo: 'SCM/001/22', firstName: 'Jane', lastName: 'Mwangi', email: 'jane.mwangi@students.ac.ke', year: 3, semester: 1 });
    sheet.addRow({ regNo: 'SCM/002/22', firstName: 'David', lastName: 'Otieno', email: 'david.otieno@students.ac.ke', year: 3, semester: 1 });
    return await workbook.xlsx.writeBuffer();
  }

  static async generateLecturerTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Lecturers');
    sheet.columns = [
      { header: 'First Name', key: 'firstName', width: 18 },
      { header: 'Last Name', key: 'lastName', width: 18 },
      { header: 'Work Email', key: 'email', width: 32 }
    ];
    this._applyHeaderStyles(sheet);
    sheet.addRow({ firstName: 'Grace', lastName: 'Kimani', email: 'grace.kimani@university.ac.ke' });
    sheet.addRow({ firstName: 'Samuel', lastName: 'Ochieng', email: 'samuel.ochieng@university.ac.ke' });
    return await workbook.xlsx.writeBuffer();
  }

  static async generateAdminTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Admins');
    sheet.columns = [
      { header: 'First Name', key: 'firstName', width: 18 },
      { header: 'Last Name', key: 'lastName', width: 18 },
      { header: 'Admin Email', key: 'email', width: 32 }
    ];
    this._applyHeaderStyles(sheet);
    sheet.addRow({ firstName: 'Francis', lastName: 'Kamau', email: 'francis.kamau@university.ac.ke' });
    return await workbook.xlsx.writeBuffer();
  }

  static async generateCourseTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Courses');
    sheet.columns = [
      { header: 'Course Code', key: 'code', width: 18 },
      { header: 'Course Name', key: 'name', width: 36 }
    ];
    this._applyHeaderStyles(sheet);
    sheet.addRow({ code: 'BSE', name: 'Bachelor of Science in Software Engineering' });
    sheet.addRow({ code: 'BCS', name: 'Bachelor of Science in Computer Science' });
    return await workbook.xlsx.writeBuffer();
  }

  static async generateUnitTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Units');
    sheet.columns = [
      { header: 'Unit Code', key: 'code', width: 18 },
      { header: 'Unit Name', key: 'name', width: 36 },
      { header: 'Year of Study (1-6)', key: 'year', width: 20 },
      { header: 'Semester (1-3)', key: 'semester', width: 16 }
    ];
    this._applyHeaderStyles(sheet);
    sheet.addRow({ code: 'SE401', name: 'Mobile Application Development', year: 4, semester: 1 });
    sheet.addRow({ code: 'CS302', name: 'Database Systems Implementation', year: 3, semester: 2 });
    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = RosterIngestionService;
