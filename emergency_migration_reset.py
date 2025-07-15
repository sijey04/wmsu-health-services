#!/usr/bin/env python
"""
Emergency Migration Reset Script
Use this ONLY if the migration fix doesn't work and you need to reset migrations
WARNING: This will delete migration history but preserve data
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.db import connection

# Set up Django environment
os.chdir('backend/django_api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

def emergency_reset():
    print("⚠️  EMERGENCY MIGRATION RESET")
    print("=" * 50)
    print("This will:")
    print("1. Delete all migration records from django_migrations table")
    print("2. Mark initial migration as applied")
    print("3. Create squashed migration for current state")
    print("⚠️  USE WITH EXTREME CAUTION!")
    
    response = input("\nAre you sure you want to proceed? (type 'YES' to continue): ")
    if response != 'YES':
        print("Operation cancelled.")
        return
    
    try:
        # Step 1: Clear migration history
        print("\n1. Clearing migration history...")
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM django_migrations WHERE app = 'api'")
            print("✓ Migration history cleared")
        
        # Step 2: Mark initial migration as applied
        print("\n2. Marking initial migration as applied...")
        execute_from_command_line(['manage.py', 'migrate', 'api', '0001', '--fake'])
        print("✓ Initial migration marked as applied")
        
        # Step 3: Create and apply fake migrations for current state
        print("\n3. Faking migrations to current state...")
        
        # Get list of migration files
        migrations_dir = 'api/migrations'
        migration_files = [f for f in os.listdir(migrations_dir) if f.endswith('.py') and f != '__init__.py']
        migration_files.sort()
        
        for migration_file in migration_files[1:]:  # Skip 0001_initial.py
            migration_name = migration_file.replace('.py', '')
            try:
                execute_from_command_line(['manage.py', 'migrate', 'api', migration_name, '--fake'])
                print(f"✓ Faked migration {migration_name}")
            except Exception as e:
                print(f"⚠ Could not fake {migration_name}: {e}")
        
        # Step 4: Verify current state
        print("\n4. Verifying current state...")
        execute_from_command_line(['manage.py', 'showmigrations'])
        
        print("\n✅ EMERGENCY RESET COMPLETED")
        print("All migrations should now be marked as applied.")
        print("Your database structure remains unchanged.")
        
    except Exception as e:
        print(f"\n❌ ERROR during emergency reset: {e}")
        print("You may need to manually fix the database.")

if __name__ == "__main__":
    emergency_reset()
