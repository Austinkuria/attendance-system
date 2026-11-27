/**
 * Production Data Seeding Script with Real Emails
 * Uses email aliasing (+tag) to create multiple test accounts
 * Run with: node scripts/seedProductionData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Unit = require('../models/Unit');
const { autoEnrollStudent } = require('../utils/enrollment.utils');

// Base email configuration using aliasing (+tag)
// Configurable via SEED_BASE_EMAIL to prevent exposing personal emails in repository code
const BASE_TEST_EMAIL = process.env.SEED_BASE_EMAIL || 'test.admin@qrollcall.ac.ke';
const [localPart, domain] = BASE_TEST_EMAIL.includes('@') ? BASE_TEST_EMAIL.split('@') : ['test.admin', 'qrollcall.ac.ke'];
const makeAlias = (tag) => `${localPart}+${tag}@${domain}`;

const REAL_EMAILS = {
    superAdmin: process.env.SEED_SUPERADMIN_EMAIL || `superadmin@${domain}`,
    departmentAdmins: [
        makeAlias('admin1'),
        makeAlias('admin2'),
        makeAlias('admin3'),
        makeAlias('admin4')
    ],
    lecturers: [
        makeAlias('lecturer1'),
        makeAlias('lecturer2'),
        makeAlias('lecturer3'),
        makeAlias('lecturer4')
    ],
    students: [
        makeAlias('student1'),
        makeAlias('student2'),
        makeAlias('student3'),
        makeAlias('student4'),
        makeAlias('student5'),
        makeAlias('student6'),
        makeAlias('student7'),
        makeAlias('student8')
    ]
};

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
}

async function seedProductionData() {
    try {
        console.log('\nStarting production data seeding...\n');

        await connectDB();

        // Clear existing test data
        console.log('Clearing existing test user data...');
        await User.deleteMany({
            email: {
                $in: [
                    ...REAL_EMAILS.departmentAdmins,
                    ...REAL_EMAILS.lecturers,
                    ...REAL_EMAILS.students
                ]
            }
        });
        console.log('Test user data cleared\n');

        // ===== STEP 1: CREATE/UPDATE SUPER ADMIN =====
        console.log('Creating/Updating Super Admin...');

        const superAdminPassword = await bcrypt.hash('SuperAdmin@2025', 12);
        const superAdmin = await User.findOneAndUpdate(
            { email: REAL_EMAILS.superAdmin },
            {
                firstName: 'System',
                lastName: 'Administrator',
                email: REAL_EMAILS.superAdmin,
                password: superAdminPassword,
                role: 'super_admin',
                isSuperAdmin: true,
                isActive: true,
                isVerified: true,
                mustChangePassword: false,
                loginAttempts: 0,
                accountLockedUntil: null
            },
            { upsert: true, new: true }
        );

        console.log(`Super Admin ready: ${REAL_EMAILS.superAdmin}\n`);

        // ===== STEP 2: GET EXISTING DEPARTMENTS =====
        console.log('Fetching departments...');
        const departments = await Department.find().sort({ name: 1 });
        console.log(`Found ${departments.length} departments\n`);

        if (departments.length === 0) {
            console.log('No departments found. Please run seedComprehensiveData.js first!');
            process.exit(1);
        }

        // ===== STEP 3: CREATE DEPARTMENT ADMINS =====
        console.log('Creating Department Admins with real emails...');

        const departmentAdmins = [];
        const adminPassword = await bcrypt.hash('Admin@2025', 12);

        for (let i = 0; i < Math.min(REAL_EMAILS.departmentAdmins.length, departments.length); i++) {
            const dept = departments[i];
            const email = REAL_EMAILS.departmentAdmins[i];

            const admin = await User.findOneAndUpdate(
                { email: email },
                {
                    firstName: dept.name.split(' ')[0],
                    lastName: 'Admin',
                    email: email,
                    password: adminPassword,
                    role: 'department_admin',
                    managedDepartments: [dept._id],
                    department: dept._id,
                    isActive: true,
                    isVerified: true,
                    mustChangePassword: false,
                    createdBy: superAdmin._id,
                    loginAttempts: 0,
                    accountLockedUntil: null
                },
                { upsert: true, new: true }
            );

            departmentAdmins.push(admin);
            console.log(`   - ${dept.name} Admin: ${email}`);
        }

        console.log(`\nCreated ${departmentAdmins.length} department admins\n`);

        // ===== STEP 4: CREATE LECTURERS =====
        console.log('Creating Lecturers with real emails...');

        const lecturers = [];
        const lecturerPassword = await bcrypt.hash('Lecturer@2025', 12);

        const lecturerData = [
            { firstName: 'Dr. Kwame', lastName: 'Okonkwo', deptIndex: 0 },
            { firstName: 'Prof. Amara', lastName: 'Njoroge', deptIndex: 1 },
            { firstName: 'Dr. Tariq', lastName: 'Hassan', deptIndex: 2 },
            { firstName: 'Dr. Naledi', lastName: 'Mwangi', deptIndex: 3 }
        ];

        for (let i = 0; i < Math.min(REAL_EMAILS.lecturers.length, lecturerData.length); i++) {
            const data = lecturerData[i];
            const dept = departments[data.deptIndex] || departments[0];
            const email = REAL_EMAILS.lecturers[i];

            const lecturer = await User.findOneAndUpdate(
                { email: email },
                {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: email,
                    password: lecturerPassword,
                    role: 'lecturer',
                    department: dept._id,
                    isActive: true,
                    isVerified: true,
                    mustChangePassword: false,
                    createdBy: departmentAdmins[data.deptIndex]?._id || superAdmin._id,
                    loginAttempts: 0,
                    accountLockedUntil: null
                },
                { upsert: true, new: true }
            );

            lecturers.push(lecturer);
            console.log(`   - ${data.firstName} ${data.lastName}: ${email}`);
        }

        console.log(`\nCreated ${lecturers.length} lecturers\n`);

        // ===== STEP 5: CREATE STUDENTS & AUTO-ENROLL =====
        console.log('Creating Students with real emails and auto-enrolling...');

        const students = [];
        const studentPassword = await bcrypt.hash('Student@2025', 12);

        // Get courses for each department
        const courses = await Course.find().populate('department');

        if (courses.length === 0) {
            console.log('No courses found. Students will be created without course assignment.');
        }

        const studentData = [
            { firstName: 'Amina', lastName: 'Kamau', year: 1, semester: 1 },
            { firstName: 'Kwesi', lastName: 'Ochieng', year: 1, semester: 1 },
            { firstName: 'Zainab', lastName: 'Muthoni', year: 2, semester: 1 },
            { firstName: 'Thabo', lastName: 'Kimani', year: 2, semester: 1 },
            { firstName: 'Nia', lastName: 'Wanjiru', year: 3, semester: 1 },
            { firstName: 'Kofi', lastName: 'Mutiso', year: 3, semester: 1 },
            { firstName: 'Aisha', lastName: 'Chebet', year: 1, semester: 2 },
            { firstName: 'Jabari', lastName: 'Kipchoge', year: 1, semester: 2 }
        ];

        for (let i = 0; i < Math.min(REAL_EMAILS.students.length, studentData.length); i++) {
            const data = studentData[i];
            const course = courses[i % courses.length];
            const email = REAL_EMAILS.students[i];

            if (!course) {
                console.log(`   Skipping ${data.firstName} ${data.lastName} - No courses available`);
                continue;
            }

            const student = await User.findOneAndUpdate(
                { email: email },
                {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: email,
                    password: studentPassword,
                    role: 'student',
                    regNo: `STU2025${String(1001 + i).padStart(4, '0')}`,
                    year: data.year,
                    semester: data.semester,
                    course: course._id,
                    department: course.department._id,
                    isActive: true,
                    isVerified: true,
                    mustChangePassword: false,
                    enrolledUnits: [],
                    createdBy: departmentAdmins.find(admin =>
                        admin.managedDepartments[0].toString() === course.department._id.toString()
                    )?._id || superAdmin._id,
                    loginAttempts: 0,
                    accountLockedUntil: null
                },
                { upsert: true, new: true }
            );

            // Auto-enroll in units
            try {
                const enrollmentResult = await autoEnrollStudent(
                    student._id,
                    course._id,
                    data.year,
                    data.semester
                );

                console.log(`   - ${data.firstName} ${data.lastName}: ${email}`);
                console.log(`      Reg: ${student.regNo} | Enrolled in ${enrollmentResult.enrolledCount} units`);
            } catch (error) {
                console.log(`   - ${data.firstName} ${data.lastName}: ${email}`);
                console.log(`      Reg: ${student.regNo} | No units available`);
            }

            students.push(student);
        }

        console.log(`\nCreated ${students.length} students with auto-enrollment\n`);

        // ===== FINAL SUMMARY =====
        console.log('\n' + '='.repeat(70));
        console.log('PRODUCTION DATA SEEDING COMPLETE!');
        console.log('='.repeat(70));
        console.log('\nSUMMARY:');
        console.log(`   Super Admins:      1`);
        console.log(`   Department Admins: ${departmentAdmins.length}`);
        console.log(`   Lecturers:         ${lecturers.length}`);
        console.log(`   Students:          ${students.length}`);
        console.log(`   Total Users:       ${1 + departmentAdmins.length + lecturers.length + students.length}`);

        console.log('\n' + '='.repeat(70));
        console.log('LOGIN CREDENTIALS');
        console.log('='.repeat(70));

        console.log('\nSUPER ADMIN:');
        console.log(`   Email:    ${REAL_EMAILS.superAdmin}`);
        console.log(`   Password: SuperAdmin@2025`);

        console.log('\nDEPARTMENT ADMINS:');
        departmentAdmins.forEach((admin, index) => {
            console.log(`   ${index + 1}. ${admin.email}`);
        });
        console.log(`   Password: Admin@2025`);

        console.log('\nLECTURERS:');
        lecturers.forEach((lecturer, index) => {
            console.log(`   ${index + 1}. ${lecturer.email}`);
        });
        console.log(`   Password: Lecturer@2025`);

        console.log('\nSTUDENTS:');
        students.forEach((student, index) => {
            console.log(`   ${index + 1}. ${student.email} (${student.regNo})`);
        });
        console.log(`   Password: Student@2025`);

        console.log('\n' + '='.repeat(70));
        console.log('IMPORTANT NOTES:');
        console.log('='.repeat(70));
        console.log('1. All accounts are pre-verified (isVerified: true)');
        console.log('2. Email aliasing used (user+tag@gmail.com)');
        console.log('3. All emails arrive at the base email address');
        console.log('4. Passwords can be changed after first login');
        console.log('5. Students are auto-enrolled in matching units');
        console.log('6. Account lockout: 5 failed attempts = 15 min lock');
        console.log('='.repeat(70));

        console.log('\nDatabase seeding completed successfully!\n');

        // Close MongoDB connection gracefully
        await mongoose.connection.close();
        console.log('MongoDB connection closed\n');
        process.exit(0);

    } catch (error) {
        console.error('\nError seeding data:', error);
        console.error(error.stack);

        // Close MongoDB connection on error
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed\n');
        } catch (closeError) {
            console.error('Error closing MongoDB connection:', closeError.message);
        }

        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    seedProductionData();
}

module.exports = { seedProductionData };
