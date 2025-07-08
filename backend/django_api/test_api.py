#!/usr/bin/env python
import os
import sys
import django

# Add the Django project to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import MedicalDocument, Patient, AcademicSchoolYear
from django.contrib.auth import get_user_model

User = get_user_model()

def test_medical_documents():
    print("Testing Medical Documents API...")
    
    # Check if there are any medical documents
    total_docs = MedicalDocument.objects.count()
    print(f"Total MedicalDocument records: {total_docs}")
    
    # Check if there are medical documents without patients
    docs_without_patient = MedicalDocument.objects.filter(patient=None).count()
    print(f"MedicalDocument records without patient: {docs_without_patient}")
    
    # Check if there are academic years
    academic_years = AcademicSchoolYear.objects.count()
    print(f"Total AcademicSchoolYear records: {academic_years}")
    
    # Check if there are patients
    patients = Patient.objects.count()
    print(f"Total Patient records: {patients}")
    
    # Check if there are users
    users = User.objects.count()
    print(f"Total User records: {users}")
    
    # Get first medical document if exists
    if total_docs > 0:
        first_doc = MedicalDocument.objects.first()
        print(f"First document: {first_doc}")
        print(f"First document patient: {first_doc.patient}")
        if first_doc.patient:
            print(f"Patient name: {first_doc.patient.name}")
            print(f"Patient student_id: {first_doc.patient.student_id}")
            print(f"Patient department: {first_doc.patient.department}")
        print(f"Completion percentage: {first_doc.completion_percentage}")
        print(f"Is complete: {first_doc.is_complete}")
    
    # Try to create a test academic year if none exists
    if academic_years == 0:
        print("Creating test academic year...")
        try:
            academic_year = AcademicSchoolYear.objects.create(
                name="2024-2025",
                start_year=2024,
                end_year=2025,
                is_current=True
            )
            print(f"Created academic year: {academic_year}")
        except Exception as e:
            print(f"Error creating academic year: {e}")

if __name__ == "__main__":
    test_medical_documents()
