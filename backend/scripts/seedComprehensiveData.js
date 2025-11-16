/**
 * Comprehensive Database Seeding Script
 * Seeds departments, courses, units, lecturers, and students
 * Run with: node scripts/seedComprehensiveData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Unit = require('../models/Unit');

// ============================================
// SEED DATA CONFIGURATION
// ============================================

const DEPARTMENTS_DATA = [
    {
        name: "Pure and Applied Sciences",
        courses: [
            {
                name: "Bachelor of Science in Computer Science",
                code: "BSCS",
                duration: 4,
                units: [
                    { code: "CS101", name: "Introduction to Programming", year: 1, semester: 1, credits: 3 },
                    { code: "CS102", name: "Data Structures", year: 1, semester: 2, credits: 4 },
                    { code: "CS201", name: "Database Systems", year: 2, semester: 1, credits: 4 },
                    { code: "CS202", name: "Web Development", year: 2, semester: 2, credits: 3 },
                    { code: "CS301", name: "Software Engineering", year: 3, semester: 1, credits: 4 },
                    { code: "CS302", name: "Artificial Intelligence", year: 3, semester: 2, credits: 4 },
                    { code: "CS401", name: "Final Year Project", year: 4, semester: 1, credits: 6 }
                ]
            },
            {
                name: "Bachelor of Science in Mathematics",
                code: "BSM",
                duration: 4,
                units: [
                    { code: "MATH101", name: "Calculus I", year: 1, semester: 1, credits: 4 },
                    { code: "MATH102", name: "Linear Algebra", year: 1, semester: 2, credits: 4 },
                    { code: "MATH201", name: "Differential Equations", year: 2, semester: 1, credits: 4 },
                    { code: "MATH202", name: "Abstract Algebra", year: 2, semester: 2, credits: 4 }
                ]
            }
        ]
    },
    {
        name: "Health Sciences",
        courses: [
            {
                name: "Bachelor of Science in Nursing",
                code: "BSN",
                duration: 4,
                units: [
                    { code: "NURS101", name: "Anatomy and Physiology", year: 1, semester: 1, credits: 5 },
                    { code: "NURS102", name: "Fundamentals of Nursing", year: 1, semester: 2, credits: 4 },
                    { code: "NURS201", name: "Pharmacology", year: 2, semester: 1, credits: 4 },
                    { code: "NURS202", name: "Medical-Surgical Nursing", year: 2, semester: 2, credits: 5 },
                    { code: "NURS301", name: "Community Health Nursing", year: 3, semester: 1, credits: 4 }
                ]
            },
            {
                name: "Bachelor of Science in Public Health",
                code: "BSPH",
                duration: 4,
                units: [
                    { code: "PH101", name: "Introduction to Public Health", year: 1, semester: 1, credits: 3 },
                    { code: "PH102", name: "Epidemiology", year: 1, semester: 2, credits: 4 },
                    { code: "PH201", name: "Biostatistics", year: 2, semester: 1, credits: 4 }
                ]
            }
        ]
    },
    {
        name: "Business Studies",
        courses: [
            {
                name: "Bachelor of Commerce",
                code: "BCOM",
                duration: 4,
                units: [
                    { code: "BUS101", name: "Principles of Management", year: 1, semester: 1, credits: 3 },
                    { code: "BUS102", name: "Financial Accounting", year: 1, semester: 2, credits: 4 },
                    { code: "BUS201", name: "Marketing Management", year: 2, semester: 1, credits: 3 },
                    { code: "BUS202", name: "Business Law", year: 2, semester: 2, credits: 3 },
                    { code: "BUS301", name: "Strategic Management", year: 3, semester: 1, credits: 4 }
                ]
            },
            {
                name: "Bachelor of Business Administration",
                code: "BBA",
                duration: 4,
                units: [
                    { code: "BBA101", name: "Introduction to Business", year: 1, semester: 1, credits: 3 },
                    { code: "BBA102", name: "Organizational Behavior", year: 1, semester: 2, credits: 3 },
                    { code: "BBA201", name: "Operations Management", year: 2, semester: 1, credits: 4 }
                ]
            }
        ]
    },
    {
        name: "School of Medicine",
        courses: [
            {
                name: "Bachelor of Medicine and Bachelor of Surgery",
                code: "MBBS",
                duration: 6,
                units: [
                    { code: "MED101", name: "Human Anatomy", year: 1, semester: 1, credits: 6 },
                    { code: "MED102", name: "Biochemistry", year: 1, semester: 2, credits: 5 },
                    { code: "MED201", name: "Pathology", year: 2, semester: 1, credits: 5 },
                    { code: "MED202", name: "Microbiology", year: 2, semester: 2, credits: 4 }
                ]
            }
        ]
    },
    {
        name: "School of Architecture",
        courses: [
            {
                name: "Bachelor of Architecture",
                code: "BARCH",
                duration: 5,
                units: [
                    { code: "ARCH101", name: "Architectural Design I", year: 1, semester: 1, credits: 5 },
                    { code: "ARCH102", name: "Building Construction", year: 1, semester: 2, credits: 4 },
                    { code: "ARCH201", name: "Architectural Design II", year: 2, semester: 1, credits: 5 },
                    { code: "ARCH202", name: "Structural Systems", year: 2, semester: 2, credits: 4 }
                ]
            }
        ]
    },
    {
        name: "School of Agriculture",
        courses: [
            {
                name: "Bachelor of Science in Agriculture",
                code: "BSAG",
                duration: 4,
                units: [
                    { code: "AGRI101", name: "Introduction to Agriculture", year: 1, semester: 1, credits: 3 },
                    { code: "AGRI102", name: "Crop Science", year: 1, semester: 2, credits: 4 },
                    { code: "AGRI201", name: "Animal Husbandry", year: 2, semester: 1, credits: 4 },
                    { code: "AGRI202", name: "Soil Science", year: 2, semester: 2, credits: 3 }
                ]
            }
        ]
    },
    {
        name: "School of Information Technology",
        courses: [
            {
                name: "Bachelor of Information Technology",
                code: "BIT",
                duration: 4,
                units: [
                    { code: "IT101", name: "Introduction to IT", year: 1, semester: 1, credits: 3 },
                    { code: "IT102", name: "Network Fundamentals", year: 1, semester: 2, credits: 4 },
                    { code: "IT201", name: "Cybersecurity Basics", year: 2, semester: 1, credits: 4 },
                    { code: "IT202", name: "Cloud Computing", year: 2, semester: 2, credits: 3 },
                    { code: "IT301", name: "IT Project Management", year: 3, semester: 1, credits: 4 }
                ]
            }
        ]
    }
];

// Sample lecturers per department
const LECTURERS_DATA = [
    { firstName: "John", lastName: "Doe", email: "john.doe@university.edu", department: "Pure and Applied Sciences" },
    { firstName: "Jane", lastName: "Smith", email: "jane.smith@university.edu", department: "Pure and Applied Sciences" },
    { firstName: "Emily", lastName: "Johnson", email: "emily.johnson@university.edu", department: "Health Sciences" },
    { firstName: "Michael", lastName: "Brown", email: "michael.brown@university.edu", department: "Health Sciences" },
    { firstName: "Sarah", lastName: "Davis", email: "sarah.davis@university.edu", department: "Business Studies" },
    { firstName: "David", lastName: "Wilson", email: "david.wilson@university.edu", department: "Business Studies" },
    { firstName: "Robert", lastName: "Taylor", email: "robert.taylor@university.edu", department: "School of Medicine" },
    { firstName: "Lisa", lastName: "Anderson", email: "lisa.anderson@university.edu", department: "School of Architecture" },
    { firstName: "James", lastName: "Martinez", email: "james.martinez@university.edu", department: "School of Agriculture" },
    { firstName: "Patricia", lastName: "Garcia", email: "patricia.garcia@university.edu", department: "School of Information Technology" }
];

// Sample students per department
const STUDENTS_DATA = [
    // Pure and Applied Sciences - Computer Science
    { firstName: "Alice", lastName: "Williams", email: "alice.williams@student.edu", department: "Pure and Applied Sciences", course: "BSCS", year: 1, semester: 1 },
    { firstName: "Bob", lastName: "Jones", email: "bob.jones@student.edu", department: "Pure and Applied Sciences", course: "BSCS", year: 1, semester: 2 },
    { firstName: "Charlie", lastName: "Miller", email: "charlie.miller@student.edu", department: "Pure and Applied Sciences", course: "BSCS", year: 2, semester: 1 },

    // Health Sciences - Nursing
    { firstName: "Diana", lastName: "Moore", email: "diana.moore@student.edu", department: "Health Sciences", course: "BSN", year: 1, semester: 1 },
    { firstName: "Eve", lastName: "Taylor", email: "eve.taylor@student.edu", department: "Health Sciences", course: "BSN", year: 2, semester: 1 },

    // Business Studies - Commerce
    { firstName: "Frank", lastName: "Thomas", email: "frank.thomas@student.edu", department: "Business Studies", course: "BCOM", year: 1, semester: 1 },
    { firstName: "Grace", lastName: "Jackson", email: "grace.jackson@student.edu", department: "Business Studies", course: "BCOM", year: 2, semester: 1 },

    // School of Medicine
    { firstName: "Henry", lastName: "White", email: "henry.white@student.edu", department: "School of Medicine", course: "MBBS", year: 1, semester: 1 },

    // School of Architecture
    { firstName: "Ivy", lastName: "Harris", email: "ivy.harris@student.edu", department: "School of Architecture", course: "BARCH", year: 1, semester: 1 },

    // School of Agriculture
    { firstName: "Jack", lastName: "Martin", email: "jack.martin@student.edu", department: "School of Agriculture", course: "BSAG", year: 1, semester: 1 },

    // School of Information Technology
    { firstName: "Kelly", lastName: "Thompson", email: "kelly.thompson@student.edu", department: "School of Information Technology", course: "BIT", year: 1, semester: 1 },
    { firstName: "Leo", lastName: "Garcia", email: "leo.garcia@student.edu", department: "School of Information Technology", course: "BIT", year: 2, semester: 1 }
];

// ============================================
// SEEDING FUNCTIONS
// ============================================

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
}

async function clearDatabase() {
    console.log('\n🗑️  Clearing existing data...');
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Unit.deleteMany({});
    await User.deleteMany({ role: { $in: ['lecturer', 'student'] } });
    console.log('✅ Database cleared');
}

async function seedDepartments() {
    console.log('\n🏢 Seeding departments, courses, and units...');
    const departmentMap = {};

    for (const deptData of DEPARTMENTS_DATA) {
        // Create department
        const department = new Department({
            name: deptData.name,
            courses: []
        });
        await department.save();
        departmentMap[deptData.name] = department._id;
        console.log(`  ✓ Created department: ${deptData.name}`);

        // Create courses for this department
        for (const courseData of deptData.courses) {
            const course = new Course({
                name: courseData.name,
                code: courseData.code,
                department: department._id,
                duration: courseData.duration,
                units: []
            });
            await course.save();
            console.log(`    ✓ Created course: ${courseData.name} (${courseData.code})`);

            // Add course to department
            department.courses.push(course._id);

            // Create units for this course
            for (const unitData of courseData.units) {
                const unit = new Unit({
                    name: unitData.name,
                    code: unitData.code,
                    course: course._id,
                    year: unitData.year,
                    semester: unitData.semester,
                    studentsEnrolled: []
                });
                await unit.save();
                console.log(`      ✓ Created unit: ${unitData.code} - ${unitData.name}`);

                // Add unit to course
                course.units.push(unit._id);
            }

            await course.save();
        }

        await department.save();
    }

    console.log('✅ Departments, courses, and units seeded successfully');
    return departmentMap;
}

async function seedLecturers(departmentMap) {
    console.log('\n👨‍🏫 Seeding lecturers...');
    const hashedPassword = await bcrypt.hash('Lecturer@123', 10);

    for (const lecturerData of LECTURERS_DATA) {
        const departmentId = departmentMap[lecturerData.department];

        if (!departmentId) {
            console.log(`  ⚠️  Department not found: ${lecturerData.department}`);
            continue;
        }

        const lecturer = new User({
            firstName: lecturerData.firstName,
            lastName: lecturerData.lastName,
            email: lecturerData.email.toLowerCase(),
            password: hashedPassword,
            role: 'lecturer',
            department: departmentId,
            isVerified: true,
            mustChangePassword: true
        });

        await lecturer.save();
        console.log(`  ✓ Created lecturer: ${lecturerData.firstName} ${lecturerData.lastName}`);
    }

    console.log('✅ Lecturers seeded successfully');
}

async function seedStudents(departmentMap) {
    console.log('\n👨‍🎓 Seeding students with auto-enrollment...');
    const hashedPassword = await bcrypt.hash('Student@123', 10);
    const { autoEnrollStudent } = require('../utils/enrollment.utils');

    let studentCounter = 1001; // Start registration numbers from 1001

    for (const studentData of STUDENTS_DATA) {
        const departmentId = departmentMap[studentData.department];

        if (!departmentId) {
            console.log(`  ⚠️  Department not found: ${studentData.department}`);
            continue;
        }

        // Find course by code
        const course = await Course.findOne({
            code: studentData.course,
            department: departmentId
        });

        if (!course) {
            console.log(`  ⚠️  Course not found: ${studentData.course} in ${studentData.department}`);
            continue;
        }

        // Generate registration number
        const regNo = `STU${studentCounter++}`;

        // Create student
        const student = new User({
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            email: studentData.email.toLowerCase(),
            password: hashedPassword,
            role: 'student',
            regNo: regNo,
            department: departmentId,
            course: course._id,
            year: studentData.year,
            semester: studentData.semester,
            isVerified: true,
            mustChangePassword: true,
            enrolledUnits: []
        });

        await student.save();

        // Auto-enroll student in units
        try {
            const enrollmentResult = await autoEnrollStudent(
                student._id,
                course._id,
                studentData.year,
                studentData.semester
            );

            console.log(`  ✓ Created student: ${studentData.firstName} ${studentData.lastName} (${regNo}) - Enrolled in ${enrollmentResult.enrolledCount} units`);
        } catch (error) {
            console.log(`  ⚠️  Student created but enrollment failed: ${studentData.firstName} ${studentData.lastName}`);
            console.log(`     Error: ${error.message}`);
        }
    }

    console.log('✅ Students seeded successfully');
}

async function displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));

    const departments = await Department.countDocuments();
    const courses = await Course.countDocuments();
    const units = await Unit.countDocuments();
    const lecturers = await User.countDocuments({ role: 'lecturer' });
    const students = await User.countDocuments({ role: 'student' });

    console.log(`\n📚 Departments: ${departments}`);
    console.log(`📖 Courses: ${courses}`);
    console.log(`📝 Units: ${units}`);
    console.log(`👨‍🏫 Lecturers: ${lecturers}`);
    console.log(`👨‍🎓 Students: ${students}`);

    console.log('\n🔐 Default Credentials:');
    console.log('   Lecturers: Lecturer@123');
    console.log('   Students: Student@123');
    console.log('   Note: Users must change password on first login');

    console.log('\n📋 Department Breakdown:');
    const depts = await Department.find().populate('courses');
    for (const dept of depts) {
        const deptLecturers = await User.countDocuments({ departmentId: dept._id, role: 'lecturer' });
        const deptStudents = await User.countDocuments({ departmentId: dept._id, role: 'student' });
        console.log(`\n   ${dept.name}:`);
        console.log(`   - Courses: ${dept.courses.length}`);
        console.log(`   - Lecturers: ${deptLecturers}`);
        console.log(`   - Students: ${deptStudents}`);
    }

    console.log('\n' + '='.repeat(60));
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
    try {
        console.log('\n🚀 Starting comprehensive database seeding...\n');

        await connectDB();
        await clearDatabase();

        const departmentMap = await seedDepartments();
        await seedLecturers(departmentMap);
        await seedStudents(departmentMap);

        await displaySummary();

        console.log('\n✅ Database seeding completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { main };
