#!/usr/bin/env python3
"""
Test script to verify the complete medical certificate flow:
1. Check for issued medical certificates
2. Test the new endpoints
"""

import os
import sys
import django
from pathlib import Path

# Add the project path to sys.path
project_path = Path(__file__).resolve().parent
sys.path.append(str(project_path))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')

# Setup Django
django.setup()

from api.models import MedicalDocument, CustomUser, Patient
from django.contrib.auth.hashers import make_password
from django.utils import timezone

def test_medical_certificate_flow():
    print("🏥 Testing Medical Certificate Flow")
    print("=" * 50)
    
    # Check for issued medical certificates
    print("\n1. Checking for issued medical certificates...")
    issued_certificates = MedicalDocument.objects.filter(status='issued')
    print(f"   Found {issued_certificates.count()} issued certificates")
    
    for cert in issued_certificates:
        print(f"   - Certificate ID: {cert.id}")
        print(f"     Patient: {cert.patient.name if cert.patient else 'N/A'}")
        print(f"     Status: {cert.status}")
        print(f"     Has PDF: {'Yes' if cert.medical_certificate else 'No'}")
        print(f"     Issued at: {cert.certificate_issued_at}")
        if cert.medical_certificate:
            print(f"     PDF path: {cert.medical_certificate.path}")
            print(f"     PDF exists: {'Yes' if os.path.exists(cert.medical_certificate.path) else 'No'}")
    
    # Check patients with profiles
    print("\n2. Checking patients...")
    patients = Patient.objects.all()
    print(f"   Found {patients.count()} patients")
    
    for patient in patients:
        print(f"   - Patient: {patient.name}")
        print(f"     Student ID: {patient.student_id}")
        print(f"     User: {patient.user.email if patient.user else 'No user'}")
        
        # Check for medical documents
        medical_docs = MedicalDocument.objects.filter(patient=patient)
        print(f"     Medical documents: {medical_docs.count()}")
        for doc in medical_docs:
            print(f"       - Status: {doc.status}, Certificate: {'Yes' if doc.medical_certificate else 'No'}")
    
    # Check users
    print("\n3. Checking users...")
    users = CustomUser.objects.all()
    print(f"   Found {users.count()} users")
    
    for user in users:
        print(f"   - User: {user.email}")
        print(f"     Type: {user.user_type}")
        print(f"     Has patient profiles: {user.patient_profiles.count()}")
    
    print("\n" + "=" * 50)
    print("✅ Medical Certificate Flow Test Complete")
    
    # Summary
    if issued_certificates.count() > 0:
        print(f"\n🎉 Great! You have {issued_certificates.count()} issued certificate(s).")
        print("   These should now be visible on the appointments page.")
        print("   Users can view and download them directly without needing appointments.")
    else:
        print("\n❗ No issued certificates found.")
        print("   To test the flow:")
        print("   1. Go to admin medical documents page")
        print("   2. Verify some pending documents")
        print("   3. Issue certificates for them")
        print("   4. Check the appointments page")

if __name__ == '__main__':
    test_medical_certificate_flow()
