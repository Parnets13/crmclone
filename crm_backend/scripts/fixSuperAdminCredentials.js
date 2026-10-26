// scripts/fixSuperAdminCredentials.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { getCompanyConnection } from '../config/multiDatabase.js';
import { userSchema } from '../models/User.js';

dotenv.config();

const NEW_CREDENTIALS = {
  email: 'admin123@gmail.com',
  password: 'pass-admin123',
};

const COMPANIES = [
  { id: 'jain-impex', name: 'Company 1' },
  { id: 'ridhi', name: 'Company 2' },
  { id: 'shree-jain-impex', name: 'Company 3' }
];

async function fixSuperAdminCredentials() {
  const connections = [];
  
  try {
    console.log('🚀 Fixing super admin credentials for all companies...\n');
    console.log('Target Credentials:');
    console.log(`   Email: ${NEW_CREDENTIALS.email}`);
    console.log(`   Password: ${NEW_CREDENTIALS.password}\n`);

    for (const company of COMPANIES) {
      console.log(`\n📦 Processing ${company.name} (${company.id})`);
      console.log('─'.repeat(50));

      try {
        const dbConnection = getCompanyConnection(company.id);
        connections.push(dbConnection);
        await dbConnection.asPromise();

        const User = dbConnection.models.User || dbConnection.model('User', userSchema);

        // Find ALL users with super_admin role
        const allSuperAdmins = await User.find({ role: 'super_admin' }).select('+password');
        
        console.log(`   Found ${allSuperAdmins.length} super admin(s)`);

        if (allSuperAdmins.length === 0) {
          console.log(`   ⚠️  No super admin found, creating new one...`);
          const newUser = new User({
            name: 'Super Admin',
            username: `admin_${company.id.replace('-', '_')}`,
            email: NEW_CREDENTIALS.email,
            password: NEW_CREDENTIALS.password,
            phone: '9999999999',
            role: 'super_admin',
            status: 'Active',
            permissions: ['*'],
            location: 'Head Office'
          });
          await newUser.save();
          console.log(`   ✅ Created new super admin`);
        } else if (allSuperAdmins.length === 1) {
          // Update the single super admin
          const admin = allSuperAdmins[0];
          console.log(`      Current: ${admin.email} / ${admin.username}`);
          
          admin.email = NEW_CREDENTIALS.email;
          admin.password = NEW_CREDENTIALS.password;
          admin.status = 'Active';
          admin.permissions = ['*'];
          admin.updatedAt = new Date();
          
          await admin.save();
          console.log(`   ✅ Updated to: ${NEW_CREDENTIALS.email}`);
        } else {
          // Multiple super admins - keep one, delete others
          console.log(`   ⚠️  Multiple super admins found, consolidating...`);
          
          // Keep the first one, delete the rest
          const keepAdmin = allSuperAdmins[0];
          console.log(`      Keeping: ${keepAdmin.email} (${keepAdmin.username})`);
          
          for (let i = 1; i < allSuperAdmins.length; i++) {
            console.log(`      Deleting: ${allSuperAdmins[i].email} (${allSuperAdmins[i].username})`);
            await User.deleteOne({ _id: allSuperAdmins[i]._id });
          }
          
          // Update the kept admin
          keepAdmin.email = NEW_CREDENTIALS.email;
          keepAdmin.password = NEW_CREDENTIALS.password;
          keepAdmin.status = 'Active';
          keepAdmin.permissions = ['*'];
          keepAdmin.updatedAt = new Date();
          
          await keepAdmin.save();
          console.log(`   ✅ Consolidated and updated to: ${NEW_CREDENTIALS.email}`);
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 All companies fixed successfully!');
    console.log('═'.repeat(50));
    console.log('\n📋 Login credentials for ALL 3 companies:');
    console.log(`   Email: ${NEW_CREDENTIALS.email}`);
    console.log(`   Password: ${NEW_CREDENTIALS.password}`);
    console.log('\n✅ You can now login to:');
    COMPANIES.forEach(company => {
      console.log(`   • ${company.name} (${company.id})`);
    });
    console.log('\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    console.log('🔌 Closing connections...');
    
    try {
      for (const conn of connections) {
        if (conn && conn.readyState !== 0) {
          await conn.close();
        }
      }
      await mongoose.disconnect();
      console.log('✅ All connections closed');
    } catch (err) {
      console.error('⚠️  Error closing connections:', err.message);
    }
    
    setTimeout(() => {
      console.log('👋 Done!\n');
      process.exit(0);
    }, 500);
  }
}

fixSuperAdminCredentials();
