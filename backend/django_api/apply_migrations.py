#!/usr/bin/env python
"""
Apply Django migrations for WMSU Health Services
This script will apply all pending migrations to fix the database schema
"""

import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line

def setup_django():
    """Set up Django environment"""
    # Add the Django project to the path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
    django.setup()

def apply_migrations():
    """Apply all pending migrations"""
    print("=" * 60)
    print("APPLYING DJANGO MIGRATIONS")
    print("=" * 60)
    
    try:
        # First, check for any pending migrations
        print("\n1. Checking for pending migrations...")
        execute_from_command_line(['manage.py', 'showmigrations', '--plan'])
        
        # Make any new migrations if model changes exist
        print("\n2. Creating new migrations if needed...")
        execute_from_command_line(['manage.py', 'makemigrations'])
        
        # Apply all migrations
        print("\n3. Applying migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        print("\n✅ Migrations applied successfully!")
        
        # Verify the academic_year_id column exists
        print("\n4. Verifying database schema...")
        verify_schema()
        
    except Exception as e:
        print(f"\n❌ Error applying migrations: {e}")
        return False
    
    return True

def verify_schema():
    """Verify that the academic_year_id column exists"""
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Check if the column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = 'api_medicaldocument' 
                AND column_name = 'academic_year_id'
            """)
            column_exists = cursor.fetchone()[0] > 0
            
            if column_exists:
                print("✅ academic_year_id column exists in database")
                
                # Test ORM access
                from api.models import MedicalDocument
                count = MedicalDocument.objects.count()
                print(f"✅ MedicalDocument ORM works: {count} records")
                
            else:
                print("❌ academic_year_id column still missing")
                print("   You may need to run migrations manually or check for conflicts")
                
    except Exception as e:
        print(f"❌ Error verifying schema: {e}")

def main():
    """Main function to apply migrations"""
    print("Django Migration Application Script")
    print("This will apply all pending migrations to fix the database schema")
    print()
    
    # Set up Django
    setup_django()
    
    # Apply migrations
    success = apply_migrations()
    
    if success:
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETE!")
        print("=" * 60)
        print("The academic_year_id column should now be available.")
        print("The system will now use full ORM functionality.")
        print()
        print("Next steps:")
        print("1. Restart your Django server")
        print("2. Test the API endpoints")
        print("3. Verify the frontend works correctly")
    else:
        print("\n" + "=" * 60)
        print("MIGRATION FAILED!")
        print("=" * 60)
        print("Please check the error messages above.")
        print("You may need to resolve migration conflicts manually.")

if __name__ == "__main__":
    main()