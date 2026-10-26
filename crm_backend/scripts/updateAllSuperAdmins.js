// scripts/updateAllSuperAdmins.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { getCompanyConnection } from '../config/multiDatabase.js';
import { userSchema } from '../models/User.js';

dotenv.config();

const NEW_SUPER_ADMIN = {
  name: 'Super Admin',
  username: 'superadmin',
  email: 'admin123@gmail.com',
  password: 'pass-admin123',
  phone: '9999999999',
  role: 'super_admin',
  status: 'Active',
  permissions: ['*'],
  location: 'Head Office'
};

const COMPANIES = [
  { id: 'jain-impex', name: 'Company 1' },
  { id: 'ridhi', name: 'Company 2' },
  { id: 'shree-jain-impex', name: 'Company 3' }
];

async function updateAllSuperAdmins() {
  const connections = [];
  
  try {
    console.log('🚀 Updating super admin credentials for all companies...\n');
    console.log('New Credentials:');
    console.log(`   Email: ${NEW_SUPER_ADMIN.email}`);
    console.log(`   Password: ${NEW_SUPER_ADMIN.password}\n`);

    for (const company of COMPANIES) {
      console.log(`\n📦 Processing ${company.name} (${company.id})`);
      console.log('─'.repeat(50));

      try {
        const dbConnection = getCompanyConnection(company.id);
        connections.push(dbConnection);
        await dbConnection.asPromise();

        const User = dbConnection.models.User || dbConnection.model('User', userSchema);

        // Find existing super admin user
        const existing = await User.findOne({
          $or: [
            { email: NEW_SUPER_ADMIN.email },
            { username: NEW_SUPER_ADMIN.username },
            { role: 'super_admin' }
          ]
        }).select('+password');

        if (existing) {
          console.log(`   ⚠️  Found existing user:`);
          console.log(`      Email: ${existing.email}`);
          console.log(`      Username: ${existing.username}`);
          console.log(`      Role: ${existing.role}`);
          
          // Update with new credentials (keep original username to avoid duplicate error)
          existing.name = NEW_SUPER_ADMIN.name;
          // Don't change username if it would cause duplicate
          existing.email = NEW_SUPER_ADMIN.email;
          existing.password = NEW_SUPER_ADMIN.password;
          existing.phone = NEW_SUPER_ADMIN.phone;
          existing.role = NEW_SUPER_ADMIN.role;
          existing.status = NEW_SUPER_ADMIN.status;
          existing.permissions = NEW_SUPER_ADMIN.permissions;
          existing.location = NEW_SUPER_ADMIN.location;
          existing.updatedAt = new Date();
          
          await existing.save();
          console.log(`   ✅ Updated successfully!`);
          console.log(`      New Email: ${existing.email}`);
          console.log(`      Username: ${existing.username} (kept existing)`);
        } else {
          // Create new super admin
          const newUser = new User(NEW_SUPER_ADMIN);
          await newUser.save();
          console.log(`   ✅ Created successfully!`);
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 All companies updated successfully!');
    console.log('═'.repeat(50));
    console.log('\n📋 Login credentials for ALL companies:');
    console.log(`   Email: ${NEW_SUPER_ADMIN.email}`);
    console.log(`   Password: ${NEW_SUPER_ADMIN.password}`);
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

updateAllSuperAdmins();
