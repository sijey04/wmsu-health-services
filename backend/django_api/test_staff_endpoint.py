#!/usr/bin/env python3
"""
Test script to debug the staff management endpoint
"""
import os
import django
import sys

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from api.views import StaffManagementViewSet
from api.models import CustomUser
import json

def test_staff_creation():
    """Test staff creation with sample data"""
    
    # Create a test admin user
    try:
        admin_user = CustomUser.objects.get(email='admin@test.com')
    except CustomUser.DoesNotExist:
        admin_user = CustomUser.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='testpass123',
            user_type='admin',
            is_staff=True,
            is_superuser=True,
            first_name='Admin',
            last_name='Test'
        )
    
    # Test data that matches the frontend format
    test_data = {
        'username': 'test_staff',
        'email': 'test_staff@example.com',
        'first_name': 'Test',
        'last_name': 'Staff',
        'password': 'testpass123',
        'role': 'staff',
        'campuses': ['a'],
        'phone_number': '1234567890'
    }
    
    # Create request factory
    factory = RequestFactory()
    request = factory.post('/api/staff-management/', 
                          data=json.dumps(test_data),
                          content_type='application/json')
    request.user = admin_user
    
    # Create viewset and test
    viewset = StaffManagementViewSet()
    viewset.action = 'create'
    
    try:
        response = viewset.create(request)
        print(f"Success! Status: {response.status_code}")
        print(f"Response: {response.data}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_staff_creation()
