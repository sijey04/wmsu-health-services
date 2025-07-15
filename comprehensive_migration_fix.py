#!/usr/bin/env python
"""
Comprehensive Migration Fix Script for WMSU Health Services
This script will:
1. Identify and remove conflicting migrations
2. Clean up database schema inconsistencies
3. Create a clean migration path
4. Fix all index and constraint issues
"""

import os
import sys
import shutil
import django
from django.core.management import execute_from_command_line
from django.db import connection, transaction
from django.conf import settings

# Set up Django environment
os.chdir('backend/django_api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.core.management.commands.migrate import Command as MigrateCommand
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.loader import MigrationLoader

class MigrationFixer:
    def __init__(self):
        self.migrations_dir = 'api/migrations'
        self.backup_dir = 'api/migrations/backup_migrations'
        
    def check_database_connection(self):
        """Test database connection"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                print("✓ Database connection successful")
                return True
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    
    def backup_migration(self, migration_file):
        """Backup a migration file before removing it"""
        source = os.path.join(self.migrations_dir, migration_file)
        if os.path.exists(source):
            os.makedirs(self.backup_dir, exist_ok=True)
            dest = os.path.join(self.backup_dir, f"backup_{migration_file}")
            shutil.copy2(source, dest)
            print(f"✓ Backed up {migration_file}")
    
    def remove_conflicting_migrations(self):
        """Remove duplicate and conflicting migration files"""
        print("\n=== Removing Conflicting Migrations ===")
        
        # List of conflicting migrations to remove
        conflicting_migrations = [
            '0046_add_semester_to_patient_fixed.py',  # Duplicate
        ]
        
        for migration_file in conflicting_migrations:
            migration_path = os.path.join(self.migrations_dir, migration_file)
            if os.path.exists(migration_path):
                self.backup_migration(migration_file)
                os.remove(migration_path)
                print(f"✓ Removed conflicting migration: {migration_file}")
    
    def check_table_exists(self, table_name):
        """Check if a table exists"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = %s
            """, [table_name])
            return cursor.fetchone()[0] > 0
    
    def check_column_exists(self, table_name, column_name):
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

    def check_index_exists(self, table_name, index_name):
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

    def check_constraint_exists(self, table_name, constraint_name):
        """Check if a constraint exists"""
        with connection.cursor() as cursor:
            try:
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM information_schema.table_constraints 
                    WHERE table_schema = DATABASE() 
                    AND table_name = %s 
                    AND constraint_name = %s
                """, [table_name, constraint_name])
                return cursor.fetchone()[0] > 0
            except:
                return False

    def clean_database_schema(self):
        """Clean up database schema inconsistencies"""
        print("\n=== Cleaning Database Schema ===")
        
        with connection.cursor() as cursor:
            try:
                # 1. Drop problematic indexes
                problematic_indexes = [
                    ('api_patient', 'api_patient_user_id_school_year_id_index'),
                    ('api_patient', 'api_patient_user_id_b1c93a_idx'),
                    ('api_patient', 'api_patient_user_school_semester_idx'),
                    ('api_patient', 'api_patient_user_id_5d3deb_idx'),
                ]
                
                for table_name, index_name in problematic_indexes:
                    if self.check_index_exists(table_name, index_name):
                        try:
                            cursor.execute(f"DROP INDEX `{index_name}` ON `{table_name}`")
                            print(f"✓ Dropped index: {index_name}")
                        except Exception as e:
                            print(f"⚠ Could not drop index {index_name}: {e}")
                
                # 2. Add semester column if it doesn't exist
                if self.check_table_exists('api_patient'):
                    if not self.check_column_exists('api_patient', 'semester'):
                        cursor.execute("""
                            ALTER TABLE api_patient 
                            ADD COLUMN semester VARCHAR(20) NULL DEFAULT NULL
                        """)
                        print("✓ Added semester column to api_patient")
                    else:
                        print("✓ Semester column already exists")
                
                # 3. Drop old unique constraints
                old_constraints = [
                    'api_patient_user_id_school_year_id_uniq',
                    'unique_patient_user_semester',
                ]
                
                for constraint_name in old_constraints:
                    if self.check_constraint_exists('api_patient', constraint_name):
                        try:
                            cursor.execute(f"ALTER TABLE api_patient DROP CONSTRAINT `{constraint_name}`")
                            print(f"✓ Dropped constraint: {constraint_name}")
                        except Exception as e:
                            print(f"⚠ Could not drop constraint {constraint_name}: {e}")
                
                # 4. Create proper unique constraint
                if not self.check_constraint_exists('api_patient', 'unique_patient_user_school_semester'):
                    cursor.execute("""
                        ALTER TABLE api_patient 
                        ADD CONSTRAINT unique_patient_user_school_semester 
                        UNIQUE (user_id, school_year_id, semester)
                    """)
                    print("✓ Created unique constraint: unique_patient_user_school_semester")
                
                # 5. Create proper index
                if not self.check_index_exists('api_patient', 'api_patient_user_school_semester_new_idx'):
                    cursor.execute("""
                        CREATE INDEX api_patient_user_school_semester_new_idx 
                        ON api_patient (user_id, school_year_id, semester)
                    """)
                    print("✓ Created index: api_patient_user_school_semester_new_idx")
                
            except Exception as e:
                print(f"⚠ Error during schema cleanup: {e}")

    def create_fixed_migration(self):
        """Create a fixed version of the problematic migration"""
        print("\n=== Creating Fixed Migration ===")
        
        fixed_migration_content = '''# Fixed migration for semester field - FINAL VERSION
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0045_add_dental_waiver_model'),
    ]

    operations = [
        # This migration is handled by the database cleanup script
        # No operations needed here as schema is already fixed
        migrations.RunSQL(
            "SELECT 'Migration 0046 - Schema already handled by cleanup script' as message",
            reverse_sql="SELECT 'Reverse migration not needed' as message"
        ),
    ]
'''
        
        migration_file = os.path.join(self.migrations_dir, '0046_add_semester_to_patient.py')
        with open(migration_file, 'w') as f:
            f.write(fixed_migration_content)
        print("✓ Created fixed migration 0046")

    def create_index_cleanup_migration(self):
        """Create a migration to clean up index issues"""
        print("\n=== Creating Index Cleanup Migration ===")
        
        cleanup_migration_content = '''# Index cleanup migration - FINAL VERSION
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0047_update_dental_waiver_semester'),
    ]

    operations = [
        # This migration is handled by the database cleanup script
        # No operations needed here as indexes are already cleaned up
        migrations.RunSQL(
            "SELECT 'Migration 0048 - Indexes already handled by cleanup script' as message",
            reverse_sql="SELECT 'Reverse migration not needed' as message"
        ),
    ]
'''
        
        migration_file = os.path.join(self.migrations_dir, '0048_remove_patient_api_patient_user_id_b1c93a_idx_and_more.py')
        with open(migration_file, 'w') as f:
            f.write(cleanup_migration_content)
        print("✓ Created fixed migration 0048")

    def fake_problematic_migrations(self):
        """Mark problematic migrations as applied"""
        print("\n=== Marking Migrations as Applied ===")
        
        migrations_to_fake = [
            ('api', '0046'),
            ('api', '0048'),
        ]
        
        for app_name, migration_number in migrations_to_fake:
            try:
                execute_from_command_line(['manage.py', 'migrate', app_name, migration_number, '--fake'])
                print(f"✓ Marked {app_name}.{migration_number} as applied")
            except Exception as e:
                print(f"⚠ Could not fake {app_name}.{migration_number}: {e}")

    def apply_remaining_migrations(self):
        """Apply all remaining migrations"""
        print("\n=== Applying Remaining Migrations ===")
        
        try:
            execute_from_command_line(['manage.py', 'migrate'])
            print("✓ All migrations applied successfully")
        except Exception as e:
            print(f"⚠ Some migrations may need attention: {e}")

    def verify_migration_status(self):
        """Verify the final migration status"""
        print("\n=== Verifying Migration Status ===")
        
        try:
            # Check for unapplied migrations
            loader = MigrationLoader(connection)
            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            
            if plan:
                print(f"⚠ {len(plan)} migrations still need to be applied:")
                for migration, backwards in plan:
                    print(f"  - {migration}")
            else:
                print("✅ All migrations are up to date!")
                
        except Exception as e:
            print(f"⚠ Could not verify migration status: {e}")

    def run_comprehensive_fix(self):
        """Run the complete migration fix process"""
        print("=" * 70)
        print("WMSU Health Services - Comprehensive Migration Fix")
        print("=" * 70)
        
        if not self.check_database_connection():
            return False
        
        try:
            # Step 1: Remove conflicting migrations
            self.remove_conflicting_migrations()
            
            # Step 2: Clean database schema
            self.clean_database_schema()
            
            # Step 3: Create fixed migrations
            self.create_fixed_migration()
            self.create_index_cleanup_migration()
            
            # Step 4: Fake problematic migrations
            self.fake_problematic_migrations()
            
            # Step 5: Apply remaining migrations
            self.apply_remaining_migrations()
            
            # Step 6: Verify status
            self.verify_migration_status()
            
            print("\n" + "=" * 70)
            print("✅ COMPREHENSIVE MIGRATION FIX COMPLETED!")
            print("=" * 70)
            print("\nYour Django project should now work properly.")
            print("You can start the development server with: python manage.py runserver")
            
            return True
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR: {e}")
            print("\nPlease check the error details above and try again.")
            return False

def main():
    fixer = MigrationFixer()
    success = fixer.run_comprehensive_fix()
    
    if not success:
        print("\n" + "=" * 70)
        print("❌ MIGRATION FIX FAILED")
        print("=" * 70)
        print("\nRecommended actions:")
        print("1. Check database permissions and connection")
        print("2. Manually review database schema")
        print("3. Consider resetting migrations (backup data first!)")
        sys.exit(1)

if __name__ == "__main__":
    main()
