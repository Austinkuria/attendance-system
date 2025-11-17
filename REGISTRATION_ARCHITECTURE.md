# Registration & Authentication Architecture

## Overview
This document outlines the proper registration flows for different user types in the attendance system.

---

## User Roles & Registration Flows

### 1. **STUDENTS** 
**Registration Method**: Admin-Only Creation
- ❌ **NO self-registration allowed**
- ✅ Only created by: `super_admin` or `department_admin`

**Why?**
- Students MUST have department, course, and units assigned
- Self-registration cannot properly assign academic resources
- Prevents unauthorized access to system

**Creation Flow**:
```
Admin Dashboard → Manage Students → Add Student
  ↓
Admin provides:
  - Personal info (name, email, regNo)
  - Academic info (department, course, year, semester)
  - Auto-generate temporary password
  ↓
System automatically:
  - Creates student account
  - Assigns to department & course
  - Enrolls in all units for that course/year/semester
  - Sends welcome email with temp password
  ↓
Student receives email → First login → Must change password
```

---

### 2. **LECTURERS**
**Registration Method**: Admin Creation
- ❌ **NO self-registration**
- ✅ Only created by: `super_admin` or `department_admin`

**Why?**
- Lecturers need units assigned to teach
- Department assignment required
- Security & access control

**Creation Flow**:
```
Admin Dashboard → Manage Lecturers → Add Lecturer
  ↓
Admin provides:
  - Personal info (name, email)
  - Department
  - Assigned units (optional, can be done later)
  - Auto-generate temporary password
  ↓
System creates lecturer → Sends welcome email
  ↓
Lecturer logs in → Must change password on first login
```

---

### 3. **DEPARTMENT ADMINS**
**Registration Method**: Super Admin Only
- ❌ **NO self-registration**
- ✅ Only created by: `super_admin`

**Creation Flow**:
```
Super Admin Dashboard → User Management → Add Department Admin
  ↓
Provides:
  - Personal info
  - Managed departments (can manage multiple)
  - Auto-generate password
  ↓
System creates admin → Sends credentials
```

---

### 4. **SUPER ADMIN**
**Registration Method**: Database Seeding Script Only
- ❌ **NO registration UI**
- ✅ Created via: `backend/scripts/seedSuperAdmin.js`

**Creation**:
```bash
cd backend
node scripts/seedSuperAdmin.js
```

---

## Authentication Flows

### First-Time Login (All Users)
```
User receives credentials via email
  ↓
Logs in with temporary password
  ↓
System detects mustChangePassword = true
  ↓
Forces password change before accessing dashboard
  ↓
Email verification (if enabled)
  ↓
Access granted to role-specific dashboard
```

### Regular Login
```
Enter email & password
  ↓
Verify credentials
  ↓
Check isVerified = true
  ↓
Check isActive = true
  ↓
Issue JWT tokens (access + refresh)
  ↓
Redirect to role-based dashboard
```

---

## Recommended Routes Structure

### Public Routes (No Authentication)
```
POST /api/auth/login
POST /api/auth/refresh-token
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
GET  /api/auth/verify-email/:token
POST /api/auth/resend-verification
```

### Admin Routes (Authentication + Authorization Required)
```
POST /api/admin/students              - Create student
POST /api/admin/students/bulk-import  - Import CSV
GET  /api/admin/students              - List students
PUT  /api/admin/students/:id          - Update student
DELETE /api/admin/students/:id        - Delete student

POST /api/admin/lecturers             - Create lecturer
POST /api/admin/lecturers/bulk-import - Import CSV
GET  /api/admin/lecturers             - List lecturers
PUT  /api/admin/lecturers/:id         - Update lecturer
DELETE /api/admin/lecturers/:id       - Delete lecturer
```

### Super Admin Only Routes
```
POST /api/super-admin/department-admins     - Create dept admin
GET  /api/super-admin/department-admins     - List dept admins
PUT  /api/super-admin/department-admins/:id - Update dept admin
DELETE /api/super-admin/department-admins/:id - Delete dept admin
```

---

## Database Changes Required

### User Model Enhancements
```javascript
{
  // Add account status tracking
  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'archived'],
    default: 'pending'
  },
  
  // Track creation method
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // References admin who created this user
  },
  
  creationMethod: {
    type: String,
    enum: ['admin_created', 'bulk_import', 'system_generated'],
    default: 'admin_created'
  },
  
  // Welcome email tracking
  welcomeEmailSent: {
    type: Boolean,
    default: false
  },
  
  welcomeEmailSentAt: Date,
  
  // Temporary password flag
  hasTemporaryPassword: {
    type: Boolean,
    default: true
  }
}
```

---

## Migration Plan

### Phase 1: Disable Self-Registration (IMMEDIATE)
1. Comment out or remove public signup route
2. Add redirect message: "Please contact your administrator for account creation"

### Phase 2: Enhanced Admin Creation (Week 1)
1. Update `registerUser()` to auto-enroll students in units
2. Add welcome email functionality
3. Add temporary password generation
4. Force password change on first login

### Phase 3: Bulk Import Enhancement (Week 2)
1. Update CSV import to auto-enroll students in units
2. Add validation for department/course/year/semester combinations
3. Send batch welcome emails

### Phase 4: Department Admin Tools (Week 3)
1. Create department admin creation UI (super admin only)
2. Add department-scoped user management
3. Implement proper authorization checks

---

## Security Considerations

### Account Creation
- ✅ Only authenticated admins can create accounts
- ✅ Role-based permissions enforced
- ✅ Audit log of who created which users
- ✅ Temporary passwords expire after first login

### Password Management
- ✅ Temporary passwords are strong & random
- ✅ Force change on first login
- ✅ Password reset via email only
- ✅ Account lockout after failed attempts

### Email Verification
- ⚠️ **Optional for admin-created accounts**
- ✅ Required if self-registration is ever enabled (not recommended)
- ✅ Verification links expire after 24 hours

---

## Implementation Priority

### 🔥 CRITICAL (Do First)
1. **Disable public student signup** - Security risk
2. **Auto-enroll students in units** when created - Core functionality
3. **Add temporary password generation** - User experience

### ⚠️ HIGH (Next Week)
4. Add welcome email system
5. Force password change on first login
6. Update bulk import to include unit enrollment

### 📋 MEDIUM (Later)
7. Department admin creation UI
8. Audit logging for user creation
9. Account status management (suspend/archive)

### 💡 NICE TO HAVE
10. Self-service password reset portal
11. Account activity tracking
12. Multi-factor authentication (MFA)

---

## Testing Checklist

### Student Creation
- [ ] Admin can create student with all required fields
- [ ] Student auto-enrolled in correct units
- [ ] Temporary password generated
- [ ] Welcome email sent
- [ ] First login forces password change
- [ ] Cannot access system until password changed

### Lecturer Creation
- [ ] Admin can create lecturer
- [ ] Lecturer can be assigned units
- [ ] Department assignment works
- [ ] Login and password change flow works

### Bulk Import
- [ ] CSV import creates students correctly
- [ ] All students auto-enrolled in units
- [ ] Emails sent to all imported users
- [ ] Error handling for invalid data

### Security
- [ ] Public signup route disabled
- [ ] Only admins can create users
- [ ] Proper role-based authorization
- [ ] Temporary passwords are secure

---

## FAQ

### Q: What if a student needs to self-register?
**A**: They should contact their department admin or use an official enrollment form. Admin will create their account.

### Q: Can lecturers be assigned units after creation?
**A**: Yes, via the "Manage Lecturers" interface. Units can be assigned/removed anytime.

### Q: How do students get enrolled in new units?
**A**: Admin can manually enroll them, or they're auto-enrolled when units are added to their course/year/semester.

### Q: What happens to existing self-registered students?
**A**: They need to be migrated:
1. Admin reviews their accounts
2. Manually assigns department/course/units
3. Or deletes invalid accounts

---

## Next Steps

1. Review this architecture with your team
2. Decide on implementation timeline
3. Begin with Phase 1 (disable self-registration)
4. Implement auto-unit-enrollment
5. Test thoroughly before deploying

**Author**: GitHub Copilot  
**Date**: November 16, 2025  
**Status**: Proposed Architecture
