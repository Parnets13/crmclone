# Parnetstech13 Setup Guide

## Quick Setup

### Step 1: Create Super Admin in New Database

Run this command in the backend directory:

```bash
cd crm_backend
npm run seed:parnetstech13
```

This will:
- Connect to the NEW parnetstech13 database
- Create a super admin user with these credentials:
  - Email: `admin123@gmail.com`
  - Password: `pass-admin123`

### Step 2: Login

1. Open your frontend application
2. Select **Parnetstech13** (purple card)
3. Login with:
   - Email: `admin123@gmail.com`
   - Password: `pass-admin123`

---

## Database Configuration

### Old Databases (NOT TOUCHED)
- ✅ **jain-impex** → JainImpexCRM (keeps old credentials)
- ✅ **ridhi** → ridhi_crm (keeps old credentials)
- ✅ **shree-jain-impex** → shreejain_crm (keeps old credentials)

### New Database (SEPARATE)
- 🆕 **parnetstech13** → parnetstech13_crm
  - Cluster: cluster0.4pl4kok.mongodb.net
  - User: parnetstech13_db_user
  - Database: parnetstech13_crm

---

## Login Credentials Summary

### Old Companies (UNCHANGED)
```
jain-impex:
  - Email: superadmin@jainimpex.com
  - Password: superadmin123

ridhi:
  - Email: superadmin@ridhi.com
  - Password: superadmin123

shree-jain-impex:
  - Email: superadmin@shreejainimpex.com
  - Password: superadmin123
```

### New Company (PARNETSTECH13)
```
parnetstech13:
  - Email: admin123@gmail.com
  - Password: pass-admin123
```

---

## What Changed?

### ✅ Frontend
- Added Parnetstech13 as 4th company (purple theme)
- Login page supports parnetstech13
- Old companies keep their original credentials

### ✅ Backend
- .env configured with new database cluster
- multiDatabase.js supports separate cluster for parnetstech13
- New script to create admin only for parnetstech13

### ✅ Database Isolation
- Each company has its own database
- Parnetstech13 is on a completely separate cluster
- No data mixing between companies

---

## Troubleshooting

### "Cannot connect to database"
Check .env file has:
```
MONGO_BASE_URI_PARNETSTECH13=mongodb+srv://parnetstech13_db_user:zYcsBnU2PhZj0i7O@cluster0.4pl4kok.mongodb.net
MONGO_OPTIONS_PARNETSTECH13=?retryWrites=true&w=majority
MONGO_DB_PARNETSTECH13=parnetstech13_crm
```

### "User not found"
Run the setup script:
```bash
npm run seed:parnetstech13
```

### "Wrong cluster"
Make sure you're selecting the RIGHT company:
- Purple card = Parnetstech13 = NEW database
- Other cards = Old companies = OLD databases

---

## Testing

1. ✅ Test old companies still work with old credentials
2. ✅ Test parnetstech13 works with new credentials
3. ✅ Verify data isolation (each company sees only its data)

---

## Direct Database Access

If you need to access the database directly:

```
mongodb+srv://parnetstech13_db_user:zYcsBnU2PhZj0i7O@cluster0.4pl4kok.mongodb.net/parnetstech13_crm
```

Use MongoDB Compass or mongosh with this connection string.
