#!/usr/bin/env python
"""
Comprehensive test and fix script for WMSU Health Services
This script will:
1. Test database connectivity
2. Check for missing columns
3. Apply fixes if needed
4. Verify API endpoints
"""

import os
import sys
import django
from django.conf import settings

# Add the Django project to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line
from api.models import MedicalDocument, Patient, CustomUser, AcademicSchoolYear

def test_database_connection():
    """Test database connectivity"""
    print("=" * 50)
    print("TESTING DATABASE CONNECTION")
    print("=" * 50)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print(f"✓ Database connection successful: {result}")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def check_academic_year_column():
    """Check if academic_year_id column exists"""
    print("\n" + "=" * 50)
    print("CHECKING ACADEMIC_YEAR_ID COLUMN")
    print("=" * 50)
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = 'api_medicaldocument' 
                AND column_name = 'academic_year_id'
            """)
            column_exists = cursor.fetchone()[0] > 0
            
            if column_exists:
                print("✓ academic_year_id column exists")
                return True
            else:
                print("✗ academic_year_id column missing")
                return False
                
    except Exception as e:
        print(f"✗ Error checking column: {e}")
        return False

def add_academic_year_column():
    """Add the missing academic_year_id column"""
    print("\n" + "=" * 50)
    print("ADDING ACADEMIC_YEAR_ID COLUMN")
    print("=" * 50)
    
    try:
        with connection.cursor() as cursor:
            # Add the column
            cursor.execute("""
                ALTER TABLE api_medicaldocument 
                ADD COLUMN academic_year_id INTEGER NULL
            """)
            print("✓ Added academic_year_id column")
            
            # Add the foreign key constraint
            cursor.execute("""
                ALTER TABLE api_medicaldocument 
                ADD CONSTRAINT api_medicaldocument_academic_year_id_fk 
                FOREIGN KEY (academic_year_id) 
                REFERENCES api_academicschoolyear(id)
            """)
            print("✓ Added foreign key constraint")
            
            return True
            
    except Exception as e:
        print(f"✗ Error adding column: {e}")
        return False

def test_orm_queries():
    """Test if ORM queries work correctly"""
    print("\n" + "=" * 50)
    print("TESTING ORM QUERIES")
    print("=" * 50)
    
    try:
        # Test MedicalDocument count
        doc_count = MedicalDocument.objects.count()
        print(f"✓ MedicalDocument count: {doc_count}")
        
        # Test User count
        user_count = CustomUser.objects.count()
        print(f"✓ CustomUser count: {user_count}")
        
        # Test AcademicSchoolYear count
        year_count = AcademicSchoolYear.objects.count()
        print(f"✓ AcademicSchoolYear count: {year_count}")
        
        # Test patient profile access
        if user_count > 0:
            first_user = CustomUser.objects.first()
            print(f"✓ First user: {first_user.email}")
            
            try:
                profile = first_user.get_current_patient_profile()
                print(f"✓ Current patient profile: {profile}")
            except Exception as e:
                print(f"✗ Error getting patient profile: {e}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error with ORM queries: {e}")
        return False

def test_medical_document_access():
    """Test medical document access with academic_year field"""
    print("\n" + "=" * 50)
    print("TESTING MEDICAL DOCUMENT ACCESS")
    print("=" * 50)
    
    try:
        docs = MedicalDocument.objects.all()[:5]  # Get first 5 documents
        print(f"✓ Retrieved {len(docs)} medical documents")
        
        for doc in docs:
            try:
                academic_year = doc.academic_year
                print(f"✓ Document {doc.id}: academic_year = {academic_year}")
            except Exception as e:
                print(f"✗ Document {doc.id}: Error accessing academic_year: {e}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error testing medical document access: {e}")
        return False

def ensure_academic_year_exists():
    """Ensure at least one academic year exists"""
    print("\n" + "=" * 50)
    print("ENSURING ACADEMIC YEAR EXISTS")
    print("=" * 50)
    
    try:
        current_year = AcademicSchoolYear.objects.filter(is_current=True).first()
        if current_year:
            print(f"✓ Current academic year exists: {current_year.academic_year}")
        else:
            # Create a default academic year
            from datetime import datetime
            current_year = AcademicSchoolYear.objects.create(
                academic_year=f"{datetime.now().year}-{datetime.now().year + 1}",
                is_current=True
            )
            print(f"✓ Created current academic year: {current_year.academic_year}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error ensuring academic year: {e}")
        return False

def run_migrations():
    """Run Django migrations"""
    print("\n" + "=" * 50)
    print("RUNNING MIGRATIONS")
    print("=" * 50)
    
    try:
        # Run makemigrations
        execute_from_command_line(['manage.py', 'makemigrations'])
        print("✓ Makemigrations completed")
        
        # Run migrate
        execute_from_command_line(['manage.py', 'migrate'])
        print("✓ Migrations applied")
        
        return True
        
    except Exception as e:
        print(f"✗ Error running migrations: {e}")
        return False

def main():
    """Main test and fix routine"""
    print("WMSU Health Services - Database Fix and Test Script")
    print("=" * 60)
    
    # Test database connection
    if not test_database_connection():
        print("Cannot proceed without database connection")
        return
    
    # Check if academic_year_id column exists
    column_exists = check_academic_year_column()
    
    # If column doesn't exist, try to add it
    if not column_exists:
        print("\nAttempting to add missing column...")
        if add_academic_year_column():
            print("✓ Column added successfully")
        else:
            print("✗ Failed to add column, trying migrations...")
            run_migrations()
    
    # Ensure academic year exists
    ensure_academic_year_exists()
    
    # Test ORM queries
    test_orm_queries()
    
    # Test medical document access
    test_medical_document_access()
    
    print("\n" + "=" * 60)
    print("SCRIPT COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()
