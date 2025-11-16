const transporter = require('../config/emailConfig');
const crypto = require('crypto');
require('dotenv').config();

const CLIENT_URL = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL_PROD
  : process.env.CLIENT_URL_DEV;

/**
 * Generate verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Send email verification link
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @param {string} firstName - User's first name
 */
const sendVerificationEmail = async (email, token, firstName = 'User') => {
  const verificationLink = `${CLIENT_URL}/auth/verify-email/${token}`;

  const mailOptions = {
    from: {
      name: 'QRollCall Attendance System',
      address: process.env.SMTP_USER
    },
    to: email,
    subject: 'Verify Your Email - QRollCall',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1890ff;
            margin-bottom: 10px;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #1890ff;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #096dd9;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 30px;
          }
          .warning {
            background-color: #fff7e6;
            border-left: 4px solid #faad14;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .link-box {
            background-color: #f0f0f0;
            padding: 15px;
            border-radius: 4px;
            word-break: break-all;
            margin: 15px 0;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📋 QRollCall</div>
            <h2 style="margin: 0; color: #333;">Email Verification</h2>
          </div>
          
          <div class="content">
            <p>Hello <strong>${firstName}</strong>,</p>
            
            <p>Thank you for registering with QRollCall Attendance System! To complete your registration and activate your account, please verify your email address.</p>
            
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </p>
            
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            
            <div class="link-box">
              ${verificationLink}
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This link will expire in 24 hours</li>
                <li>If you didn't create this account, please ignore this email</li>
                <li>For security, do not share this link with anyone</li>
              </ul>
            </div>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>✅ Access your dashboard</li>
              <li>✅ Mark attendance using QR codes</li>
              <li>✅ View your attendance records</li>
              <li>✅ Receive notifications about your courses</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This email was sent by QRollCall Attendance System</p>
            <p>If you have any questions, please contact your system administrator.</p>
            <p style="margin-top: 20px; color: #999;">
              © ${new Date().getFullYear()} QRollCall. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${firstName},

Thank you for registering with QRollCall Attendance System!

To complete your registration and activate your account, please verify your email address by clicking the link below:

${verificationLink}

⚠️ Important:
- This link will expire in 24 hours
- If you didn't create this account, please ignore this email
- For security, do not share this link with anyone

Once verified, you'll be able to access all features of the QRollCall system.

If you have any questions, please contact your system administrator.

© ${new Date().getFullYear()} QRollCall. All rights reserved.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email: ' + error.message);
  }
};

/**
 * Send verification success email
 * @param {string} email - User's email address
 * @param {string} firstName - User's first name
 */
const sendVerificationSuccessEmail = async (email, firstName = 'User') => {
  const loginLink = `${CLIENT_URL}/auth/login`;

  const mailOptions = {
    from: {
      name: 'QRollCall Attendance System',
      address: process.env.SMTP_USER
    },
    to: email,
    subject: 'Email Verified Successfully - QRollCall',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: #f9f9f9; border-radius: 8px; padding: 30px; }
          .success-icon { text-align: center; font-size: 48px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #52c41a; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h2 style="text-align: center; color: #52c41a;">Email Verified Successfully!</h2>
          
          <p>Hello <strong>${firstName}</strong>,</p>
          
          <p>Congratulations! Your email has been successfully verified. Your QRollCall account is now active and ready to use.</p>
          
          <p style="text-align: center;">
            <a href="${loginLink}" class="button">Login to Your Account</a>
          </p>
          
          <p>You can now:</p>
          <ul>
            <li>Access your personalized dashboard</li>
            <li>Mark attendance using QR codes</li>
            <li>View your attendance history</li>
            <li>Manage your profile</li>
          </ul>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact support.</p>
          
          <p>Welcome aboard!</p>
          <p><strong>The QRollCall Team</strong></p>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification success email sent to:', email);
  } catch (error) {
    console.error('Error sending success email:', error);
    // Don't throw error as verification is already complete
  }
};

/**
 * Send welcome email with credentials for admin-created accounts
 * @param {string} email - User's email address
 * @param {string} firstName - User's first name
 * @param {string} role - User's role
 * @param {string} temporaryPassword - Temporary password
 * @param {Object} additionalInfo - Additional user information
 */
const sendWelcomeEmail = async (email, firstName, role, temporaryPassword, additionalInfo = {}) => {
  const loginLink = `${CLIENT_URL}/auth/login`;

  // Role-specific welcome messages
  const roleMessages = {
    super_admin: {
      title: 'Super Administrator Account Created',
      icon: '👑',
      description: 'You have been granted super administrator privileges on QRollCall.',
      permissions: [
        'Manage all departments and users',
        'Create and manage department administrators',
        'Access system-wide analytics and reports',
        'Configure system settings',
        'Full access to all attendance records'
      ]
    },
    department_admin: {
      title: 'Department Administrator Account Created',
      icon: '🎓',
      description: `You have been appointed as an administrator for the ${additionalInfo.departmentName || 'department'}.`,
      permissions: [
        'Manage lecturers and students in your department',
        'Create and manage courses and units',
        'Monitor department-wide attendance',
        'Generate department reports',
        'Approve enrollment requests'
      ]
    },
    lecturer: {
      title: 'Lecturer Account Created',
      icon: '👨‍🏫',
      description: 'Welcome to QRollCall! Your lecturer account has been created.',
      permissions: [
        'Create and manage class sessions',
        'Generate QR codes for attendance',
        'View and export attendance records',
        'Manage your assigned units',
        'Submit student feedback and grades'
      ]
    },
    student: {
      title: 'Student Account Created',
      icon: '🎒',
      description: `Welcome to QRollCall! You have been enrolled as a student${additionalInfo.courseName ? ` in ${additionalInfo.courseName}` : ''}.`,
      permissions: [
        'Mark attendance using QR codes',
        'View your attendance history',
        'Access your enrolled units',
        'Check attendance statistics',
        'Receive session notifications'
      ]
    }
  };

  const roleInfo = roleMessages[role] || roleMessages.student;

  const mailOptions = {
    from: {
      name: 'QRollCall Attendance System',
      address: process.env.SMTP_USER
    },
    to: email,
    subject: `${roleInfo.title} - QRollCall`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #1890ff;
            margin-bottom: 10px;
          }
          .role-icon {
            font-size: 48px;
            margin: 20px 0;
          }
          .content {
            background-color: white;
            padding: 25px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .credentials-box {
            background-color: #e6f7ff;
            border: 2px solid #1890ff;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px;
            background-color: white;
            border-radius: 4px;
          }
          .credential-label {
            font-weight: bold;
            color: #666;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            color: #1890ff;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #1890ff;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #096dd9;
          }
          .warning {
            background-color: #fff7e6;
            border-left: 4px solid #faad14;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .permissions-list {
            background-color: #f6ffed;
            border-left: 4px solid #52c41a;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">📋 QRollCall</div>
            <div class="role-icon">${roleInfo.icon}</div>
            <h2 style="margin: 0; color: #333;">${roleInfo.title}</h2>
          </div>
          
          <div class="content">
            <p>Hello <strong>${firstName}</strong>,</p>
            
            <p>${roleInfo.description}</p>
            
            <p>Your account has been successfully created. Below are your login credentials:</p>
            
            <div class="credentials-box">
              <h3 style="margin-top: 0; color: #1890ff;">🔐 Login Credentials</h3>
              
              <div class="credential-row">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              
              <div class="credential-row">
                <span class="credential-label">Temporary Password:</span>
                <span class="credential-value">${temporaryPassword}</span>
              </div>
              
              ${additionalInfo.regNo ? `
              <div class="credential-row">
                <span class="credential-label">Registration No:</span>
                <span class="credential-value">${additionalInfo.regNo}</span>
              </div>
              ` : ''}
              
              ${additionalInfo.departmentName ? `
              <div class="credential-row">
                <span class="credential-label">Department:</span>
                <span class="credential-value">${additionalInfo.departmentName}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Instructions:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Change your password immediately</strong> after first login</li>
                <li>Do not share your credentials with anyone</li>
                <li>Use a strong, unique password</li>
                <li>Keep this email secure or delete it after changing your password</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${loginLink}" class="button">Login to Your Account</a>
            </p>
            
            <div class="permissions-list">
              <h4 style="margin-top: 0; color: #52c41a;">✅ Your Permissions</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${roleInfo.permissions.map(perm => `<li>${perm}</li>`).join('')}
              </ul>
            </div>
            
            <p><strong>Getting Started:</strong></p>
            <ol>
              <li>Click the "Login to Your Account" button above</li>
              <li>Enter your email and temporary password</li>
              <li>You will be prompted to change your password</li>
              <li>Set a strong, memorable password</li>
              <li>Start using QRollCall!</li>
            </ol>
            
            <p>If you have any questions or need assistance, please contact your system administrator${additionalInfo.adminEmail ? ` at ${additionalInfo.adminEmail}` : ''}.</p>
            
            <p>Welcome to the QRollCall family!</p>
          </div>
          
          <div class="footer">
            <p>This email was sent by QRollCall Attendance System</p>
            <p style="margin-top: 20px; color: #999;">
              © ${new Date().getFullYear()} QRollCall. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
${roleInfo.title}

Hello ${firstName},

${roleInfo.description}

Your account has been successfully created. Below are your login credentials:

Email: ${email}
Temporary Password: ${temporaryPassword}
${additionalInfo.regNo ? `Registration No: ${additionalInfo.regNo}` : ''}
${additionalInfo.departmentName ? `Department: ${additionalInfo.departmentName}` : ''}

⚠️ IMPORTANT SECURITY INSTRUCTIONS:
- Change your password immediately after first login
- Do not share your credentials with anyone
- Use a strong, unique password
- Keep this email secure or delete it after changing your password

Login here: ${loginLink}

Your Permissions:
${roleInfo.permissions.map((perm, i) => `${i + 1}. ${perm}`).join('\n')}

Getting Started:
1. Visit the login page
2. Enter your email and temporary password
3. Change your password when prompted
4. Start using QRollCall!

If you have any questions, please contact your system administrator.

Welcome to QRollCall!

© ${new Date().getFullYear()} QRollCall. All rights reserved.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${role}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email: ' + error.message);
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} token - Reset token
 * @param {string} firstName - User's first name
 */
const sendPasswordResetEmail = async (email, token, firstName = 'User') => {
  const resetLink = `${CLIENT_URL}/auth/reset-password/${token}`;

  const mailOptions = {
    from: {
      name: 'QRollCall Attendance System',
      address: process.env.SMTP_USER
    },
    to: email,
    subject: 'Password Reset Request - QRollCall',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background-color: #f9f9f9; border-radius: 8px; padding: 30px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #faad14; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .warning { background-color: #fff7e6; border-left: 4px solid #faad14; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          
          <p>Hello <strong>${firstName}</strong>,</p>
          
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, please ignore this email</li>
              <li>Your password won't change until you set a new one</li>
            </ul>
          </div>
          
          <p>Link: ${resetLink}</p>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendVerificationSuccessEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
