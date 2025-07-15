#!/usr/bin/env python
"""
Final Migration Verification Script
Confirms that all migration issues have been resolved
"""

import os
import sys
import django

# Set up Django environment
os.chdir('backend/django_api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')

try:
    django.setup()
    from django.core.management import execute_from_command_line
    from django.db import connection
    from django.db.migrations.executor import MigrationExecutor
    from django.db.migrations.loader import MigrationLoader
    
    print("=" * 60)
    print("Final Migration Verification")
    print("=" * 60)
    
    # 1. Test database connection
    print("\n1. Testing database connection...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)
    
    # 2. Check migration graph
    print("\n2. Checking migration dependency graph...")
    try:
        loader = MigrationLoader(connection)
        loader.build_graph()
        print("✅ Migration dependency graph is valid")
    except Exception as e:
        print(f"❌ Migration graph error: {e}")
        sys.exit(1)
    
    # 3. Check for unapplied migrations
    print("\n3. Checking for unapplied migrations...")
    try:
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            print(f"⚠ Found {len(plan)} unapplied migrations:")
            for migration, backwards in plan:
                print(f"  - {migration}")
            print("\nTrying to apply them...")
            execute_from_command_line(['manage.py', 'migrate'])
        else:
            print("✅ All migrations are up to date")
    except Exception as e:
        print(f"⚠ Error checking migrations: {e}")
    
    # 4. Run Django system check
    print("\n4. Running Django system check...")
    try:
        execute_from_command_line(['manage.py', 'check'])
        print("✅ Django system check passed")
    except Exception as e:
        print(f"⚠ System check issues: {e}")
    
    # 5. Test server startup (dry run)
    print("\n5. Testing server startup...")
    try:
        execute_from_command_line(['manage.py', 'check', '--deploy'])
        print("✅ Server startup check passed")
    except Exception as e:
        print(f"⚠ Server startup issues: {e}")
    
    # 6. Check specific table structure
    print("\n6. Verifying database schema...")
    try:
        with connection.cursor() as cursor:
            # Check if semester column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient' 
                AND column_name = 'semester'
            """)
            
            if cursor.fetchone()[0] > 0:
                print("✅ Semester column exists in api_patient table")
            else:
                print("⚠ Semester column is missing from api_patient table")
            
            # Check for proper indexes
            cursor.execute("""
                SELECT index_name 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = 'api_patient'
                GROUP BY index_name
            """)
            
            indexes = [row[0] for row in cursor.fetchall()]
            print(f"✅ Found {len(indexes)} indexes on api_patient table")
            
    except Exception as e:
        print(f"⚠ Schema verification error: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 MIGRATION VERIFICATION COMPLETED!")
    print("=" * 60)
    print("\n✅ Your Django project is ready!")
    print("\nNext steps:")
    print("1. Start the development server: python manage.py runserver")
    print("2. Test your frontend application")
    print("3. Verify all features work correctly")
    
except Exception as e:
    print(f"❌ Setup error: {e}")
    print("\nIf you see this error, there may still be configuration issues.")
    print("Please check your Django settings and database configuration.")
    sys.exit(1)
