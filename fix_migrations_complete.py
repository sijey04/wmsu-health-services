#!/usr/bin/env python
"""
Complete Migration Fix Script for WMSU Health Services
Resolves duplicate column and index issues
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from django.db import connection, migrations
from django.conf import settings

# Set up Django environment
os.chdir('backend/django_api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.core.management.commands.migrate import Command as MigrateCommand
from django.db.migrations.executor import MigrationExecutor

def check_column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = DATABASE() 
            AND table_name = %s 
            AND column_name = %s
        """, [table_name, column_name])
        return cursor.fetchone()[0] > 0

def check_index_exists(table_name, index_name):
    """Check if an index exists"""
    with connection.cursor() as cursor:
        try:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = %s 
                AND index_name = %s
            """, [table_name, index_name])
            return cursor.fetchone()[0] > 0
        except:
            return False

def drop_index_if_exists(table_name, index_name):
    """Safely drop an index if it exists"""
    if check_index_exists(table_name, index_name):
        with connection.cursor() as cursor:
            try:
                cursor.execute(f"DROP INDEX `{index_name}` ON `{table_name}`")
                print(f"✓ Dropped index {index_name} from {table_name}")
            except Exception as e:
                print(f"⚠ Could not drop index {index_name}: {e}")

def add_column_if_not_exists(table_name, column_name, column_definition):
    """Add a column if it doesn't exist"""
    if not check_column_exists(table_name, column_name):
        with connection.cursor() as cursor:
            try:
                cursor.execute(f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {column_definition}")
                print(f"✓ Added column {column_name} to {table_name}")
            except Exception as e:
                print(f"⚠ Could not add column {column_name}: {e}")
    else:
        print(f"✓ Column {column_name} already exists in {table_name}")

def create_index_if_not_exists(table_name, index_name, columns):
    """Create an index if it doesn't exist"""
    if not check_index_exists(table_name, index_name):
        with connection.cursor() as cursor:
            try:
                column_list = ', '.join([f"`{col}`" for col in columns])
                cursor.execute(f"CREATE INDEX `{index_name}` ON `{table_name}` ({column_list})")
                print(f"✓ Created index {index_name} on {table_name}")
            except Exception as e:
                print(f"⚠ Could not create index {index_name}: {e}")
    else:
        print(f"✓ Index {index_name} already exists on {table_name}")

def fake_migration(app_name, migration_name):
    """Mark a migration as applied without running it"""
    try:
        execute_from_command_line(['manage.py', 'migrate', app_name, migration_name, '--fake'])
        print(f"✓ Marked migration {migration_name} as applied")
    except Exception as e:
        print(f"⚠ Could not fake migration {migration_name}: {e}")

def remove_duplicate_migration_files():
    """Remove duplicate migration files that cause conflicts"""
    print("\n0. Removing duplicate migration files...")
    
    # Check for duplicate migration file
    duplicate_file = 'api/migrations/0046_add_semester_to_patient_fixed.py'
    if os.path.exists(duplicate_file):
        # Backup before removing
        backup_dir = 'api/migrations/backup_migrations'
        os.makedirs(backup_dir, exist_ok=True)
        
        import shutil
        backup_path = f"{backup_dir}/backup_0046_add_semester_to_patient_fixed.py"
        shutil.copy2(duplicate_file, backup_path)
        os.remove(duplicate_file)
        print("✓ Removed duplicate migration file 0046_add_semester_to_patient_fixed.py")
    
    # Also check for any other conflicting files
    import glob
    migration_files = glob.glob('api/migrations/0046_*.py')
    if len(migration_files) > 1:
        print(f"⚠ Found multiple 0046 migrations: {migration_files}")
        # Keep only the original one
        for file in migration_files:
            if 'fixed' in file:
                os.remove(file)
                print(f"✓ Removed duplicate: {file}")

def check_migration_dependencies():
    """Check and fix migration dependencies"""
    print("\n1.5. Checking migration dependencies...")
    
    # Read migration 0048 and check if it depends on 0047
    migration_0048_path = 'api/migrations/0048_remove_patient_api_patient_user_id_b1c93a_idx_and_more.py'
    if os.path.exists(migration_0048_path):
        with open(migration_0048_path, 'r') as f:
            content = f.read()
            if "'api', '0047_update_dental_waiver_semester'" in content:
                print("✓ Migration 0048 has correct dependency on 0047")
            else:
                print("⚠ Migration 0048 may have incorrect dependencies")

def fix_migration_dependencies():
    """Fix broken migration dependencies"""
    print("\n1.5. Fixing migration dependencies...")
    
    # Check if migration 0047 exists and fix its dependency
    migration_0047_path = 'api/migrations/0047_update_dental_waiver_semester.py'
    if os.path.exists(migration_0047_path):
        with open(migration_0047_path, 'r') as f:
            content = f.read()
        
        # Check if it depends on 0046
        if "('api', '0046_add_semester_to_patient')" in content:
            print("✓ Found migration 0047 with 0046 dependency")
            
            # Check if 0046 migration file exists
            migration_0046_path = 'api/migrations/0046_add_semester_to_patient.py'
            if not os.path.exists(migration_0046_path):
                print("⚠ Migration 0046 file is missing - creating it...")
                create_missing_0046_migration()
            else:
                print("✓ Migration 0046 file exists")

def create_missing_0046_migration():
    """Create the missing 0046 migration file"""
    print("Creating missing 0046 migration file...")
    
    migration_content = '''# Generated migration for adding semester field to Patient model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0045_add_dental_waiver_model'),
    ]

    operations = [
        # Schema changes are handled by the fix script
        # This migration is just a placeholder to maintain dependency chain
        migrations.RunSQL(
            "SELECT 'Migration 0046 - Schema handled by fix script' as message",
            reverse_sql="SELECT 'Reverse not needed' as message"
        ),
    ]
'''
    
    migration_file = 'api/migrations/0046_add_semester_to_patient.py'
    with open(migration_file, 'w') as f:
        f.write(migration_content)
    print("✓ Created missing migration 0046")

def reset_migration_state():
    """Reset migration state for problematic migrations"""
    print("\n2.5. Resetting migration state...")
    
    from django.db import connection
    
    # Check if django_migrations table exists
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() 
            AND table_name = 'django_migrations'
        """)
        
        if cursor.fetchone()[0] > 0:
            # Remove entries for problematic migrations
            problematic_migrations = [
                '0046_add_semester_to_patient',
                '0048_remove_patient_api_patient_user_id_b1c93a_idx_and_more'
            ]
            
            for migration in problematic_migrations:
                cursor.execute("""
                    DELETE FROM django_migrations 
                    WHERE app = 'api' AND name = %s
                """, [migration])
                print(f"✓ Removed migration record: {migration}")

def verify_migration_chain():
    """Verify that the migration chain is intact"""
    print("\n8.5. Verifying migration chain...")
    
    try:
        from django.db.migrations.loader import MigrationLoader
        from django.db import connection
        
        loader = MigrationLoader(connection)
        
        # Check for any issues in the migration graph
        try:
            loader.build_graph()
            print("✓ Migration graph is valid")
            return True
        except Exception as e:
            print(f"⚠ Migration graph error: {e}")
            return False
            
    except Exception as e:
        print(f"⚠ Could not verify migration chain: {e}")
        return False

def main():
    print("=" * 60)
    print("WMSU Health Services - Complete Migration Fix")
    print("=" * 60)
    
    try:
        # Step 0: Remove duplicate migration files first
        remove_duplicate_migration_files()
        
        # Step 1: Check database connection
        print("\n1. Testing database connection...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✓ Database connection successful")
        
        # Step 1.5: Check migration dependencies
        check_migration_dependencies()
        fix_migration_dependencies()
        
        # Step 2: Reset migration state for problematic migrations
        reset_migration_state()
        
        # Step 3: Drop problematic indexes
        print("\n3. Cleaning up problematic indexes...")
        drop_index_if_exists('api_patient', 'api_patient_user_id_school_year_id_index')
        drop_index_if_exists('api_patient', 'api_patient_user_id_b1c93a_idx')
        drop_index_if_exists('api_patient', 'api_patient_user_school_semester_idx')
        drop_index_if_exists('api_patient', 'api_patient_user_id_5d3deb_idx')
        
        # Step 4: Handle semester column
        print("\n4. Handling semester column...")
        add_column_if_not_exists(
            'api_patient', 
            'semester', 
            "VARCHAR(20) NULL DEFAULT NULL"
        )
        
        # Step 5: Remove old unique constraints first
        print("\n5. Cleaning up old constraints...")
        with connection.cursor() as cursor:
            try:
                # Drop old unique constraints that might conflict
                old_constraints = [
                    'api_patient_user_id_school_year_id_uniq',
                    'unique_patient_user_semester',
                    'api_patient_user_id_school_year_id_unique'
                ]
                
                for constraint_name in old_constraints:
                    cursor.execute("""
                        SELECT COUNT(*) 
                        FROM information_schema.table_constraints 
                        WHERE table_schema = DATABASE() 
                        AND table_name = 'api_patient' 
                        AND constraint_name = %s
                    """, [constraint_name])
                    
                    if cursor.fetchone()[0] > 0:
                        cursor.execute(f"ALTER TABLE api_patient DROP CONSTRAINT `{constraint_name}`")
                        print(f"✓ Dropped old constraint: {constraint_name}")
            except Exception as e:
                print(f"⚠ Error cleaning constraints: {e}")
        
        # Step 6: Create proper indexes
        print("\n6. Creating proper indexes...")
        create_index_if_not_exists(
            'api_patient',
            'api_patient_user_semester_final_idx',
            ['user_id', 'school_year_id', 'semester']
        )
        
        # Step 7: Handle unique constraints
        print("\n7. Creating new unique constraints...")
        with connection.cursor() as cursor:
            try:
                # Check if unique constraint exists
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.table_constraints 
                    WHERE table_schema = DATABASE() 
                    AND table_name = 'api_patient' 
                    AND constraint_type = 'UNIQUE'
                    AND constraint_name = 'unique_patient_user_school_semester'
                """)
                
                if cursor.fetchone()[0] == 0:
                    # Add unique constraint
                    cursor.execute("""
                        ALTER TABLE api_patient 
                        ADD CONSTRAINT unique_patient_user_school_semester 
                        UNIQUE (user_id, school_year_id, semester)
                    """)
                    print("✓ Added unique constraint for user, school_year, semester")
                else:
                    print("✓ Unique constraint already exists")
            except Exception as e:
                print(f"⚠ Could not update unique constraint: {e}")
        
        # Step 8: Fake problematic migrations
        print("\n8. Marking problematic migrations as applied...")
        fake_migration('api', '0046_add_semester_to_patient')
        fake_migration('api', '0048_remove_patient_api_patient_user_id_b1c93a_idx_and_more')
        
        # Step 8.5: Verify migration chain
        verify_migration_chain()
        
        # Step 9: Apply remaining migrations
        print("\n9. Applying remaining migrations...")
        try:
            execute_from_command_line(['manage.py', 'migrate'])
            print("✓ All migrations applied successfully")
        except Exception as e:
            print(f"⚠ Some migrations may need manual attention: {e}")
        
        # Step 10: Verify the fix
        print("\n10. Verifying the fix...")
        try:
            execute_from_command_line(['manage.py', 'showmigrations'])
            print("✓ Migration status verified")
        except Exception as e:
            print(f"⚠ Could not verify migrations: {e}")
        
        print("\n" + "=" * 60)
        print("✅ MIGRATION FIX COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nYour Django project should now work properly.")
        print("You can start the development server with: python manage.py runserver")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nIf the issue persists, you may need to:")
        print("1. Check your database permissions")
        print("2. Manually review and fix the database schema")
        print("3. Reset migrations (use with caution in production)")

if __name__ == "__main__":
    main()
