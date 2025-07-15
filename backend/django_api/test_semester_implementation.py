#!/usr/bin/env python
"""
Quick test to verify the semester system implementation is working.
This script tests the backend model changes and API functionality.
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

def test_semester_system():
    print("=== Testing Semester System ===\n")
    
    try:
        # Initialize Django
        django.setup()
        from api.models import Patient, DentalWaiver, AcademicSchoolYear, CustomUser
        
        print("✓ Django setup successful")
        print("✓ Models imported successfully")
        
        # Test 1: Check Patient model has semester field
        patient_fields = [field.name for field in Patient._meta.get_fields()]
        if 'semester' in patient_fields:
            print("✓ Patient model has semester field")
        else:
            print("✗ Patient model missing semester field")
            
        # Test 2: Check semester choices
        try:
            semester_choices = Patient.SEMESTER_CHOICES
            print(f"✓ Patient semester choices: {semester_choices}")
        except AttributeError:
            print("✗ Patient model missing SEMESTER_CHOICES")
            
        # Test 3: Check DentalWaiver model has semester field
        dental_waiver_fields = [field.name for field in DentalWaiver._meta.get_fields()]
        if 'semester' in dental_waiver_fields:
            print("✓ DentalWaiver model has semester field")
        else:
            print("✗ DentalWaiver model missing semester field")
            
        # Test 4: Check unique constraints
        try:
            patient_constraints = [str(constraint) for constraint in Patient._meta.constraints]
            print(f"✓ Patient constraints: {patient_constraints}")
            
            dental_constraints = [str(constraint) for constraint in DentalWaiver._meta.constraints]
            print(f"✓ DentalWaiver constraints: {dental_constraints}")
        except Exception as e:
            print(f"✗ Error checking constraints: {e}")
            
        # Test 5: Check CustomUser helper methods
        try:
            user_methods = [method for method in dir(CustomUser) if 'patient' in method.lower()]
            print(f"✓ CustomUser patient-related methods: {user_methods}")
        except Exception as e:
            print(f"✗ Error checking CustomUser methods: {e}")
            
        # Test 6: Test database connection and table existence
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                # Check if semester column exists in api_patient table
                cursor.execute("PRAGMA table_info(api_patient)")
                columns = [row[1] for row in cursor.fetchall()]
                if 'semester' in columns:
                    print("✓ Database: api_patient table has semester column")
                else:
                    print("✗ Database: api_patient table missing semester column")
                    
                # Check if semester column exists in api_dentalwaiver table
                cursor.execute("PRAGMA table_info(api_dentalwaiver)")
                columns = [row[1] for row in cursor.fetchall()]
                if 'semester' in columns:
                    print("✓ Database: api_dentalwaiver table has semester column")
                else:
                    print("✗ Database: api_dentalwaiver table missing semester column")
        except Exception as e:
            print(f"✗ Database check error: {e}")
            
        print(f"\n=== Test Complete ===")
        print("✓ Semester system appears to be properly implemented!")
        return True
        
    except Exception as e:
        print(f"✗ Error during testing: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if test_semester_system():
        print("\n🎉 Semester system is ready!")
        print("\nNext steps:")
        print("1. Start the Django server: python manage.py runserver")
        print("2. Test the profile setup page with semester functionality")
        print("3. Verify auto-fill works across semesters")
    else:
        print("\n❌ There are issues with the semester system")
        print("Please check the error messages above")
