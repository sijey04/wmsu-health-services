#!/usr/bin/env python
"""
Complete Migration Fix - Master Script
This script orchestrates the complete migration fix process
"""

import os
import sys
import subprocess
import shutil

def run_script(script_name, description):
    """Run a Python script and return success status"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Script: {script_name}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=True, text=True, timeout=300)
        
        print("STDOUT:")
        print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        if result.returncode == 0:
            print(f"✅ {description} completed successfully!")
            return True
        else:
            print(f"❌ {description} failed with return code: {result.returncode}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"❌ {description} timed out after 5 minutes")
        return False
    except Exception as e:
        print(f"❌ Error running {description}: {e}")
        return False

def backup_current_migrations():
    """Create a backup of current migration files"""
    print("\n" + "="*60)
    print("Creating backup of current migrations...")
    print("="*60)
    
    source_dir = 'backend/django_api/api/migrations'
    backup_dir = f'migration_backup_{int(__import__("time").time())}'
    
    try:
        shutil.copytree(source_dir, backup_dir)
        print(f"✅ Migrations backed up to: {backup_dir}")
        return backup_dir
    except Exception as e:
        print(f"⚠ Could not create backup: {e}")
        return None

def replace_problematic_migrations():
    """Replace problematic migrations with safe versions"""
    print("\n" + "="*60)
    print("Replacing problematic migrations...")
    print("="*60)
    
    migrations_dir = 'backend/django_api/api/migrations'
    
    # Replace migration 0046
    source_0046 = 'migration_0046_safe.py'
    dest_0046 = f'{migrations_dir}/0046_add_semester_to_patient.py'
    
    if os.path.exists(source_0046):
        shutil.copy2(source_0046, dest_0046)
        print("✅ Replaced migration 0046 with safe version")
    else:
        print("⚠ Safe migration 0046 not found")
    
    # Replace migration 0048
    source_0048 = 'migration_0048_safe.py'
    dest_0048 = f'{migrations_dir}/0048_remove_patient_api_patient_user_id_b1c93a_idx_and_more.py'
    
    if os.path.exists(source_0048):
        shutil.copy2(source_0048, dest_0048)
        print("✅ Replaced migration 0048 with safe version")
    else:
        print("⚠ Safe migration 0048 not found")

def main():
    print("="*70)
    print("WMSU Health Services - Master Migration Fix")
    print("Complete solution for all migration conflicts")
    print("="*70)
    
    # Step 1: Create backup
    backup_dir = backup_current_migrations()
    
    # Step 2: Clean up migration files
    if not run_script('cleanup_migration_files.py', 'Migration File Cleanup'):
        print("❌ Migration cleanup failed. Stopping.")
        return False
    
    # Step 3: Replace problematic migrations with safe versions
    replace_problematic_migrations()
    
    # Step 4: Run comprehensive migration fix
    if not run_script('comprehensive_migration_fix.py', 'Comprehensive Database Migration Fix'):
        print("❌ Comprehensive fix failed. Trying alternative fix...")
        
        # Fallback to original fix
        if not run_script('fix_migrations_complete.py', 'Alternative Migration Fix'):
            print("❌ All migration fixes failed.")
            print(f"\n📁 Your migrations have been backed up to: {backup_dir}")
            print("\nManual intervention may be required:")
            print("1. Check database connection and permissions")
            print("2. Review database schema manually")
            print("3. Consider resetting migrations (backup data first!)")
            return False
    
    # Step 5: Final verification
    print("\n" + "="*60)
    print("Running final verification...")
    print("="*60)
    
    try:
        os.chdir('backend/django_api')
        result = subprocess.run([sys.executable, 'manage.py', 'showmigrations'], 
                              capture_output=True, text=True, timeout=60)
        
        print("Migration Status:")
        print(result.stdout)
        
        if result.stderr:
            print("Warnings/Errors:")
            print(result.stderr)
        
        # Test database connection
        result = subprocess.run([sys.executable, 'manage.py', 'check'], 
                              capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ Django system check passed!")
        else:
            print("⚠ Django system check has issues:")
            print(result.stdout)
            print(result.stderr)
        
        os.chdir('../..')
        
    except Exception as e:
        print(f"⚠ Could not run final verification: {e}")
    
    print("\n" + "="*70)
    print("🎉 MIGRATION FIX PROCESS COMPLETED!")
    print("="*70)
    print("\nNext steps:")
    print("1. Test your Django application")
    print("2. Run: cd backend/django_api && python manage.py runserver")
    print("3. Check that all features work correctly")
    print(f"4. If issues persist, restore from backup: {backup_dir}")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
