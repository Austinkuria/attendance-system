const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function seedSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ isSuperAdmin: true });
    
    if (existingAdmin) {
      console.log('\n⚠️  Super admin already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('\nTo reset password, delete this user from database and run script again.');
      process.exit(0);
    }

    // Create super admin with your actual email
    const password = 'Admin@2025!'; // Strong default password
    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = new User({
      role: 'super_admin',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'kuriaaustin125@gmail.com', // Your email from .env
      password: hashedPassword,
      isSuperAdmin: true,
      isActive: true,
      mustChangePassword: true // Force password change on first login
    });

    await superAdmin.save();

    console.log('\n🎉 Super admin created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('Email:    ', superAdmin.email);
    console.log('Password: ', password);
    console.log('Role:     ', superAdmin.role);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('1. Save these credentials securely');
    console.log('2. You MUST change password on first login');
    console.log('3. Never share these credentials');
    console.log('4. Login at: http://localhost:5173/auth/login');
    console.log('5. After deployment: https://attendance-system123.vercel.app/auth/login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    
    if (error.code === 11000) {
      console.error('\nDuplicate key error - user with this email already exists');
    }
    
    process.exit(1);
  }
}

// Run the seeding
seedSuperAdmin();
