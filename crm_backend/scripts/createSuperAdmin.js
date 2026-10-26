// scripts/createSuperAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { getCompanyConnection } from '../config/multiDatabase.js';
import { userSchema } from '../models/User.js';

dotenv.config();

const SUPER_ADMIN_DATA = {
  name: 'Super Admin',
  username: 'superadmin',
  email: 'admin123@gmail.com',
  password: 'pass-admin123',
  phone: '9999999999',
  role: 'super_admin',
  status: 'Active',
  permissions: ['*'], // All permissions
  location: 'Head Office'
};

const COMPANIES = [
  'jain-impex',
  'ridhi', 
  'shree-jain-impex',
  'parnetstech13'
];

async function createSuperAdmin() {
  const connections = [];
  
  try {
    console.log('🚀 Starting super admin creation process...\n');

    for (const company of COMPANIES) {
      console.log(`\n📦 Processing company: ${company}`);
      console.log('─'.repeat(50));

      try {
        // Get company-specific database connection
        const dbConnection = getCompanyConnection(company);
        connections.push(dbConnection);
        await dbConnection.asPromise(); // Wait for connection

        // Get User model
        const User = dbConnection.models.User || dbConnection.model('User', userSchema);

        // Check if super admin already exists (by email or username)
        let existingUser = await User.findOne({ 
          email: SUPER_ADMIN_DATA.email 
        }).select('+password');

        if (existingUser) {
          console.log(`⚠️  User with email already exists in ${company}`);
          console.log(`   Email: ${existingUser.email}`);
          console.log(`   Username: ${existingUser.username}`);
          console.log(`   Role: ${existingUser.role}`);
          console.log(`   Status: ${existingUser.status}`);
          
          // Update to ensure it has correct credentials and role
          existingUser.username = SUPER_ADMIN_DATA.username;
          existingUser.name = SUPER_ADMIN_DATA.name;
          existingUser.phone = SUPER_ADMIN_DATA.phone;
          existingUser.role = SUPER_ADMIN_DATA.role;
          existingUser.status = SUPER_ADMIN_DATA.status;
          existingUser.permissions = SUPER_ADMIN_DATA.permissions;
          existingUser.location = SUPER_ADMIN_DATA.location;
          existingUser.password = SUPER_ADMIN_DATA.password;
          
          await existingUser.save();
          console.log(`   ✅ User updated with correct credentials`);
          
          continue;
        }

        // Check if username already exists (might be different email)
        existingUser = await User.findOne({ 
          username: SUPER_ADMIN_DATA.username 
        }).select('+password');

        if (existingUser) {
          console.log(`⚠️  User with username already exists in ${company}`);
          console.log(`   Email: ${existingUser.email}`);
          console.log(`   Username: ${existingUser.username}`);
          console.log(`   Role: ${existingUser.role}`);
          console.log(`   Status: ${existingUser.status}`);
          
          // Update to ensure it has correct credentials and role
          existingUser.email = SUPER_ADMIN_DATA.email;
          existingUser.name = SUPER_ADMIN_DATA.name;
          existingUser.phone = SUPER_ADMIN_DATA.phone;
          existingUser.role = SUPER_ADMIN_DATA.role;
          existingUser.status = SUPER_ADMIN_DATA.status;
          existingUser.permissions = SUPER_ADMIN_DATA.permissions;
          existingUser.location = SUPER_ADMIN_DATA.location;
          existingUser.password = SUPER_ADMIN_DATA.password;
          
          await existingUser.save();
          console.log(`   ✅ User updated with correct credentials`);
          
          continue;
        }

        // Create new super admin
        const newUser = new User(SUPER_ADMIN_DATA);
        await newUser.save();

        console.log(`✅ Super admin created successfully in ${company}`);
        console.log(`   Email: ${SUPER_ADMIN_DATA.email}`);
        console.log(`   Password: ${SUPER_ADMIN_DATA.password}`);
        console.log(`   Role: ${SUPER_ADMIN_DATA.role}`);
        console.log(`   Status: ${SUPER_ADMIN_DATA.status}`);

      } catch (error) {
        console.error(`❌ Error processing ${company}:`, error.message);
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('🎉 Super admin creation process completed!');
    console.log('═'.repeat(50));
    console.log('\n📋 Login credentials for all companies:');
    console.log(`   Email: ${SUPER_ADMIN_DATA.email}`);
    console.log(`   Password: ${SUPER_ADMIN_DATA.password}`);
    console.log('\n✅ You can now login to any of these companies:');
    COMPANIES.forEach(company => {
      console.log(`   • ${company}`);
    });
    console.log('\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Close all connections
    console.log('\n🔌 Closing database connections...');
    
    try {
      // Close each connection individually
      for (const conn of connections) {
        if (conn && conn.readyState !== 0) {
          await conn.close();
        }
      }
      
      // Also disconnect mongoose
      await mongoose.disconnect();
      console.log('✅ All database connections closed');
    } catch (err) {
      console.error('⚠️  Error closing connections:', err.message);
    }
    
    // Force exit
    setTimeout(() => {
      console.log('👋 Exiting...\n');
      process.exit(0);
    }, 500);
  }
}

// Run the script
createSuperAdmin();
