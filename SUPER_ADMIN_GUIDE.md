# 🎯 Super Admin Complete Guide

## Table of Contents
1. [Initial Setup](#initial-setup)
2. [Department Management](#department-management)
3. [Department Admin Management](#department-admin-management)
4. [Database Seeding](#database-seeding)
5. [API Reference](#api-reference)

---

## 🚀 Initial Setup

### Step 1: Create Super Admin Account
```bash
cd backend
node scripts/seedSuperAdmin.js
```

**Default Credentials:**
- Email: `superadmin@university.edu`
- Password: `SuperAdmin@123`

**⚠️ IMPORTANT:** Change the password immediately after first login!

### Step 2: Seed Database with Sample Data (Optional)
```bash
node scripts/seedComprehensiveData.js
```

This will create:
- ✅ 7 Departments (Sciences, Health, Business, Medicine, Architecture, Agriculture, IT)
- ✅ 10+ Courses across departments
- ✅ 50+ Units across courses
- ✅ 10 Lecturers (one per department)
- ✅ 12 Students (distributed across departments)

**Default Credentials After Seeding:**
- Lecturers: `Lecturer@123`
- Students: `Student@123`

---

## 🏢 Department Management

### Create a New Department

**Endpoint:** `POST /api/super-admin/departments`

**Request:**
```json
{
  "name": "School of Engineering",
  "description": "Engineering and Technology programs"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Department created successfully",
  "department": {
    "_id": "67ec...",
    "name": "School of Engineering",
    "description": "Engineering and Technology programs",
    "createdAt": "2025-11-16T10:30:00.000Z"
  }
}
```

### Get All Departments

**Endpoint:** `GET /api/super-admin/departments`

**Response:**
```json
{
  "success": true,
  "count": 8,
  "departments": [
    {
      "_id": "67ec...",
      "name": "School of Engineering",
      "description": "Engineering and Technology programs",
      "courses": [...],
      "stats": {
        "courses": 3,
        "students": 45,
        "lecturers": 5,
        "admins": 1
      },
      "createdAt": "2025-11-16T10:30:00.000Z"
    }
  ]
}
```

### Update Department

**Endpoint:** `PUT /api/super-admin/departments/:id`

**Request:**
```json
{
  "name": "School of Engineering and Technology",
  "description": "Updated description"
}
```

### Delete Department

**Endpoint:** `DELETE /api/super-admin/departments/:id`

**⚠️ Note:** Can only delete departments with:
- ❌ No courses
- ❌ No students
- ❌ No lecturers

**Error Response if dependencies exist:**
```json
{
  "success": false,
  "message": "Cannot delete department with existing courses, students, or lecturers",
  "dependencies": {
    "courses": 3,
    "students": 45,
    "lecturers": 5
  }
}
```

---

## 👨‍💼 Department Admin Management

### Create Department Admin

**Endpoint:** `POST /api/super-admin/department-admins`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@university.edu",
  "password": "TempPassword@123",
  "managedDepartments": [
    "679a84ca01c80333aef9ca08",
    "679a851201c80333aef9ca0a"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Department admin created successfully",
  "admin": {
    "_id": "67ec...",
    "name": "John Smith",
    "email": "john.smith@university.edu",
    "role": "department_admin",
    "managedDepartments": [
      {
        "_id": "679a84ca01c80333aef9ca08",
        "name": "Pure and Applied Sciences"
      },
      {
        "_id": "679a851201c80333aef9ca0a",
        "name": "Health Sciences"
      }
    ],
    "mustChangePassword": true
  }
}
```

### Get All Department Admins

**Endpoint:** `GET /api/super-admin/department-admins`

### Update Department Admin

**Endpoint:** `PUT /api/super-admin/department-admins/:id`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith Jr.",
  "email": "johnsmith.jr@university.edu"
}
```

### Assign Departments to Admin

**Endpoint:** `POST /api/super-admin/department-admins/:id/assign-departments`

**Request:**
```json
{
  "departmentIds": [
    "679a84ca01c80333aef9ca08",
    "679a852501c80333aef9ca0c",
    "67ec3e59995daaa1d9b93cc6"
  ]
}
```

### Assign Admin to Department (Alternative)

**Endpoint:** `POST /api/super-admin/departments/assign-admin`

**Request:**
```json
{
  "departmentId": "679a84ca01c80333aef9ca08",
  "adminId": "67ec..."
}
```

### Deactivate Department Admin

**Endpoint:** `DELETE /api/super-admin/department-admins/:id`

**⚠️ Note:** This deactivates the admin (sets `isActive: false`) but preserves audit trail.

### Get Admin Statistics

**Endpoint:** `GET /api/super-admin/department-admins/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 5,
    "active": 4,
    "inactive": 1,
    "topAdmins": [
      {
        "name": "John Smith",
        "departmentCount": 3
      }
    ]
  }
}
```

---

## 📊 Database Seeding

### Comprehensive Seeding Script

The `seedComprehensiveData.js` script creates a complete test environment:

#### Departments Created:
1. **Pure and Applied Sciences**
   - Bachelor of Science in Computer Science (BSCS) - 7 units
   - Bachelor of Science in Mathematics (BSM) - 4 units

2. **Health Sciences**
   - Bachelor of Science in Nursing (BSN) - 5 units
   - Bachelor of Science in Public Health (BSPH) - 3 units

3. **Business Studies**
   - Bachelor of Commerce (BCOM) - 5 units
   - Bachelor of Business Administration (BBA) - 3 units

4. **School of Medicine**
   - Bachelor of Medicine and Bachelor of Surgery (MBBS) - 4 units

5. **School of Architecture**
   - Bachelor of Architecture (BARCH) - 4 units

6. **School of Agriculture**
   - Bachelor of Science in Agriculture (BSAG) - 4 units

7. **School of Information Technology**
   - Bachelor of Information Technology (BIT) - 5 units

#### Lecturers Created:
- john.doe@university.edu (Pure and Applied Sciences)
- jane.smith@university.edu (Pure and Applied Sciences)
- emily.johnson@university.edu (Health Sciences)
- michael.brown@university.edu (Health Sciences)
- sarah.davis@university.edu (Business Studies)
- david.wilson@university.edu (Business Studies)
- robert.taylor@university.edu (School of Medicine)
- lisa.anderson@university.edu (School of Architecture)
- james.martinez@university.edu (School of Agriculture)
- patricia.garcia@university.edu (School of Information Technology)

#### Students Created:
- 12 students distributed across all departments
- Each student is **automatically enrolled** in units matching their course/year/semester

### Run Seeding:
```bash
# Full seeding (WARNING: Clears existing lecturers and students)
cd backend
node scripts/seedComprehensiveData.js
```

**⚠️ WARNING:** This script:
- ✅ Clears ALL departments, courses, units
- ✅ Clears ALL lecturers and students
- ❌ Preserves super admins and department admins
- ✅ Auto-enrolls students in appropriate units

---

## 📚 API Reference

### Authentication
All super admin routes require:
1. **Authentication Header:**
   ```
   Authorization: Bearer <access_token>
   ```

2. **Super Admin Role:**
   - User must have `isSuperAdmin: true`
   - Enforced by `requireSuperAdmin` middleware

### Base URL
```
http://localhost:5000/api/super-admin
```

### Department Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/departments` | Create new department |
| GET | `/departments` | Get all departments with stats |
| PUT | `/departments/:id` | Update department |
| DELETE | `/departments/:id` | Delete department (if no dependencies) |
| POST | `/departments/assign-admin` | Assign admin to department |

### Department Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/department-admins` | Create new department admin |
| GET | `/department-admins` | Get all department admins |
| GET | `/department-admins/stats` | Get admin statistics |
| GET | `/department-admins/:id` | Get specific admin |
| PUT | `/department-admins/:id` | Update admin |
| DELETE | `/department-admins/:id` | Deactivate admin |
| POST | `/department-admins/:id/assign-departments` | Assign departments to admin |

---

## 🔄 Typical Workflow

### Scenario 1: Adding a New Department with Admin

```bash
# 1. Login as Super Admin
POST /api/auth/login
{
  "email": "superadmin@university.edu",
  "password": "SuperAdmin@123"
}

# 2. Create Department
POST /api/super-admin/departments
{
  "name": "School of Engineering",
  "description": "Engineering programs"
}
# Note the returned department _id

# 3. Create Department Admin
POST /api/super-admin/department-admins
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@university.edu",
  "password": "TempPassword@123",
  "managedDepartments": ["<department_id_from_step_2>"]
}

# 4. Notify admin of their credentials
# They will be forced to change password on first login
```

### Scenario 2: Expanding Admin's Responsibilities

```bash
# Admin currently manages Business Studies
# Now assign them to also manage IT

# 1. Get department IDs
GET /api/super-admin/departments

# 2. Assign additional department
POST /api/super-admin/department-admins/:admin_id/assign-departments
{
  "departmentIds": [
    "679a852501c80333aef9ca0c",  # Business Studies (existing)
    "67ec3e59995daaa1d9b93cc6"   # IT (new)
  ]
}
```

### Scenario 3: Viewing System Statistics

```bash
# 1. Get all departments with stats
GET /api/super-admin/departments
# Returns: courses, students, lecturers, admins per department

# 2. Get admin statistics
GET /api/super-admin/department-admins/stats
# Returns: total admins, active, inactive, top admins

# 3. Get specific department admin
GET /api/super-admin/department-admins/:id
# Returns: full admin details with managed departments
```

---

## 🔒 Security Notes

1. **Super Admin Access Only:**
   - All endpoints require `isSuperAdmin: true`
   - Department admins CANNOT access these routes

2. **Password Security:**
   - New admins must change password on first login
   - Passwords are hashed with bcrypt (10 rounds)
   - Temporary passwords should be communicated securely

3. **Department Isolation:**
   - Department admins can only manage their assigned departments
   - Super admin can manage ALL departments

4. **Audit Trail:**
   - `createdBy` field tracks who created departments/admins
   - Deactivation preserves data for audit purposes

---

## 🐛 Troubleshooting

### "Department not found"
- Verify department ID is correct (24-character hex string)
- Check if department was deleted

### "Cannot delete department with existing..."
- Department has courses, students, or lecturers
- Remove dependencies first or keep the department

### "User is not a department admin"
- Trying to assign non-admin user to department
- Create user as department_admin first

### "A department with this name already exists"
- Department names must be unique
- Check existing departments first

---

## 📞 Need Help?

Check the documentation:
- `ADMIN_HIERARCHY_GUIDE.md` - Complete admin system guide
- `REGISTRATION_ARCHITECTURE.md` - User registration flow
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `QUICK_START.md` - 5-minute setup guide
- `ARCHITECTURE.md` - System architecture diagrams

---

**Last Updated:** November 16, 2025  
**Version:** 2.0
