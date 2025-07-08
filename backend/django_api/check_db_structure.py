#!/usr/bin/env python
import os
import sys
import django

# Add the Django project to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.db import connection

def check_table_structure():
    print("Checking MedicalDocument table structure...")
    
    with connection.cursor() as cursor:
        # Show table structure
        cursor.execute("DESCRIBE api_medicaldocument;")
        columns = cursor.fetchall()
        
        print("Columns in api_medicaldocument:")
        for column in columns:
            print(f"  {column[0]} - {column[1]} - Null: {column[2]} - Key: {column[3]} - Default: {column[4]}")
        
        # Check if academic_year_id column exists
        column_names = [col[0] for col in columns]
        if 'academic_year_id' in column_names:
            print("\n✅ academic_year_id column EXISTS in the table")
        else:
            print("\n❌ academic_year_id column MISSING from the table")
            print("Adding the column manually...")
            try:
                cursor.execute("ALTER TABLE api_medicaldocument ADD COLUMN academic_year_id INTEGER NULL;")
                print("✅ academic_year_id column added successfully")
            except Exception as e:
                print(f"❌ Error adding column: {e}")

if __name__ == "__main__":
    check_table_structure()
