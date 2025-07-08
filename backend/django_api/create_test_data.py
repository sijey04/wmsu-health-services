#!/usr/bin/env python
import os
import sys
import django

# Add the Django project to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import MedicalDocument, Patient, AcademicSchoolYear, CustomUser
from django.contrib.auth import get_user_model

User = get_user_model()

def create_test_data():
    print("Creating test data...")
    
    # Check if there's an academic year
    academic_year = AcademicSchoolYear.objects.first()
    if not academic_year:
        print("Creating academic year...")
        academic_year = AcademicSchoolYear.objects.create(
            name="2024-2025",
            start_year=2024,
            end_year=2025,
            is_current=True
        )
        print(f"Created academic year: {academic_year}")
    
    # Check if there's a patient
    patient = Patient.objects.first()
    if not patient:
        print("Creating test patient...")
        patient = Patient.objects.create(
            student_id="TEST001",
            name="Test Patient",
            first_name="Test",
            department="Computer Science",
            gender="Male"
        )
        print(f"Created patient: {patient}")
    
    # Check if there's a medical document
    doc = MedicalDocument.objects.first()
    if not doc:
        print("Creating test medical document...")
        doc = MedicalDocument.objects.create(
            patient=patient,
            academic_year=academic_year,
            status='pending'
        )
        print(f"Created medical document: {doc}")
    
    print(f"Current state:")
    print(f"- Academic years: {AcademicSchoolYear.objects.count()}")
    print(f"- Patients: {Patient.objects.count()}")
    print(f"- Medical documents: {MedicalDocument.objects.count()}")
    print(f"- Users: {User.objects.count()}")
    print(f"- Staff users: {User.objects.filter(is_staff=True).count()}")

if __name__ == "__main__":
    create_test_data()
