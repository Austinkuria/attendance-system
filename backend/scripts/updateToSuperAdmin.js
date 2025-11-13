const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function updateToSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    const email = 'kuriaaustin125@gmail.com';

    // Find existing user
    const existingUser = await User.findOne({ email });
    
    if (!existingUser) {
      console.log('\n❌ User not found. Run seedSuperAdmin.js instead.');
      process.exit(1);
    }

    console.log('\n📋 Current user details:');
    console.log('Email:', existingUser.email);
    console.log('Current Role:', existingUser.role);
    console.log('Is Super Admin:', existingUser.isSuperAdmin || false);

    // Update to super admin
    const password = 'Admin@2025!';
    const hashedPassword = await bcrypt.hash(password, 10);

    existingUser.role = 'super_admin';
    existingUser.isSuperAdmin = true;
    existingUser.password = hashedPassword;
    existingUser.mustChangePassword = true;
    existingUser.isActive = true;

    await existingUser.save();

    console.log('\n🎉 User updated to super admin successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('Email:    ', existingUser.email);
    console.log('Password: ', password);
    console.log('Role:     ', existingUser.role);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT:');
    console.log('1. You MUST change password on first login');
    console.log('2. Login at: http://localhost:5173/auth/login\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  }
}

updateToSuperAdmin();
