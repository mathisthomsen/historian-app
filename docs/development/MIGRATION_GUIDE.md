# 🔄 Migration Guide: Project-Based Structure

This guide explains how to migrate existing data to the new project-based structure.

## 📋 Overview

The migration process will:
1. Create a "Default Project" for each existing user
2. Move all existing data to the user's default project
3. Add users as owners of their default projects
4. Verify the migration was successful

## 🛠️ Migration Scripts

### Local Development Migration

```bash
# Run the local migration script
node scripts/migrate-to-projects.js
```

### Production Migration

```bash
# First, run a dry-run to see what would be migrated
node scripts/migrate-to-projects-production.js --dry-run

# If the dry-run looks good, run the actual migration
node scripts/migrate-to-projects-production.js
```

## 🔍 What the Migration Does

### For Each User:
1. **Creates a "Default Project"** - All existing data will be moved here
2. **Migrates all data types:**
   - Events
   - Persons
   - Life Events
   - Literature
   - Event Types
   - Import History
   - Data Uncertainty
   - Duplicate Matches
3. **Adds user as project owner** - User gets full access to their default project

### Safety Features:
- ✅ **Automatic backup** - Creates a timestamped backup file
- ✅ **Dry-run mode** - Test without making changes
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **Verification** - Checks that all data was migrated correctly

## 📊 Migration Process

### Step 1: Backup (Production Only)
- Creates a JSON backup of all user data
- Saved as `backup-{timestamp}.json`

### Step 2: Create Default Projects
- Creates a "Default Project" for each user
- Skips if project already exists

### Step 3: Migrate Data
- Updates all existing records to include `project_id`
- Only migrates records that don't already have a project

### Step 4: Add Project Memberships
- Adds each user as an owner of their default project
- Skips if membership already exists

### Step 5: Verify Migration
- Counts migrated records for each user
- Provides a summary report

## 🚨 Important Notes

### Before Migration:
1. **Test locally first** - Always test on development data
2. **Backup your database** - Create a database backup
3. **Check disk space** - Ensure you have space for backup files
4. **Notify users** - Let users know about the upcoming change

### After Migration:
1. **Verify data integrity** - Check that all data is accessible
2. **Test the application** - Ensure everything works correctly
3. **Keep backup files** - Store backups safely
4. **Update documentation** - Update any relevant docs

## 🔧 Troubleshooting

### Common Issues:

#### "No project found for user"
- Check if the user exists in the database
- Verify the user has data to migrate

#### "Migration failed"
- Check the error message for specific issues
- Verify database connectivity
- Ensure you have proper permissions

#### "Some data not migrated"
- Check if data already has `project_id` set
- Verify the migration script ran completely

### Rollback Plan:
If something goes wrong, you can restore from the backup:

```bash
# The backup file contains all original data
# You can use it to restore if needed
cat backup-{timestamp}.json
```

## 📈 Expected Results

After successful migration:
- ✅ Each user has a "Default Project"
- ✅ All existing data is associated with the user's default project
- ✅ Users can access their data through the project interface
- ✅ No data loss occurs

## 🎯 Next Steps

After migration:
1. **Frontend Integration** - Add project selection UI
2. **User Education** - Explain the new project structure
3. **Feature Testing** - Test all project-related features
4. **Performance Monitoring** - Monitor for any performance issues

## 📞 Support

If you encounter issues during migration:
1. Check the console output for error messages
2. Verify database connectivity and permissions
3. Review the backup file to ensure data integrity
4. Contact the development team if needed

---

**⚠️ Important**: Always test migrations on a copy of your production data before running on the live system! 