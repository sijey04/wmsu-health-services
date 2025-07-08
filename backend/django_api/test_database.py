#!/usr/bin/env python
import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.db import connection

def test_patient_query():
    """Test a simple patient query to see if the database is working"""
    try:
        from api.models import Patient
        
        # Try to query patients
        patients = Patient.objects.all()[:1]
        
        if patients:
            patient = patients[0]
            print(f"✓ Successfully queried patient: {patient.name}")
            print(f"✓ Patient has hospital_admission_details: {hasattr(patient, 'hospital_admission_details')}")
            if hasattr(patient, 'hospital_admission_details'):
                print(f"✓ Value: {patient.hospital_admission_details}")
        else:
            print("✓ No patients found, but query was successful")
            
    except Exception as e:
        print(f"✗ Error querying patients: {e}")
        import traceback
        traceback.print_exc()

def check_column_exists():
    """Check if the hospital_admission_details column exists"""
    cursor = connection.cursor()
    
    try:
        cursor.execute("SHOW COLUMNS FROM api_patient LIKE 'hospital_admission_details';")
        result = cursor.fetchone()
        
        if result:
            print("✓ Column 'hospital_admission_details' exists in database")
            return True
        else:
            print("✗ Column 'hospital_admission_details' missing from database")
            return False
            
    except Exception as e:
        print(f"✗ Error checking column: {e}")
        return False
    finally:
        cursor.close()

if __name__ == "__main__":
    print("Testing database connection...")
    if check_column_exists():
        test_patient_query()
    else:
        print("Column missing - need to add it manually")
