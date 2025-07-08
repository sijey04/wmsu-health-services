#!/usr/bin/env python
import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.db import connection

def fix_migration_issue():
    """Fix the migration issue by checking what's actually in the database"""
    cursor = connection.cursor()
    
    try:
        # Get all columns from the Patient table
        cursor.execute("DESCRIBE api_patient;")
        columns = cursor.fetchall()
        
        print("Current columns in api_patient table:")
        print("-" * 50)
        column_names = []
        for col in columns:
            column_names.append(col[0])
            print(f"{col[0]}: {col[1]}")
        
        print("\n" + "="*50)
        print("Required columns check:")
        
        required_columns = [
            'hospital_admission_details',
            'hospital_admission_or_surgery', 
            'comorbid_illnesses',
            'past_medical_history',
            'family_medical_history',
            'vaccination_history'
        ]
        
        missing_columns = []
        for col in required_columns:
            if col in column_names:
                print(f"✓ {col} - EXISTS")
            else:
                print(f"✗ {col} - MISSING")
                missing_columns.append(col)
        
        if missing_columns:
            print(f"\nMissing columns: {missing_columns}")
            
            # Add missing columns
            for col in missing_columns:
                if col == 'hospital_admission_details':
                    sql = "ALTER TABLE api_patient ADD COLUMN hospital_admission_details TEXT NULL;"
                    cursor.execute(sql)
                    print(f"✓ Added {col}")
                elif col == 'hospital_admission_or_surgery':
                    sql = "ALTER TABLE api_patient ADD COLUMN hospital_admission_or_surgery TINYINT(1) DEFAULT 0;"
                    cursor.execute(sql)
                    print(f"✓ Added {col}")
                elif col in ['comorbid_illnesses', 'past_medical_history', 'family_medical_history', 'vaccination_history']:
                    sql = f"ALTER TABLE api_patient ADD COLUMN {col} JSON NULL;"
                    cursor.execute(sql)
                    print(f"✓ Added {col}")
        else:
            print("\n✓ All required columns exist!")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        cursor.close()

if __name__ == "__main__":
    fix_migration_issue()
