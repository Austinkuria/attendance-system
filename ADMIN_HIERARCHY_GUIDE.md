# Admin Hierarchy & Department Isolation System

**Date**: November 16, 2025  
**Version**: 2.0  
**Status**: Production Ready

---

## 🎯 Overview

This document explains the **complete admin hierarchy** and **department isolation** system that ensures:
- ✅ **Super admins** can manage the entire system
- ✅ **Department admins** can ONLY manage their assigned departments
- ✅ **Students and lecturers** are isolated to their departments
- ✅ **Cross-department access is prevented** for security and privacy

---

## 👥 User Role Hierarchy

```
┌─────────────────────────────────────┐
│        SUPER ADMIN (Top Level)      │
│  - Full system access                │
│  - Creates department admins         │
│  - Manages all departments           │
│  - System configuration              │
└──────────────┬──────────────────────┘
               │
               ├──► Department Admin (Business)
               │    └─► Students in Business Dept
               │    └─► Lecturers in Business Dept
               │    └─► Courses in Business Dept
               │    └─► Units in Business Dept
               │
               ├──► Department Admin (Health)
               │    └─► Students in Health Dept
               │    └─► Lecturers in Health Dept
               │    └─► Courses in Health Dept
               │    └─► Units in Health Dept
               │
               └──► Department Admin (Engineering)
                    └─► Students in Engineering Dept
                    └─► Lecturers in Engineering Dept
                    └─► Courses in Engineering Dept
                    └─► Units in Engineering Dept
```

---

## 🔒 Access Control Matrix

| Role | Can View | Can Create | Can Edit | Can Delete |
|------|----------|------------|----------|------------|
| **Super Admin** | ALL departments | Dept admins, ALL users | ALL users | ALL users |
| **Dept Admin (Business)** | Business dept ONLY | Students/Lecturers in Business | Business users ONLY | Business users ONLY |
| **Dept Admin (Health)** | Health dept ONLY | Students/Lecturers in Health | Health users ONLY | Health users ONLY |
| **Lecturer** | Own department only | Nothing | Own profile only | Nothing |
| **Student** | Own department only | Nothing | Own profile only | Nothing |

---

## 🚀 Super Admin Operations

### 1. Creating Super Admin (First Time Only)

**Method**: Database seeding script

```bash
cd backend
node scripts/seedSuperAdmin.js
```

**Output**:
```
🎉 Super admin created successfully!

Email:     austinkuria@gmail.com
Password:  admin123
Role:      super_admin

⚠️  Please login and change your password immediately!
```

**Important**:
- ⚠️ **ONLY ONE super admin should exist initially**
- Change password immediately after first login
- Keep credentials highly secure
- Can create additional super admins if needed via direct database or script

---

### 2. Creating Department Admins

**Endpoint**: `POST /api/super-admin/department-admins`  
**Auth**: Super Admin Only

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@university.edu",
  "managedDepartments": [
    "64f3a1b2c8e9d1a2b3c4d5e6",  // Business Department ID
    "64f3a1b2c8e9d1a2b3c4d5e7"   // Marketing Department ID (optional - can manage multiple)
  ],
  "password": "TempPassword123"  // Optional - auto-generated if not provided
}
```

**Response**:
```json
{
  "success": true,
  "message": "Department admin created successfully",
  "admin": {
    "id": "673f1234567890abcdef1234",
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "role": "department_admin",
    "managedDepartments": [
      {
        "id": "64f3a1b2c8e9d1a2b3c4d5e6",
        "name": "Business",
        "code": "BUS"
      },
      {
        "id": "64f3a1b2c8e9d1a2b3c4d5e7",
        "name": "Marketing",
        "code": "MKT"
      }
    ]
  },
  "temporaryPassword": "a1b2c3d4"  // Only if password not provided
}
```

**Key Features**:
- ✅ Auto-generates secure password if not provided
- ✅ Can manage multiple departments
- ✅ Pre-verified (no email verification needed)
- ✅ Must change password on first login
- ✅ Audit trail (tracks who created the admin)

---

### 3. Managing Department Admins

**List All Department Admins**:
```
GET /api/super-admin/department-admins
```

**Get Specific Admin**:
```
GET /api/super-admin/department-admins/:id
```

**Update Admin**:
```
PUT /api/super-admin/department-admins/:id
Body: { firstName, lastName, email, managedDepartments, isActive }
```

**Deactivate Admin** (doesn't delete, preserves audit trail):
```
DELETE /api/super-admin/department-admins/:id
```

**Assign Departments**:
```
POST /api/super-admin/department-admins/:id/assign-departments
Body: { departmentIds: ["...", "..."] }
```

**Get Statistics**:
```
GET /api/super-admin/department-admins/stats
```

---

## 🏢 Department Admin Operations

### 1. What Department Admins CAN Do

Within their assigned departments ONLY:

✅ **Student Management**:
- Create students
- View students
- Edit student details (name, year, semester)
- Delete students
- Import students via CSV
- Export student lists
- Enroll students in units (automatic)

✅ **Lecturer Management**:
- Create lecturers
- View lecturers
- Edit lecturer details
- Delete lecturers
- Assign units to lecturers
- Import lecturers via CSV
- Export lecturer lists

✅ **Course Management**:
- View courses in their departments
- May create courses (if super admin allows)

✅ **Unit Management**:
- View units in their departments
- Assign units to lecturers
- View unit enrollment

✅ **Attendance Tracking**:
- View attendance records for their departments
- Generate attendance reports
- Export attendance data

---

### 2. What Department Admins CANNOT Do

❌ **Cannot access other departments**:
- Cannot see students from Business if managing Health
- Cannot view lecturers from Engineering if managing Business
- Cannot modify courses in other departments

❌ **Cannot create department admins**:
- Only super admin can create/manage department admins

❌ **Cannot access system settings**:
- No super admin privileges
- Cannot modify system-wide configurations

❌ **Cannot bypass department restrictions**:
- All queries are automatically filtered by department
- Middleware enforces department isolation

---

### 3. Department Isolation in Action

**Example Scenario**:
```
John Doe is Department Admin for:
  - Business Department (ID: 111)
  - Marketing Department (ID: 222)

He CANNOT access:
  - Health Department (ID: 333)
  - Engineering Department (ID: 444)
```

**What Happens When He Tries**:

```javascript
// John tries to view Health department students
GET /api/students?departmentId=333

// Response:
{
  "success": false,
  "message": "Access denied: You don't have permission to access this department's data"
}
```

**Automatic Filtering**:
```javascript
// When John views all students (no department specified)
GET /api/students

// Behind the scenes:
const students = await User.find({
  role: 'student',
  department: { $in: [111, 222] }  // Only his departments
});
```

---

## 🛡️ Security Middleware

### 1. Department Authorization Middleware

**File**: `backend/middleware/departmentAuthMiddleware.js`

**Functions**:

#### `requireSuperAdmin`
Ensures only super admins can access a route.

**Usage**:
```javascript
router.get('/super-admin/stats', 
  authenticate, 
  requireSuperAdmin, 
  getStats
);
```

#### `requireDepartmentAccess`
Validates user has access to specified department.

**Usage**:
```javascript
router.get('/students', 
  authenticate, 
  requireDepartmentAccess,  // Checks departmentId in query/params/body
  getStudents
);
```

#### `attachAccessibleDepartments`
Adds list of accessible departments to `req.accessibleDepartments`.

**Usage**:
```javascript
router.get('/students', 
  authenticate, 
  attachAccessibleDepartments,
  async (req, res) => {
    // req.accessibleDepartments contains department IDs user can access
    const students = await User.find({
      role: 'student',
      department: { $in: req.accessibleDepartments }
    });
  }
);
```

#### `validateDepartmentAdminAccess`
Ensures department admin is managing a department they control.

**Usage**:
```javascript
router.post('/students', 
  authenticate, 
  validateDepartmentAdminAccess,  // Checks req.body.department
  createStudent
);
```

---

### 2. Route Protection Examples

**Protected Super Admin Routes**:
```javascript
// Only super admins can access
router.use('/super-admin', authenticate, requireSuperAdmin);
router.post('/super-admin/department-admins', createDepartmentAdmin);
router.get('/super-admin/department-admins', getDepartmentAdmins);
```

**Protected Department Routes**:
```javascript
// Department admins and super admins
router.post('/students', 
  authenticate, 
  authorize(['department_admin', 'super_admin']),
  validateDepartmentAdminAccess,  // Ensures dept admin owns the department
  createStudent
);
```

**Filtered Queries**:
```javascript
// Automatically filters by accessible departments
router.get('/students',
  authenticate,
  attachAccessibleDepartments,
  async (req, res) => {
    const students = await User.find({
      role: 'student',
      department: { $in: req.accessibleDepartments }
    });
    res.json({ students });
  }
);
```

---

## 📋 Complete Workflow Examples

### Scenario 1: Super Admin Creates Department Admin

```
1. Super Admin logs in
   POST /api/auth/login
   { email: "super@admin.com", password: "..." }

2. Super Admin creates Business Department Admin
   POST /api/super-admin/department-admins
   {
     firstName: "Jane",
     lastName: "Smith",
     email: "jane.smith@university.edu",
     managedDepartments: ["business_dept_id"]
   }
   
3. System Response:
   {
     success: true,
     admin: { id, name, email, ... },
     temporaryPassword: "xyz123"
   }

4. Super Admin sends email to Jane with credentials
   (Future: Automated welcome email)

5. Jane receives email and logs in
   POST /api/auth/login
   { email: "jane.smith@university.edu", password: "xyz123" }

6. System detects mustChangePassword = true
   Response includes: { requiresPasswordChange: true }

7. Jane changes password
   POST /api/auth/change-password
   { oldPassword: "xyz123", newPassword: "NewSecure123!" }

8. Jane can now manage Business Department
```

---

### Scenario 2: Department Admin Creates Student

```
1. Department Admin (Jane) logs in
   Role: department_admin
   Managed Departments: [Business]

2. Jane creates a new student
   POST /api/students
   {
     firstName: "Tom",
     lastName: "Johnson",
     email: "tom@student.edu",
     regNo: "BUS-2024-001",
     department: "business_dept_id",  // Her department
     course: "business_admin_course_id",
     year: 2,
     semester: 1,
     password: "TempPass123"
   }

3. Middleware checks:
   ✅ Is Jane authenticated? YES
   ✅ Is Jane a department_admin or super_admin? YES (dept admin)
   ✅ Does Jane manage Business department? YES
   ✅ ALLOW

4. System auto-enrolls Tom in units:
   - Finds all units for Business Admin, Year 2, Semester 1
   - Enrolls Tom in all 5 matching units
   - Updates each unit's student roster

5. Response:
   {
     success: true,
     message: "Student created and enrolled successfully",
     user: { id, name, email, regNo },
     enrollment: { enrolledUnits: 5, units: [...] }
   }

6. Tom can now log in and access attendance system
```

---

### Scenario 3: Department Admin Tries Cross-Department Access

```
1. Department Admin (Jane) tries to view Health students
   GET /api/students?departmentId=health_dept_id

2. Middleware check:
   ❌ Does Jane manage Health department? NO
   
3. Response:
   {
     success: false,
     message: "Access denied: You don't have permission to access this department's data"
   }
   Status: 403 Forbidden

4. Jane can ONLY view Business students
   GET /api/students?departmentId=business_dept_id
   ✅ Allowed - returns Business students
```

---

## 🔧 Database Schema Changes

### User Model Enhancements

```javascript
{
  // Existing fields...
  role: {
    type: String,
    enum: ["student", "lecturer", "department_admin", "super_admin"]
  },
  
  // Department Admin specific
  managedDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  }],  // Can manage multiple departments
  
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  },  // Primary department (first managed dept for admins)
  
  // Super Admin identification
  isSuperAdmin: {
    type: Boolean,
    default: false
  },
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },  // Tracks who created this user
  
  // Security
  mustChangePassword: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}
```

### Indexes for Performance

```javascript
userSchema.index({ role: 1, department: 1 });
userSchema.index({ managedDepartments: 1 });
userSchema.index({ isSuperAdmin: 1 });
userSchema.index({ createdBy: 1 });
```

---

## 📊 API Endpoints Summary

### Super Admin Endpoints (require super admin auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/super-admin/department-admins` | Create department admin |
| GET | `/api/super-admin/department-admins` | List all department admins |
| GET | `/api/super-admin/department-admins/stats` | Get statistics |
| GET | `/api/super-admin/department-admins/:id` | Get specific admin |
| PUT | `/api/super-admin/department-admins/:id` | Update department admin |
| DELETE | `/api/super-admin/department-admins/:id` | Deactivate department admin |
| POST | `/api/super-admin/department-admins/:id/assign-departments` | Assign departments |

### Department Admin Endpoints (require dept admin or super admin auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students` | Create student (with department check) |
| GET | `/api/students` | List students (filtered by accessible depts) |
| PUT | `/api/students/:id` | Update student (with department check) |
| DELETE | `/api/students/:id` | Delete student (with department check) |
| POST | `/api/lecturers/create` | Create lecturer (with department check) |
| GET | `/api/lecturers` | List lecturers (filtered by accessible depts) |
| PUT | `/api/lecturers/update/:id` | Update lecturer (with department check) |
| DELETE | `/api/lecturers/delete/:id` | Delete lecturer (with department check) |

---

## 🧪 Testing Guide

### 1. Test Super Admin Creation

```bash
# Create super admin
cd backend
node scripts/seedSuperAdmin.js

# Verify in MongoDB
db.users.findOne({ isSuperAdmin: true })
```

### 2. Test Department Admin Creation

```bash
# Login as super admin
POST /api/auth/login
{
  "email": "super@admin.com",
  "password": "admin123"
}

# Get token from response

# Create department admin
POST /api/super-admin/department-admins
Headers: { Authorization: "Bearer <token>" }
{
  "firstName": "Test",
  "lastName": "Admin",
  "email": "test.admin@test.com",
  "managedDepartments": ["<business_dept_id>"]
}

# Verify response includes temporaryPassword
```

### 3. Test Department Isolation

```bash
# Login as department admin
POST /api/auth/login
{
  "email": "test.admin@test.com",
  "password": "<temporary_password>"
}

# Try to access own department (should succeed)
GET /api/students?departmentId=<business_dept_id>
# Expected: 200 OK with students

# Try to access other department (should fail)
GET /api/students?departmentId=<health_dept_id>
# Expected: 403 Forbidden
```

### 4. Test Student Creation with Auto-Enrollment

```bash
# As department admin, create student
POST /api/students
{
  "firstName": "Test",
  "lastName": "Student",
  "email": "test.student@test.com",
  "regNo": "TEST-001",
  "department": "<business_dept_id>",
  "course": "<business_course_id>",
  "year": 1,
  "semester": 1,
  "password": "Test123"
}

# Verify response includes enrollment.enrolledUnits > 0
# Check database: student.enrolledUnits should have unit IDs
```

---

## 🚨 Troubleshooting

### Issue: "Access denied" for department admin

**Cause**: Department admin trying to access department they don't manage

**Solution**:
1. Verify `managedDepartments` array in user document
2. Check if department ID matches one in `managedDepartments`
3. Use super admin to update managed departments if needed

### Issue: Student not auto-enrolled

**Cause**: No units found for course/year/semester combination

**Solution**:
1. Verify units exist for the course
2. Check year and semester match
3. Ensure units have `isActive: true`
4. Review console logs for "No units found" message

### Issue: Super admin cannot access routes

**Cause**: Missing `isSuperAdmin: true` or role !== 'super_admin'

**Solution**:
```javascript
// Update user in MongoDB
db.users.updateOne(
  { email: "super@admin.com" },
  { 
    $set: { 
      role: "super_admin",
      isSuperAdmin: true
    }
  }
);
```

---

## 📚 Best Practices

### 1. Super Admin Management
- ✅ Keep super admin credentials highly secure
- ✅ Use strong, unique passwords
- ✅ Limit number of super admins (1-2 recommended)
- ✅ Enable MFA for super admin accounts (future enhancement)
- ✅ Regularly audit super admin actions

### 2. Department Admin Management
- ✅ Assign admins to specific departments only
- ✅ Review department assignments quarterly
- ✅ Deactivate admins instead of deleting (preserves audit trail)
- ✅ Force password change on first login
- ✅ Monitor cross-department access attempts

### 3. Security
- ✅ Always use `authenticate` middleware before authorization
- ✅ Apply department checks on ALL student/lecturer routes
- ✅ Use `attachAccessibleDepartments` for list queries
- ✅ Log all admin actions for audit trail
- ✅ Regularly review access logs

---

## 🔮 Future Enhancements

### Phase 3 (Planned)
- [ ] Automated welcome emails for new department admins
- [ ] Email notifications when department assignments change
- [ ] Department admin activity dashboard
- [ ] Cross-department collaboration features (with approval)

### Phase 4 (Future)
- [ ] Multi-factor authentication for admins
- [ ] Role-based permissions (more granular than department)
- [ ] Temporary admin access (time-limited)
- [ ] Department admin delegation (sub-admins)

---

## 📞 Support

For issues related to admin hierarchy:
1. Check this documentation first
2. Review console logs for access denied messages
3. Verify user roles and managed departments in database
4. Test with Postman/curl before debugging frontend

**Critical Files**:
- `backend/middleware/departmentAuthMiddleware.js` - Authorization logic
- `backend/controllers/superAdminController.js` - Super admin operations
- `backend/routes/superAdminRoutes.js` - Super admin endpoints
- `backend/models/User.js` - User schema with admin fields

---

**Version History**:
- v2.0 (Nov 16, 2025) - Added department isolation and super admin system
- v1.0 (Nov 14, 2025) - Initial auto-enrollment system

**Author**: GitHub Copilot  
**Last Updated**: November 16, 2025
