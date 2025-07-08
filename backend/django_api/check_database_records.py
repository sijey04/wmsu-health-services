#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    django.setup()
    
    from api.models import MedicalDocument, Patient, CustomUser
    
    print("Checking database records...")
    
    # Check total counts
    total_docs = MedicalDocument.objects.count()
    total_patients = Patient.objects.count()
    total_users = CustomUser.objects.count()
    
    print(f"Total MedicalDocument records: {total_docs}")
    print(f"Total Patient records: {total_patients}")
    print(f"Total User records: {total_users}")
    
    if total_docs > 0:
        print("\nFirst few MedicalDocument records:")
        for doc in MedicalDocument.objects.all()[:3]:
            print(f"  ID: {doc.id}")
            print(f"  Patient: {doc.patient}")
            if doc.patient:
                print(f"    Patient name: {doc.patient.name}")
                print(f"    Patient first_name: {doc.patient.first_name}")
                print(f"    Patient email: {doc.patient.email}")
                print(f"    Patient contact_number: {doc.patient.contact_number}")
            else:
                print("    No patient relationship!")
            print("  ---")
    
    if total_patients > 0:
        print("\nFirst few Patient records:")
        for patient in Patient.objects.all()[:3]:
            print(f"  ID: {patient.id}")
            print(f"  Name: {patient.name}")
            print(f"  First name: {patient.first_name}")
            print(f"  Email: {patient.email}")
            print(f"  Contact: {patient.contact_number}")
            print(f"  Student ID: {patient.student_id}")
            print("  ---")
    
    # Check if any MedicalDocuments have null patients
    docs_without_patient = MedicalDocument.objects.filter(patient__isnull=True).count()
    print(f"\nMedicalDocument records without patient: {docs_without_patient}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
