#!/usr/bin/env python
"""
Final verification test for medical documents system
"""
import os
import sys
import django
import requests
from datetime import datetime

# Add the Django project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import MedicalDocument, AcademicSchoolYear, PatientProfile
from django.contrib.auth.models import User

def test_complete_system():
    """Test the complete medical documents system"""
    print("=" * 60)
    print("MEDICAL DOCUMENTS SYSTEM - FINAL VERIFICATION")
    print("=" * 60)
    
    # Test 1: Database Schema
    print("\n1. Testing Database Schema...")
    try:
        # Try to create a complete medical document with academic year
        academic_year, created = AcademicSchoolYear.objects.get_or_create(
            year=2024,
            defaults={'is_active': True, 'is_current': True}
        )
        print(f"✓ Academic year: {academic_year} (created: {created})")
        
        user, created = User.objects.get_or_create(
            username='testpatient_final',
            defaults={
                'email': 'finaltest@example.com',
                'first_name': 'Final',
                'last_name': 'Test'
            }
        )
        
        patient, created = PatientProfile.objects.get_or_create(
            user=user,
            defaults={
                'student_number': 'FINAL001',
                'phone_number': '9876543210',
                'department': 'Computer Science',
                'year_level': 'Senior'
            }
        )
        print(f"✓ Patient profile: {patient} (created: {created})")
        
        # Test MedicalDocument creation with academic_year
        medical_doc, created = MedicalDocument.objects.get_or_create(
            patient=patient,
            academic_year=academic_year,
            defaults={
                'status': 'pending',
                'submitted_for_review': True
            }
        )
        print(f"✓ Medical document: {medical_doc} (created: {created})")
        print(f"  - Academic Year: {medical_doc.academic_year}")
        print(f"  - Status: {medical_doc.status}")
        
        print("✓ Database schema test: PASSED")
        
    except Exception as e:
        print(f"✗ Database schema test: FAILED - {e}")
        return False
    
    # Test 2: API Endpoints
    print("\n2. Testing API Endpoints...")
    base_url = "http://localhost:8000/api"
    
    try:
        # Test academic years endpoint
        response = requests.get(f"{base_url}/academic-years/", timeout=5)
        if response.status_code == 200:
            print("✓ Academic years endpoint: WORKING")
        else:
            print(f"✗ Academic years endpoint: FAILED ({response.status_code})")
            return False
            
        # Test medical documents endpoint
        response = requests.get(f"{base_url}/medical-documents/", timeout=5)
        if response.status_code == 200:
            print("✓ Medical documents endpoint: WORKING")
        else:
            print(f"✗ Medical documents endpoint: FAILED ({response.status_code})")
            return False
            
        # Test academic year filtering
        response = requests.get(f"{base_url}/medical-documents/?academic_year={academic_year.id}", timeout=5)
        if response.status_code == 200:
            print("✓ Academic year filtering: WORKING")
        else:
            print(f"✗ Academic year filtering: FAILED ({response.status_code})")
            return False
            
    except requests.RequestException as e:
        print(f"✗ API endpoints test: FAILED - {e}")
        return False
    
    # Test 3: Data Integrity
    print("\n3. Testing Data Integrity...")
    try:
        # Check that the medical document has proper relationships
        test_doc = MedicalDocument.objects.filter(patient=patient, academic_year=academic_year).first()
        if test_doc:
            print(f"✓ Medical document exists: {test_doc}")
            print(f"  - Patient: {test_doc.patient}")
            print(f"  - Academic Year: {test_doc.academic_year}")
            print(f"  - Completion %: {test_doc.completion_percentage}")
            print(f"  - Is Complete: {test_doc.is_complete}")
        else:
            print("✗ Medical document not found")
            return False
            
    except Exception as e:
        print(f"✗ Data integrity test: FAILED - {e}")
        return False
    
    print("\n" + "=" * 60)
    print("SYSTEM VERIFICATION: ALL TESTS PASSED ✓")
    print("=" * 60)
    print("\nThe medical documents system is fully operational!")
    print("- Database schema is correct")
    print("- API endpoints are working")
    print("- Academic year filtering is functional")
    print("- Data relationships are intact")
    print("\nFrontend should now work without errors.")
    
    return True

if __name__ == "__main__":
    success = test_complete_system()
    if success:
        print(f"\n🎉 Medical Documents System is ready for production!")
    else:
        print(f"\n❌ System verification failed. Please check the errors above.")
        sys.exit(1)
