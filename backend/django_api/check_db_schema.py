#!/usr/bin/env python
import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.db import connection

def check_patient_table():
    """Check the current Patient table structure"""
    cursor = connection.cursor()
    
    try:
        cursor.execute("DESCRIBE api_patient;")
        columns = cursor.fetchall()
        
        print("Current Patient table columns:")
        print("-" * 50)
        
        for col in columns:
            print(f"{col[0]}: {col[1]}")
            
        # Check specifically for the missing column
        column_names = [col[0] for col in columns]
        
        print("\n" + "="*50)
        print("Checking for specific columns:")
        
        required_columns = [
            'hospital_admission_details',
            'hospital_admission_or_surgery',
            'comorbid_illnesses',
            'past_medical_history',
            'family_medical_history',
            'vaccination_history'
        ]
        
        for col in required_columns:
            if col in column_names:
                print(f"✓ {col} - EXISTS")
            else:
                print(f"✗ {col} - MISSING")
                
    except Exception as e:
        print(f"Error checking database: {e}")
    
    finally:
        cursor.close()

if __name__ == "__main__":
    check_patient_table()
