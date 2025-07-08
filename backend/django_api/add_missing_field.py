#!/usr/bin/env python
import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.db import connection

def add_missing_field():
    """Add the missing hospital_admission_details field to Patient table"""
    cursor = connection.cursor()
    
    try:
        # Check if the column already exists
        cursor.execute("SHOW COLUMNS FROM api_patient LIKE 'hospital_admission_details';")
        result = cursor.fetchone()
        
        if result:
            print("Column 'hospital_admission_details' already exists.")
            return
        
        # Add the missing column
        sql = """
        ALTER TABLE api_patient 
        ADD COLUMN hospital_admission_details TEXT NULL 
        COMMENT 'Details of hospital admission or surgery when answer is Yes';
        """
        
        cursor.execute(sql)
        print("Successfully added 'hospital_admission_details' column to api_patient table.")
        
    except Exception as e:
        print(f"Error adding column: {e}")
    
    finally:
        cursor.close()

if __name__ == "__main__":
    add_missing_field()
