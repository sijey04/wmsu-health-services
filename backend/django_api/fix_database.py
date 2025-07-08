#!/usr/bin/env python
import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def check_and_fix_database():
    """Check and fix the database schema"""
    cursor = connection.cursor()
    
    print("Checking database schema...")
    
    try:
        # Check if hospital_admission_details column exists
        cursor.execute("SHOW COLUMNS FROM api_patient LIKE 'hospital_admission_details';")
        result = cursor.fetchone()
        
        if result:
            print("✓ Column 'hospital_admission_details' exists.")
        else:
            print("✗ Column 'hospital_admission_details' missing. Adding it...")
            
            # Add the missing column
            sql = """
            ALTER TABLE api_patient 
            ADD COLUMN hospital_admission_details TEXT NULL 
            COMMENT 'Details of hospital admission or surgery when answer is Yes';
            """
            
            cursor.execute(sql)
            print("✓ Successfully added 'hospital_admission_details' column.")
        
        # Check migration status
        print("\nChecking migration status...")
        try:
            execute_from_command_line(['manage.py', 'showmigrations', 'api'])
        except SystemExit:
            pass
        
        # Apply any pending migrations
        print("\nApplying migrations...")
        try:
            execute_from_command_line(['manage.py', 'migrate', 'api'])
        except SystemExit:
            pass
        
        print("\n✓ Database schema check complete!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        cursor.close()

if __name__ == "__main__":
    check_and_fix_database()
