#!/usr/bin/env python
"""
Test script to verify the dental appointments API endpoint.
"""
import os
import sys
import django

# Add the Django project to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

import requests
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

def test_dental_appointments_api():
    """Test the dental appointments API endpoint"""
    print("Testing Dental Appointments API...")
    
    # Get or create a staff user for testing
    try:
        staff_user = User.objects.filter(is_staff=True).first()
        if not staff_user:
            staff_user = User.objects.filter(user_type='staff').first()
        
        if not staff_user:
            print("No staff user found. Creating a test staff user...")
            staff_user = User.objects.create_user(
                username='test_staff',
                email='test_staff@example.com',
                password='testpass123',
                is_staff=True,
                user_type='staff'
            )
        
        # Generate access token
        token = AccessToken.for_user(staff_user)
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test the problematic endpoint
        url = 'http://localhost:8000/api/appointments/'
        params = {
            'type': 'dental',
            'status': 'pending,confirmed,scheduled,completed',
            'ordering': '-appointment_date',
            'search': '',
            'school_year': ''
        }
        
        print(f"Making request to: {url}")
        print(f"Parameters: {params}")
        
        response = requests.get(url, params=params, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success! Retrieved {len(data)} appointments")
            return True
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_dental_appointments_api()
    if success:
        print("\n✓ API endpoint is working correctly!")
    else:
        print("\n✗ API endpoint has issues.")
