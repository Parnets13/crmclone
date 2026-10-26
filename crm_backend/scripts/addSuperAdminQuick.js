// scripts/addSuperAdminQuick.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const SUPER_ADMIN_DATA = {
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

async function addSuperAdmin() {
  try {
    console.log('🚀 Adding super admin to all companies...\n');

    const baseUri = process.env.MONGO_BASE_URI;
    const options = process.env.MONGO_OPTIONS || '';
    
    const databases = {
      'jain-impex': process.env.MONGO_DB_JAINIMPEX,
      'ridhi': process.env.MONGO_DB_RIDHI,
      'shree-jain-impex': process.env.MONGO_DB_SHREEJAIN
    };

    for (const [company, dbName] of Object.entries(databases)) {
      console.log(`\n📦 ${company} (${dbName})`);
      
      const uri = `${baseUri}/${dbName}${options}`;
      const connection = await mongoose.createConnection(uri).asPromise();
      
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

      // Find by email OR username
      const existing = await User.findOne({
        $or: [
          { email: SUPER_ADMIN_DATA.email },
          { username: SUPER_ADMIN_DATA.username }
        ]
      });

      if (existing) {
        console.log(`   ⚠️  User exists - updating...`);
        // Update all fields
        Object.assign(existing, SUPER_ADMIN_DATA);
        existing.updatedAt = new Date();
        await existing.save();
        console.log(`   ✅ Updated`);
      } else {
        const newUser = new User(SUPER_ADMIN_DATA);
        await newUser.save();
        console.log(`   ✅ Created`);
      }

      await connection.close();
    }

    console.log('\n══════════════════════════════════════');
    console.log('✅ Super admin setup complete!');
    console.log('══════════════════════════════════════');
    console.log(`Email: ${SUPER_ADMIN_DATA.email}`);
    console.log(`Password: ${SUPER_ADMIN_DATA.password}`);
    console.log('══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

addSuperAdmin();
