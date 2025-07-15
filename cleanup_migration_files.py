#!/usr/bin/env python
"""
Migration Cleanup Script - Remove Duplicate and Conflicting Migrations
This script will clean up the migration files before running the main fix
"""

import os
import shutil
import sys
import glob

def main():
    print("=" * 60)
    print("WMSU Health Services - Migration File Cleanup")
    print("=" * 60)
    
    # Change to Django directory
    os.chdir('backend/django_api')
    
    migrations_dir = 'api/migrations'
    backup_dir = 'api/migrations/backup_migrations'
    
    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)
    
    print("\n1. Identifying duplicate migration files...")
    
    # Find all 0046 migrations
    migration_0046_files = glob.glob(f'{migrations_dir}/0046_*.py')
    print(f"Found 0046 migrations: {migration_0046_files}")
    
    # Keep only the original 0046 migration, remove duplicates
    original_0046 = f'{migrations_dir}/0046_add_semester_to_patient.py'
    for migration_file in migration_0046_files:
        if migration_file != original_0046:
            # Backup the duplicate
            backup_name = f"backup_{os.path.basename(migration_file)}"
            shutil.copy2(migration_file, os.path.join(backup_dir, backup_name))
            
            # Remove the duplicate
            os.remove(migration_file)
            print(f"✓ Removed duplicate: {migration_file}")
    
    print("\n2. Checking for other conflicting files...")
    
    # Check for any migration files with 'fixed' in the name
    fixed_migrations = glob.glob(f'{migrations_dir}/*fixed*.py')
    for migration_file in fixed_migrations:
        backup_name = f"backup_{os.path.basename(migration_file)}"
        shutil.copy2(migration_file, os.path.join(backup_dir, backup_name))
        os.remove(migration_file)
        print(f"✓ Removed fixed migration: {migration_file}")
    
    print("\n3. Listing current migration files...")
    migration_files = sorted(glob.glob(f'{migrations_dir}/[0-9]*.py'))
    for i, migration_file in enumerate(migration_files[-10:], 1):  # Show last 10
        print(f"  {i:2d}. {os.path.basename(migration_file)}")
    
    print("\n✅ Migration file cleanup completed!")
    print(f"✓ Backups stored in: {backup_dir}")
    print("\nYou can now run the main migration fix script:")
    print("python fix_migrations_complete.py")

if __name__ == "__main__":
    main()
