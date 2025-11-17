const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function verifyExistingSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database');

        // Find the super admin
        const superAdmin = await User.findOne({
            $or: [
                { isSuperAdmin: true },
                { email: 'kuriaaustin125@gmail.com' },
                { email: 'devhubmailer@gmail.com' }
            ]
        });

        if (!superAdmin) {
            console.log('❌ Super admin not found!');
            console.log('Please run: npm run seed:super-admin');
            process.exit(1);
        }

        console.log('\n📧 Found super admin:');
        console.log('Email:', superAdmin.email);
        console.log('Role:', superAdmin.role);
        console.log('Is Verified:', superAdmin.isVerified);
        console.log('Is Active:', superAdmin.isActive);

        // Update to verified
        if (!superAdmin.isVerified) {
            superAdmin.isVerified = true;
            await superAdmin.save();
            console.log('\n✅ Super admin email has been verified!');
        } else {
            console.log('\n✅ Super admin email was already verified!');
        }

        console.log('\n🎉 You can now login with:');
        console.log('Email:', superAdmin.email);
        console.log('Password: Admin@2025! (if not changed)');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Update failed:', error);
        process.exit(1);
    }
}

// Run the update
verifyExistingSuperAdmin();
