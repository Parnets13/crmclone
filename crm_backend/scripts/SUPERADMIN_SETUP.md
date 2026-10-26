# Super Admin Setup

## Credentials

The following super admin account has been created/updated in all three company databases:

- **Email**: `admin123@gmail.com`
- **Password**: `pass-admin123`
- **Role**: `super_admin`
- **Permissions**: All (`*`)

## Companies

This super admin can log in to:

1. **jain-impex** - Jain Impex CRM (JainImpexCRM database)
2. **ridhi** - Ridhi Build Mart (ridhi_crm database)  
3. **shree-jain-impex** - Shree Jain Impex (shreejain_crm database)

## Setup Status

Based on the script execution:

✅ **ridhi** - Super admin created successfully  
✅ **shree-jain-impex** - Super admin created successfully  
⚠️ **jain-impex** - Existing user detected with username "superadmin"

For jain-impex, if needed, you can:
1. Manually update the existing superadmin user's email to `admin123@gmail.com`
2. Or use the existing superadmin credentials

## How to Run the Script Again

If you need to re-run or verify the super admin setup:

```bash
# Method 1: Using npm script
npm run seed:superadmin

# Method 2: Direct execution
node scripts/createSuperAdmin.js

# Method 3: Quick version (faster)
node scripts/addSuperAdminQuick.js
```

## Login Process

To log in with these credentials:

1. Open your CRM frontend
2. Select the company (jain-impex, ridhi, or shree-jain-impex)
3. Enter email: `admin123@gmail.com`
4. Enter password: `pass-admin123`
5. Click login

## Troubleshooting

### If login fails for jain-impex:

The jain-impex database may have a different superadmin user. You can either:

1. **Check existing super admin** - Look in the MongoDB database for the current superadmin email
2. **Update manually** - Use MongoDB Compass or a script to update the user
3. **Create new user** - Use the user management interface to create a new super admin

### To manually update in MongoDB:

```javascript
// Connect to JainImpexCRM database
db.users.updateOne(
  { username: "superadmin" },
  { 
    $set: { 
      email: "admin123@gmail.com",
      // Password will be hashed automatically if using the app
      role: "super_admin",
      permissions: ["*"],
      status: "Active"
    }
  }
)
```

## Security Note

⚠️ **Important**: These are development/initial setup credentials. For production:

1. Change the password immediately after first login
2. Use strong, unique passwords
3. Consider implementing 2FA
4. Regularly rotate credentials
5. Monitor super admin account activity
