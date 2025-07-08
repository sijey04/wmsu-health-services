#!/usr/bin/env python3
"""
Test the API endpoint to see if it works now
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')

# Setup Django
django.setup()

from api.models import AcademicSchoolYear, CustomUser, Patient, MedicalDocument
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from api.views import MedicalDocumentViewSet
import json

def test_endpoint():
    """Test the my_documents endpoint"""
    print("Testing my_documents endpoint...")
    
    # Ensure academic year exists
    year, created = AcademicSchoolYear.objects.get_or_create(
        academic_year='2024-2025',
        defaults={'is_current': True}
    )
    if not created:
        year.is_current = True
        year.save()
    
    print(f"Academic year: {year.academic_year} (current: {year.is_current})")
    
    # Get or create test user
    user, created = CustomUser.objects.get_or_create(
        email="test@example.com",
        defaults={
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print("Created test user")
    
    # Get or create patient profile
    patient_profile, created = Patient.objects.get_or_create(
        user=user,
        school_year=year,
        defaults={
            'name': 'Test User',
            'student_id': 'TEST123',
            'first_name': 'Test',
            'email': 'test@example.com'
        }
    )
    if created:
        print("Created test patient profile")
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/api/medical-documents/my_documents/')
    request.user = user
    
    # Test the endpoint
    viewset = MedicalDocumentViewSet()
    try:
        response = viewset.my_documents(request)
        print(f"Response status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Endpoint working correctly")
            print(f"Response data keys: {list(response.data.keys())}")
        else:
            print(f"✗ Endpoint returned error: {response.data}")
    except Exception as e:
        print(f"✗ Error calling my_documents: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_endpoint()
