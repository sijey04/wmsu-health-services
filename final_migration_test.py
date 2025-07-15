#!/usr/bin/env python
"""
Final Migration Test and Verification
"""

import os
import sys
import subprocess

def main():
    print("=" * 80)
    print("FINAL MIGRATION VERIFICATION - WMSU Health Services")
    print("=" * 80)
    
    # Change to Django directory
    django_dir = r'c:\xampp\htdocs\wmsuhealthservices\backend\django_api'
    os.chdir(django_dir)
    
    print(f"Current directory: {os.getcwd()}")
    
    # Test 1: Check if migration file exists
    migration_file = 'api/migrations/0001_initial.py'
    if os.path.exists(migration_file):
        print("✓ Migration file exists: 0001_initial.py")
    else:
        print("❌ Migration file not found")
        return
    
    # Test 2: Run showmigrations
    print("\n2. Checking migration status...")
    try:
        result = subprocess.run([
            sys.executable, 'manage.py', 'showmigrations', 'api'
        ], capture_output=True, text=True, timeout=30)
        
        print("Migration status output:")
        print(result.stdout)
        if result.stderr:
            print("Errors:")
            print(result.stderr)
    except Exception as e:
        print(f"Error checking migrations: {e}")
    
    # Test 3: Try to run migrate
    print("\n3. Attempting to apply migrations...")
    try:
        result = subprocess.run([
            sys.executable, 'manage.py', 'migrate', 'api', '--fake-initial'
        ], capture_output=True, text=True, timeout=60)
        
        print("Migration output:")
        print(result.stdout)
        if result.stderr:
            print("Errors:")
            print(result.stderr)
            
        if result.returncode == 0:
            print("✅ Migrations applied successfully!")
        else:
            print("❌ Migration failed")
            
    except Exception as e:
        print(f"Error applying migrations: {e}")
    
    # Test 4: Final status check
    print("\n4. Final migration status check...")
    try:
        result = subprocess.run([
            sys.executable, 'manage.py', 'showmigrations', 'api'
        ], capture_output=True, text=True, timeout=30)
        
        print("Final status:")
        print(result.stdout)
        if result.stderr:
            print("Errors:")
            print(result.stderr)
    except Exception as e:
        print(f"Error in final check: {e}")
    
    print("\n" + "=" * 80)
    print("VERIFICATION COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    main()
