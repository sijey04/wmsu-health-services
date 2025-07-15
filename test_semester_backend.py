#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'django_api'))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Setup Django
django.setup()

from api.models import CustomUser, Patient, AcademicSchoolYear

def test_semester_system():
    print("=== Testing Semester System ===")
    
    # Test 1: Check if Patient model has semester field
    try:
        patient_fields = [field.name for field in Patient._meta.get_fields()]
        print(f"✓ Patient model fields: {patient_fields}")
        
        if 'semester' in patient_fields:
            print("✓ Patient model has semester field")
        else:
            print("✗ Patient model missing semester field")
            
        if 'school_year' in patient_fields:
            print("✓ Patient model has school_year field")
        else:
            print("✗ Patient model missing school_year field")
            
    except Exception as e:
        print(f"✗ Error checking Patient model: {e}")
    
    # Test 2: Check semester choices
    try:
        semester_choices = Patient.SEMESTER_CHOICES
        print(f"✓ Semester choices: {semester_choices}")
    except Exception as e:
        print(f"✗ Error getting semester choices: {e}")
    
    # Test 3: Check unique constraint
    try:
        # Get unique constraints for Patient model
        constraints = Patient._meta.constraints
        unique_together = Patient._meta.unique_together
        print(f"✓ Patient constraints: {[str(c) for c in constraints]}")
        print(f"✓ Patient unique_together: {unique_together}")
    except Exception as e:
        print(f"✗ Error checking constraints: {e}")
    
    # Test 4: Check AcademicSchoolYear semester date fields
    try:
        school_year_fields = [field.name for field in AcademicSchoolYear._meta.get_fields()]
        print(f"✓ AcademicSchoolYear fields: {school_year_fields}")
        
        semester_date_fields = ['first_sem_start', 'first_sem_end', 'second_sem_start', 'second_sem_end', 'summer_start', 'summer_end']
        for field in semester_date_fields:
            if field in school_year_fields:
                print(f"✓ AcademicSchoolYear has {field}")
            else:
                print(f"✗ AcademicSchoolYear missing {field}")
    except Exception as e:
        print(f"✗ Error checking AcademicSchoolYear: {e}")
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_semester_system()
