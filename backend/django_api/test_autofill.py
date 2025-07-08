#!/usr/bin/env python
"""
Test script to verify autofill functionality for patient profiles
"""
import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import CustomUser, Patient, AcademicSchoolYear

def test_autofill():
    print("Testing autofill functionality...")
    
    # Create a test user
    test_user = CustomUser.objects.create_user(
        username='testuser',
        email='test@example.com',
        first_name='John',
        last_name='Doe',
        middle_name='Michael',
        password='testpass123'
    )
    
    print(f"Created test user: {test_user.email}")
    print(f"User details: {test_user.first_name} {test_user.middle_name} {test_user.last_name}")
    
    # Create a test school year
    school_year, created = AcademicSchoolYear.objects.get_or_create(
        academic_year='2024-2025',
        defaults={
            'start_date': '2024-09-01',
            'end_date': '2025-06-30',
            'is_current': True,
            'status': 'active'
        }
    )
    
    if created:
        print(f"Created test school year: {school_year.academic_year}")
    else:
        print(f"Using existing school year: {school_year.academic_year}")
    
    # Test Patient profile autofill
    patient = Patient.objects.create(
        user=test_user,
        school_year=school_year
    )
    
    print("\nPatient profile autofill results:")
    print(f"Email: {patient.email}")
    print(f"Name: {patient.name}")
    print(f"First name: {patient.first_name}")
    print(f"Middle name: {patient.middle_name}")
    print(f"Student ID: {patient.student_id}")
    
    # Verify autofill worked
    assert patient.email == test_user.email, f"Email mismatch: {patient.email} != {test_user.email}"
    assert patient.first_name == test_user.first_name, f"First name mismatch: {patient.first_name} != {test_user.first_name}"
    assert patient.middle_name == test_user.middle_name, f"Middle name mismatch: {patient.middle_name} != {test_user.middle_name}"
    assert patient.name == f"{test_user.last_name}, {test_user.first_name}", f"Name mismatch: {patient.name} != {test_user.last_name}, {test_user.first_name}"
    
    print("\n✅ All autofill tests passed!")
    
    # Clean up
    patient.delete()
    test_user.delete()
    if created:
        school_year.delete()
    
    print("✅ Test cleanup completed")

if __name__ == '__main__':
    test_autofill()
