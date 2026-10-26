// scripts/createParnetstech13Admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const SUPER_ADMIN_DATA = {
  name: 'Super Admin',
  username: 'parnetsadmin',
  email: 'admin123@gmail.com',
  password: 'pass-admin123',
  phone: '9999999999',
  role: 'super_admin',
  status: 'Active',
  permissions: ['*'],
  location: 'Head Office'
};

async function createParnetstech13Admin() {
  try {
    console.log('🚀 Creating super admin for Parnetstech13...\n');

    const baseUri = process.env.MONGO_BASE_URI_PARNETSTECH13;
    const options = process.env.MONGO_OPTIONS_PARNETSTECH13 || '';
    const dbName = process.env.MONGO_DB_PARNETSTECH13 || 'parnetstech13_crm';

    if (!baseUri) {
      throw new Error('MONGO_BASE_URI_PARNETSTECH13 not found in .env file');
    }

    console.log(`📦 Connecting to: ${dbName}`);
    console.log(`🔗 Cluster: ${baseUri.split('@')[1]?.split('/')[0]}\n`);

    const uri = `${baseUri}/${dbName}${options}`;
    const connection = await mongoose.createConnection(uri).asPromise();

    console.log('✅ Connected successfully!\n');

    const userSchema = new mongoose.Schema({
      name: String,
      username: String,
      email: String,
      password: String,
      phone: String,
      role: String,
      status: String,
      permissions: [String],
      location: String,
      lastLogin: Date,
      joinDate: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    // Pre-save hook to hash password
    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    });

    const User = connection.model('User', userSchema);

    // Check if user already exists
    const existing = await User.findOne({
      $or: [
        { email: SUPER_ADMIN_DATA.email },
        { username: SUPER_ADMIN_DATA.username }
      ]
    });

    if (existing) {
      console.log(`⚠️  User already exists`);
      console.log(`   Email: ${existing.email}`);
      console.log(`   Username: ${existing.username}`);
      console.log(`   Role: ${existing.role}\n`);
      
      // Update password
      Object.assign(existing, SUPER_ADMIN_DATA);
      existing.updatedAt = new Date();
      await existing.save();
      console.log(`✅ User updated successfully!\n`);
    } else {
      const newUser = new User(SUPER_ADMIN_DATA);
      await newUser.save();
      console.log(`✅ Super admin created successfully!\n`);
    }

    console.log('══════════════════════════════════════');
    console.log('🎉 Parnetstech13 setup complete!');
    console.log('══════════════════════════════════════');
    console.log(`Database: ${dbName}`);
    console.log(`Email: ${SUPER_ADMIN_DATA.email}`);
    console.log(`Password: ${SUPER_ADMIN_DATA.password}`);
    console.log('══════════════════════════════════════\n');

    await connection.close();
    console.log('🔌 Connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. .env file has MONGO_BASE_URI_PARNETSTECH13');
    console.error('   2. MongoDB Atlas IP whitelist is configured');
    console.error('   3. Database user credentials are correct\n');
    process.exit(1);
  }
  
  process.exit(0);
}

createParnetstech13Admin();
