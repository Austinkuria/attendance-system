# Authentication System Guide

## 🔐 Complete Authentication System with JWT Refresh Tokens & Email Verification

This guide covers the complete authentication system including JWT access/refresh tokens, email verification, email aliasing strategy, and production-ready user seeding.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Email Aliasing Strategy](#email-aliasing-strategy)
3. [JWT Token System](#jwt-token-system)
4. [Email Verification Flow](#email-verification-flow)
5. [Login Credentials](#login-credentials)
6. [Testing the System](#testing-the-system)
7. [API Endpoints](#api-endpoints)
8. [Security Features](#security-features)

---

## 🎯 System Overview

### Core Features

✅ **JWT Dual Token System**
- Access Token: 15 minutes (short-lived, frequent rotation)
- Refresh Token: 7 days (long-lived, stored in DB)

✅ **Email Verification**
- Pre-verified for admin-created users
- Optional verification flow for future self-registration
- 24-hour verification token expiry

✅ **Real Verified Emails**
- Using Gmail SMTP: `devhubmailer@gmail.com`
- Email aliasing (+admin, +lecturer, +student)
- All test emails arrive at 5 base email addresses

✅ **Security Features**
- Account lockout: 5 failed attempts = 15-minute lock
- Password complexity requirements
- Forced password change for new users (optional)
- Token revocation support
- IP tracking for refresh tokens

---

## 📧 Email Aliasing Strategy

### What is Email Aliasing?

Gmail treats `user+anything@gmail.com` as the same as `user@gmail.com`. All emails arrive in the same inbox, but you can use different variants to create multiple accounts.

### Base Email Addresses

We use 5 real verified Gmail addresses:

1. **devhubmailer@gmail.com** - Super Admin only
2. **austinmaina.dev@gmail.com** - Base email #1
3. **anonymousismyname321@gmail.com** - Base email #2
4. **kuriaaustin12@gmail.com** - Base email #3
5. **kuriaaustine125@gmail.com** - Base email #4

### Email Distribution

| Role | Email Pattern | Example |
|------|--------------|---------|
| Super Admin | devhubmailer@gmail.com | devhubmailer@gmail.com |
| Dept Admin | user+admin@gmail.com | austinmaina.dev+admin@gmail.com |
| Lecturer | user+lecturer@gmail.com | anonymousismyname321+lecturer@gmail.com |
| Student 1 | user+student1@gmail.com | kuriaaustin12+student1@gmail.com |
| Student 2 | user+student2@gmail.com | kuriaaustine125+student2@gmail.com |

### Benefits

✅ Use only 5 real email addresses to create 17+ test accounts
✅ All emails arrive at the base inbox (easy testing)
✅ Can differentiate accounts by role using the +tag
✅ No need for temporary/fake email services
✅ Can test actual email sending/receiving

---

## 🎟️ JWT Token System

### Token Architecture

```javascript
// Access Token (15 minutes)
{
  userId: "user_id",
  email: "user@example.com",
  role: "student",
  type: "access",
  exp: 1234567890, // 15 minutes from now
  iss: "attendance-system",
  aud: "attendance-app"
}

// Refresh Token (7 days)
{
  userId: "user_id",
  type: "refresh",
  jti: "unique_jwt_id", // For revocation
  exp: 1234567890, // 7 days from now
  iss: "attendance-system",
  aud: "attendance-app"
}
```

### Token Flow

```
1. LOGIN
   ├─ Validate credentials
   ├─ Check email verification
   ├─ Generate access token (15min)
   ├─ Generate refresh token (7d)
   ├─ Store refresh token in DB
   └─ Return both tokens

2. AUTHENTICATED REQUEST
   ├─ Extract access token from header/cookie
   ├─ Verify token signature
   ├─ Check expiration
   └─ Allow/Deny request

3. TOKEN REFRESH
   ├─ Access token expires
   ├─ Send refresh token
   ├─ Validate refresh token from DB
   ├─ Generate new access token
   └─ Return new access token

4. LOGOUT
   ├─ Revoke refresh token
   ├─ Clear cookies
   └─ Token cannot be reused
```

### Implementation Files

| File | Purpose |
|------|---------|
| `backend/models/RefreshToken.js` | RefreshToken schema with expiry tracking |
| `backend/utils/authUtils.js` | Token generation, validation, refresh logic |
| `backend/controllers/authController.js` | Login, signup, refresh, logout endpoints |
| `backend/middleware/authMiddleware.js` | Token verification middleware |

---

## ✉️ Email Verification Flow

### Admin-Created Users (Current System)

```
1. Admin creates user account
   ├─ Set isVerified: true (pre-verified)
   ├─ Set mustChangePassword: false (optional)
   └─ Send welcome email with credentials

2. User logs in
   ├─ No email verification required
   └─ Immediate access
```

### Self-Registration (Future/Optional)

```
1. User signs up
   ├─ Set isVerified: false
   ├─ Generate verification token (24h expiry)
   ├─ Send verification email
   └─ Store token hash in user document

2. User clicks verification link
   ├─ Validate token
   ├─ Set isVerified: true
   ├─ Delete verification token
   └─ Send confirmation email

3. User logs in
   ├─ Check isVerified: true
   └─ Allow login
```

### Email Templates

The system sends:
- ✉️ **Welcome Email** - For admin-created users with login credentials
- ✉️ **Verification Email** - Email verification link (if enabled)
- ✉️ **Verification Success** - Confirmation after email verification
- ✉️ **Password Reset** - Password reset link
- ✉️ **Account Locked** - Notification of account lockout

All emails are sent from: **devhubmailer@gmail.com**

---

## 🔑 Login Credentials

### Production Test Accounts

#### 👑 Super Admin
```
Email:    devhubmailer@gmail.com
Password: SuperAdmin@2025
Role:     super_admin
```

#### 👨‍💼 Department Admins (4 accounts)
```
1. austinmaina.dev+admin@gmail.com
2. anonymousismyname321+admin@gmail.com
3. kuriaaustin12+admin@gmail.com
4. kuriaaustine125+admin@gmail.com

Password: Admin@2025
Role:     department_admin
```

#### 👨‍🏫 Lecturers (4 accounts)
```
1. austinmaina.dev+lecturer@gmail.com       (Dr. Kwame Okonkwo)
2. anonymousismyname321+lecturer@gmail.com  (Prof. Amara Njoroge)
3. kuriaaustin12+lecturer@gmail.com         (Dr. Tariq Hassan)
4. kuriaaustine125+lecturer@gmail.com       (Dr. Naledi Mwangi)

Password: Lecturer@2025
Role:     lecturer
```

#### 👨‍🎓 Students (8 accounts)
```
1. austinmaina.dev+student1@gmail.com       (Amina Kamau - STU20251001)
2. austinmaina.dev+student2@gmail.com       (Kwesi Ochieng - STU20251002)
3. anonymousismyname321+student1@gmail.com  (Zainab Muthoni - STU20251003)
4. anonymousismyname321+student2@gmail.com  (Thabo Kimani - STU20251004)
5. kuriaaustin12+student1@gmail.com         (Nia Wanjiru - STU20251005)
6. kuriaaustin12+student2@gmail.com         (Kofi Mutiso - STU20251006)
7. kuriaaustine125+student1@gmail.com       (Aisha Chebet - STU20251007)
8. kuriaaustine125+student2@gmail.com       (Jabari Kipchoge - STU20251008)

Password: Student@2025
Role:     student
```

---

## 🧪 Testing the System

### Step 1: Seed Production Data

```bash
cd backend
node scripts/seedProductionData.js
```

Expected output:
```
✅ Created 1 super admin
✅ Created 4 department admins
✅ Created 4 lecturers
✅ Created 8 students
✅ Students auto-enrolled in units
```

### Step 2: Test Login Flow

#### Using Postman/cURL

**Login Request:**
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "austinmaina.dev+student1@gmail.com",
  "password": "Student@2025"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "...",
    "firstName": "Amina",
    "lastName": "Kamau",
    "email": "austinmaina.dev+student1@gmail.com",
    "role": "student",
    "regNo": "STU20251001",
    "isVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 3: Test Authenticated Request

**With Access Token in Header:**
```http
GET http://localhost:5000/api/students/profile
Authorization: Bearer <accessToken>
```

**Or with Cookies (if using cookie-based auth):**
```http
GET http://localhost:5000/api/students/profile
Cookie: accessToken=<token>; refreshToken=<token>
```

### Step 4: Test Token Refresh

**When Access Token Expires:**
```http
POST http://localhost:5000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<your_refresh_token>"
}
```

**Expected Response:**
```json
{
  "success": true,
  "accessToken": "new_access_token_here",
  "message": "Token refreshed successfully"
}
```

### Step 5: Test Account Lockout

Try logging in with wrong password 5 times:

```http
POST http://localhost:5000/api/auth/login
{
  "email": "austinmaina.dev+student1@gmail.com",
  "password": "WrongPassword123"
}
```

After 5 failed attempts:
```json
{
  "success": false,
  "message": "Account is locked. Please try again in 15 minutes.",
  "lockUntil": "2025-01-15T10:30:00.000Z"
}
```

### Step 6: Test Logout

```http
POST http://localhost:5000/api/auth/logout
Authorization: Bearer <accessToken>

{
  "refreshToken": "<your_refresh_token>"
}
```

---

## 🔌 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login (all roles) | No |
| POST | `/api/auth/signup` | DISABLED (public) | No |
| POST | `/api/auth/refresh` | Refresh access token | No (refresh token) |
| POST | `/api/auth/logout` | Logout & revoke tokens | Yes |
| POST | `/api/auth/verify-email/:token` | Verify email | No |
| GET | `/api/auth/me` | Get current user | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/super-admin/department-admins` | Create dept admin | Super Admin |
| POST | `/api/department-admins/users` | Create user | Dept Admin |
| GET | `/api/students/profile` | Get student profile | Student |
| GET | `/api/lecturers/profile` | Get lecturer profile | Lecturer |

### Example: Creating a User (Department Admin)

```http
POST http://localhost:5000/api/department-admins/users
Authorization: Bearer <dept_admin_access_token>
Content-Type: application/json

{
  "firstName": "New",
  "lastName": "Student",
  "email": "austinmaina.dev+newstudent@gmail.com",
  "role": "student",
  "regNo": "STU20252001",
  "year": 1,
  "semester": 1,
  "courseId": "course_id_here",
  "departmentId": "department_id_here"
}
```

User will receive:
- ✅ Pre-verified account (isVerified: true)
- ✅ Auto-enrollment in matching units
- ✅ Welcome email with temporary password
- ✅ Forced password change on first login (optional)

---

## 🔒 Security Features

### 1. Password Security

```javascript
// Minimum Requirements
- At least 8 characters
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character

// Password Hashing
- bcrypt with salt rounds: 12
- Passwords never stored in plain text
```

### 2. Account Lockout

```javascript
// Failed Login Tracking
- Max attempts: 5
- Lock duration: 15 minutes
- Reset on successful login
- Incremental delay on failures
```

### 3. Token Security

```javascript
// Access Token
- Short-lived: 15 minutes
- Cannot be revoked (relies on expiry)
- Stateless verification

// Refresh Token
- Long-lived: 7 days
- Stored in database (can be revoked)
- Tracked with IP address
- One-time use (rotates on refresh)
```

### 4. Email Verification

```javascript
// Verification Token
- Cryptographically random (32 bytes)
- 24-hour expiry
- One-time use
- Deleted after verification
```

### 5. Department Isolation

```javascript
// Authorization Middleware
- Super admins: Full access
- Dept admins: Only their departments
- Lecturers: Only their assigned units
- Students: Only their own data
```

### 6. Rate Limiting

```javascript
// 11 Different Rate Limiters
- Login: 5 attempts per 15 min
- Signup: 3 attempts per hour
- Password reset: 3 attempts per hour
- Email verification: 3 attempts per hour
- Token refresh: 10 attempts per 15 min
- API endpoints: 100 requests per 15 min
```

---

## 🎨 Frontend Integration

### React Login Component Example

```jsx
import { useState } from 'react';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('/api/auth/login', formData);
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      const role = response.data.user.role;
      if (role === 'super_admin') {
        window.location.href = '/super-admin/dashboard';
      } else if (role === 'department_admin') {
        window.location.href = '/admin/dashboard';
      } else if (role === 'lecturer') {
        window.location.href = '/lecturer/dashboard';
      } else if (role === 'student') {
        window.location.href = '/student/dashboard';
      }
      
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before logging in.');
      } else if (err.response?.status === 423) {
        setError(err.response.data.message); // Account locked
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      
      <button type="submit">Login</button>
    </form>
  );
};
```

### Axios Interceptor for Token Refresh

```javascript
import axios from 'axios';

// Request interceptor - Add access token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Auto-refresh expired tokens
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If access token expired and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/auth/refresh', {
          refreshToken
        });
        
        // Update stored access token
        localStorage.setItem('accessToken', response.data.accessToken);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return axios(originalRequest);
        
      } catch (refreshError) {
        // Refresh token expired or invalid - logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## 📊 Database Schema

### User Document
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: Enum ['super_admin', 'department_admin', 'lecturer', 'student'],
  
  // Email Verification
  isVerified: Boolean (default: false),
  verificationToken: String,
  verificationTokenExpiry: Date,
  
  // Security
  mustChangePassword: Boolean,
  loginAttempts: Number (default: 0),
  accountLockedUntil: Date,
  
  // Role-specific fields
  isSuperAdmin: Boolean,
  managedDepartments: [ObjectId], // For dept admins
  department: ObjectId,
  course: ObjectId,
  year: Number,
  semester: Number,
  regNo: String,
  enrolledUnits: [ObjectId],
  
  // Audit
  createdBy: ObjectId,
  isActive: Boolean (default: true),
  timestamps: true
}
```

### RefreshToken Document
```javascript
{
  _id: ObjectId,
  token: String (unique, indexed),
  user: ObjectId (indexed),
  expiresAt: Date (indexed),
  createdByIp: String,
  revokedAt: Date,
  revokedByIp: String,
  replacedByToken: String,
  isActive: Boolean (default: true),
  timestamps: true
}
```

---

## 🚀 Quick Start Checklist

- [ ] **Environment Setup**
  - [ ] Set `JWT_SECRET` in `.env`
  - [ ] Set `REFRESH_TOKEN_SECRET` in `.env` (optional, defaults to JWT_SECRET)
  - [ ] Set `SMTP_USER` to `devhubmailer@gmail.com`
  - [ ] Set `SMTP_PASS` with app password
  - [ ] Set `ACCESS_TOKEN_EXPIRY=15m`
  - [ ] Set `REFRESH_TOKEN_EXPIRY=7d`

- [ ] **Database Seeding**
  - [ ] Run `node scripts/seedComprehensiveData.js` (departments, courses, units)
  - [ ] Run `node scripts/seedProductionData.js` (production users with real emails)

- [ ] **Testing**
  - [ ] Test super admin login
  - [ ] Test department admin login
  - [ ] Test lecturer login
  - [ ] Test student login
  - [ ] Test token refresh
  - [ ] Test account lockout (5 failed attempts)
  - [ ] Test logout (token revocation)
  - [ ] Verify email aliasing works (check inboxes)

- [ ] **Frontend**
  - [ ] Update login form
  - [ ] Add token refresh interceptor
  - [ ] Handle email verification UI
  - [ ] Show account lockout messages
  - [ ] Implement role-based routing

---

## 📝 Environment Variables

```env
# JWT Configuration
JWT_SECRET="your_secret_key_here"
REFRESH_TOKEN_SECRET="optional_separate_secret" # Defaults to JWT_SECRET
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=devhubmailer@gmail.com
SMTP_PASS=your_app_password_here

# Client URLs
CLIENT_URL_DEV=http://localhost:5173
CLIENT_URL_PROD=https://your-domain.com
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string
```

---

## 🐛 Troubleshooting

### Login Issues

**Problem:** "Invalid email or password"
- ✅ Check email spelling (including +tag)
- ✅ Verify password (case-sensitive)
- ✅ Check user exists in database
- ✅ Verify account is active (`isActive: true`)

**Problem:** "Please verify your email"
- ✅ Admin-created users should have `isVerified: true`
- ✅ Run seeding script again if needed
- ✅ Manually update in MongoDB if necessary

**Problem:** "Account is locked"
- ✅ Wait 15 minutes for auto-unlock
- ✅ Or manually update `accountLockedUntil: null` in database

### Token Issues

**Problem:** "Token expired" immediately
- ✅ Check server/client time synchronization
- ✅ Verify `ACCESS_TOKEN_EXPIRY` in `.env`
- ✅ Check token generation code

**Problem:** Refresh token not working
- ✅ Verify token exists in database
- ✅ Check `expiresAt` date
- ✅ Ensure token hasn't been revoked (`revokedAt: null`)
- ✅ Check `isActive: true`

### Email Issues

**Problem:** Emails not sending
- ✅ Verify `SMTP_USER` and `SMTP_PASS` in `.env`
- ✅ Use Gmail App Password (not regular password)
- ✅ Enable "Less secure app access" in Gmail settings
- ✅ Check spam folder

**Problem:** Email aliasing not working
- ✅ Gmail automatically supports +tag aliasing
- ✅ All variants arrive at base email inbox
- ✅ Check inbox for all 5 base email addresses

---

## 📚 Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Refresh Tokens](https://oauth.net/2/refresh-tokens/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Email Aliasing Guide](https://gmail.googleblog.com/2008/03/2-hidden-ways-to-get-more-from-your.html)
- [bcrypt Hashing](https://github.com/kelektiv/node.bcrypt.js)

---

## ✅ Summary

Your attendance system now has:

✅ **Complete JWT authentication** with access (15min) and refresh (7d) tokens
✅ **Email verification system** with pre-verified admin-created accounts
✅ **Real verified emails** using Gmail aliasing strategy
✅ **Production test data** with 17 realistic user accounts
✅ **Role-based access** with department isolation
✅ **Security features** including account lockout, password complexity, rate limiting
✅ **Auto-enrollment** for students in matching units
✅ **Realistic African names** (not "John Doe")

**Next Steps:**
1. Test all login flows with the provided credentials
2. Integrate frontend login/signup components
3. Test email sending (check base email inboxes)
4. Verify token refresh works correctly
5. Test account lockout after 5 failed attempts
6. Deploy to production with proper environment variables

---

**Last Updated:** January 15, 2025
**System Version:** 2.0 (Production Ready)
