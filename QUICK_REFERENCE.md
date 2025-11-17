# 🚀 Quick Reference Card

## Super Admin Department Management

### Create Department
```bash
POST /api/super-admin/departments
{
  "name": "School of Engineering",
  "description": "Engineering programs"
}
```

### Get All Departments
```bash
GET /api/super-admin/departments
```

### Update Department
```bash
PUT /api/super-admin/departments/:id
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Department
```bash
DELETE /api/super-admin/departments/:id
# Only works if no courses, students, or lecturers exist
```

### Assign Admin to Department
```bash
POST /api/super-admin/departments/assign-admin
{
  "departmentId": "...",
  "adminId": "..."
}
```

## Database Seeding

### Seed Everything
```bash
cd backend
node scripts/seedComprehensiveData.js
```

**Creates:**
- 7 Departments
- 10 Courses
- 44 Units
- 10 Lecturers
- 12 Students (auto-enrolled)

**Default Passwords:**
- Lecturers: `Lecturer@123`
- Students: `Student@123`
- Super Admin: `SuperAdmin@123`

## Quick Setup

```bash
# 1. Create super admin
node scripts/seedSuperAdmin.js

# 2. Populate database
node scripts/seedComprehensiveData.js

# 3. Login
Email: superadmin@university.edu
Password: SuperAdmin@123

# 4. Start managing departments!
```

## Current Departments

1. Pure and Applied Sciences (2 courses, 11 units)
2. Health Sciences (2 courses, 8 units)
3. Business Studies (2 courses, 8 units)
4. School of Medicine (1 course, 4 units)
5. School of Architecture (1 course, 4 units)
6. School of Agriculture (1 course, 4 units)
7. School of Information Technology (1 course, 5 units)

**Total: 10 courses, 44 units**

## Documentation

- `SUPER_ADMIN_GUIDE.md` - Complete API reference
- `SETUP_COMPLETE.md` - Full implementation summary
- `ADMIN_HIERARCHY_GUIDE.md` - Admin system guide
- `QUICK_START.md` - 5-minute setup

## Support

All routes require:
- Authentication: `Bearer <token>`
- Super admin role: `isSuperAdmin: true`
