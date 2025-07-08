#!/usr/bin/env python
"""
Direct database migration check and fix
This script will check the database state and apply fixes directly
"""

import os
import sys
import django

# Add the Django project to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.db import connection, transaction
from django.core.management import call_command
from api.models import MedicalDocument, AcademicSchoolYear

def check_database_state():
    """Check the current database state"""
    print("Checking database state...")
    
    try:
        with connection.cursor() as cursor:
            # Check if academic_year_id column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = 'api_medicaldocument' 
                AND column_name = 'academic_year_id'
            """)
            column_exists = cursor.fetchone()[0] > 0
            
            print(f"academic_year_id column exists: {column_exists}")
            
            if not column_exists:
                print("Need to add academic_year_id column")
                return False
            else:
                print("Column already exists")
                return True
                
    except Exception as e:
        print(f"Error checking database: {e}")
        return False

def add_academic_year_column():
    """Add the academic_year_id column directly"""
    print("Adding academic_year_id column...")
    
    try:
        with connection.cursor() as cursor:
            # Add the column
            cursor.execute("""
                ALTER TABLE api_medicaldocument 
                ADD COLUMN academic_year_id INTEGER NULL
            """)
            print("✅ Added academic_year_id column")
            
            # Add the foreign key constraint
            cursor.execute("""
                ALTER TABLE api_medicaldocument 
                ADD CONSTRAINT fk_medicaldocument_academic_year 
                FOREIGN KEY (academic_year_id) 
                REFERENCES api_academicschoolyear(id)
            """)
            print("✅ Added foreign key constraint")
            
            return True
            
    except Exception as e:
        print(f"Error adding column: {e}")
        return False

def test_orm_functionality():
    """Test if ORM functionality works"""
    print("Testing ORM functionality...")
    
    try:
        # Test basic queries
        doc_count = MedicalDocument.objects.count()
        print(f"✅ MedicalDocument count: {doc_count}")
        
        year_count = AcademicSchoolYear.objects.count()
        print(f"✅ AcademicSchoolYear count: {year_count}")
        
        # Test accessing academic_year field
        if doc_count > 0:
            first_doc = MedicalDocument.objects.first()
            academic_year = first_doc.academic_year
            print(f"✅ First document academic_year: {academic_year}")
        
        return True
        
    except Exception as e:
        print(f"❌ ORM test failed: {e}")
        return False

def ensure_current_academic_year():
    """Ensure there's a current academic year"""
    print("Ensuring current academic year exists...")
    
    try:
        current_year = AcademicSchoolYear.objects.filter(is_current=True).first()
        
        if not current_year:
            from datetime import datetime
            current_year = AcademicSchoolYear.objects.create(
                academic_year=f"{datetime.now().year}-{datetime.now().year + 1}",
                is_current=True
            )
            print(f"✅ Created current academic year: {current_year.academic_year}")
        else:
            print(f"✅ Current academic year exists: {current_year.academic_year}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error with academic year: {e}")
        return False

def run_django_migrations():
    """Run Django migrations programmatically"""
    print("Running Django migrations...")
    
    try:
        # Run makemigrations
        call_command('makemigrations', verbosity=2)
        print("✅ makemigrations completed")
        
        # Run migrate
        call_command('migrate', verbosity=2)
        print("✅ migrate completed")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        return False

def main():
    """Main migration function"""
    print("=" * 60)
    print("DIRECT DATABASE MIGRATION AND FIX")
    print("=" * 60)
    
    # Step 1: Check database state
    column_exists = check_database_state()
    
    # Step 2: If column doesn't exist, try migrations first
    if not column_exists:
        print("\nTrying Django migrations...")
        if run_django_migrations():
            # Check again after migrations
            column_exists = check_database_state()
    
    # Step 3: If still no column, add it directly
    if not column_exists:
        print("\nAdding column directly...")
        if add_academic_year_column():
            column_exists = True
    
    # Step 4: Test ORM functionality
    if column_exists:
        print("\nTesting ORM functionality...")
        test_orm_functionality()
        
        # Step 5: Ensure academic year exists
        ensure_current_academic_year()
        
        print("\n" + "=" * 60)
        print("SUCCESS! Database is ready")
        print("=" * 60)
        print("The academic_year_id column is now available")
        print("You can now restart your Django server")
        print("The system will use full ORM functionality")
        
    else:
        print("\n" + "=" * 60)
        print("FAILED! Could not add column")
        print("=" * 60)
        print("Please check your database permissions")
        print("Or run migrations manually")

if __name__ == "__main__":
    main()
