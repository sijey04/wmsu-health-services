#!/usr/bin/env python
"""
Django shell script to apply migrations
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

# Now run the migration commands
from django.core.management import execute_from_command_line

print("Applying Django migrations...")

# Try to run migrations
try:
    # First check what migrations are available
    print("Checking migration status...")
    execute_from_command_line(['manage.py', 'showmigrations'])
    
    # Make new migrations if needed
    print("Making new migrations...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    
    # Apply migrations
    print("Applying migrations...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    print("Migrations completed successfully!")
    
except Exception as e:
    print(f"Error running migrations: {e}")
    
    # Try direct database approach
    print("Trying direct database approach...")
    from django.db import connection
    
    try:
        with connection.cursor() as cursor:
            # Check if column exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_schema = DATABASE()
                AND table_name = 'api_medicaldocument' 
                AND column_name = 'academic_year_id'
            """)
            column_exists = cursor.fetchone()[0] > 0
            
            if not column_exists:
                print("Adding academic_year_id column directly...")
                cursor.execute("""
                    ALTER TABLE api_medicaldocument 
                    ADD COLUMN academic_year_id INTEGER NULL
                """)
                cursor.execute("""
                    ALTER TABLE api_medicaldocument 
                    ADD CONSTRAINT fk_medicaldocument_academic_year 
                    FOREIGN KEY (academic_year_id) 
                    REFERENCES api_academicschoolyear(id)
                """)
                print("Column added successfully!")
            else:
                print("Column already exists!")
                
    except Exception as e2:
        print(f"Direct database approach failed: {e2}")

# Test the result
print("Testing database access...")
try:
    from api.models import MedicalDocument
    count = MedicalDocument.objects.count()
    print(f"MedicalDocument count: {count}")
    
    if count > 0:
        first_doc = MedicalDocument.objects.first()
        print(f"First document academic_year: {first_doc.academic_year}")
        
except Exception as e:
    print(f"Database test failed: {e}")

print("Migration script completed.")
