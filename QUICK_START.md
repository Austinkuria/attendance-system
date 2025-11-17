# Quick Start Guide - Admin System

**Last Updated**: November 16, 2025

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Create Super Admin (30 seconds)

```bash
cd backend
node scripts/seedSuperAdmin.js
```

**Output**:
```
🎉 Super admin created successfully!

Email:     austinkuria@gmail.com
Password:  admin123

⚠️  Please login and change your password immediately!
```

---

### Step 2: Login as Super Admin (30 seconds)

**API Request**:
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "austinkuria@gmail.com",
  "password": "admin123"
}
```

**Or use frontend**: Navigate to login page, enter credentials

**Response**: You'll get an access token - save it!

---

### Step 3: Create Department Admin (1 minute)

**Get Department ID first**:
```bash
GET http://localhost:5000/api/department
```

Copy a department ID from the response.

**Create Department Admin**:
```bash
POST http://localhost:5000/api/super-admin/department-admins
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Business Admin",
  "email": "john.business@university.edu",
  "managedDepartments": ["<department_id_here>"]
}
```

**Response**: You'll get a temporary password - save it!

```json
{
  "success": true,
  "admin": { ... },
  "temporaryPassword": "a1b2c3d4"
}
```

---

### Step 4: Login as Department Admin (30 seconds)

```bash
POST http://localhost:5000/api/auth/login

{
  "email": "john.business@university.edu",
  "password": "a1b2c3d4"
}
```

**Response**: System will ask to change password (future feature)

---

### Step 5: Create a Student (2 minutes)

**Get Course ID**:
```bash
GET http://localhost:5000/api/course
```

**Create Student**:
```bash
POST http://localhost:5000/api/students
Authorization: Bearer <dept_admin_token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Student",
  "email": "jane.student@university.edu",
  "regNo": "BUS-2024-001",
  "password": "TempPass123",
  "role": "student",
  "department": "<department_id>",
  "course": "<course_id>",
  "year": 2,
  "semester": 1
}
```

**Response** (with auto-enrollment!):
```json
{
  "success": true,
  "message": "Student created and enrolled successfully",
  "user": {
    "id": "...",
    "name": "Jane Student",
    "email": "jane.student@university.edu",
    "regNo": "BUS-2024-001"
  },
  "enrollment": {
    "enrolledUnits": 5,
    "totalUnits": 5,
    "units": [
      { "id": "...", "name": "Business Analytics", "code": "BUS201" },
      { "id": "...", "name": "Marketing", "code": "BUS202" },
      ...
    ]
  }
}
```

**Done!** Student is now enrolled in 5 units automatically!

---

## ✅ Verification Checklist

Check each item after setup:

- [ ] Super admin created and can login
- [ ] Department admin created for each department
- [ ] Department admin can login
- [ ] Test student created successfully
- [ ] Student shows "enrolledUnits" > 0 in response
- [ ] Student can login with provided credentials
- [ ] Department admin CANNOT access other departments

---

## 🧪 Testing Department Isolation

### Test 1: Create student in Business Dept

```bash
POST /api/students
{
  "department": "<business_dept_id>",
  ...other fields
}
```
✅ **Should succeed** if logged in as Business dept admin

### Test 2: Try to access Health Dept

```bash
GET /api/students?departmentId=<health_dept_id>
```
❌ **Should fail** with "Access denied" if logged in as Business dept admin

### Test 3: Super admin can access both

```bash
GET /api/students?departmentId=<health_dept_id>
GET /api/students?departmentId=<business_dept_id>
```
✅ **Both should succeed** if logged in as super admin

---

## 📊 Quick API Reference

### Super Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/super-admin/department-admins` | POST | Create dept admin |
| `/api/super-admin/department-admins` | GET | List all dept admins |
| `/api/super-admin/department-admins/:id` | GET | Get specific admin |
| `/api/super-admin/department-admins/:id` | PUT | Update admin |
| `/api/super-admin/department-admins/:id` | DELETE | Deactivate admin |

### Department Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/students` | POST | Create student (auto-enrolled!) |
| `/api/students` | GET | List students (own dept only) |
| `/api/students/:id` | PUT | Update student |
| `/api/students/:id` | DELETE | Delete student |
| `/api/lecturers/create` | POST | Create lecturer |
| `/api/lecturers` | GET | List lecturers (own dept only) |

---

## 🐛 Common Issues

### "Access denied" when creating department admin
**Cause**: Not logged in as super admin  
**Fix**: Ensure you're using super admin token in Authorization header

### Student not enrolled in units
**Cause**: No units exist for that course/year/semester  
**Fix**: Create units first, or check console logs for "No units found"

### Department admin can't create student
**Cause**: Trying to create student in department they don't manage  
**Fix**: Check `managedDepartments` array in admin's user document

---

## 📞 Need Help?

1. **Check logs**: `pm2 logs` or console output
2. **Review docs**: 
   - `ADMIN_HIERARCHY_GUIDE.md` - Complete guide
   - `IMPLEMENTATION_SUMMARY.md` - Technical details
   - `REGISTRATION_ARCHITECTURE.md` - Registration flows

3. **Common Console Messages**:
   - `🎓 Auto-enrolling student...` - Enrollment in progress
   - `✅ Successfully enrolled in X units` - Success!
   - `⚠️ No units found` - Create units for course/year/semester
   - `🚫 Department access denied` - Check department permissions

---

## 🎯 Next Steps

After basic setup:

1. **Create department admins** for all your departments
2. **Create units** for each course/year/semester combination
3. **Import students** via CSV (will auto-enroll in units)
4. **Assign units** to lecturers
5. **Start taking attendance**!

---

## 🔗 Useful Commands

```bash
# Backend
cd backend
npm install
npm start  # or: npm run dev

# Check super admin exists
node scripts/seedSuperAdmin.js

# Update existing user to super admin
node scripts/updateToSuperAdmin.js

# View logs
pm2 logs
# or
tail -f logs/app.log
```

---

**That's it!** You're ready to use the system. 🎉

For detailed documentation, see `ADMIN_HIERARCHY_GUIDE.md`
