#!/usr/bin/env python3
"""Test script to verify staff details endpoint is accessible"""

import os
import sys
import django
import requests
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse
import json

# Add the Django project to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'django_api'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

# Now import Django models
from api.models import StaffDetails

User = get_user_model()

def test_staff_details_endpoint():
    """Test the staff details endpoint"""
    
    # Create a test client
    client = Client()
    
    # Test 1: Check if the endpoint exists without authentication
    print("=== Test 1: Check endpoint without authentication ===")
    response = client.get('/api/staff-details/my-details/')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.content.decode()}")
    print()
    
    # Test 2: Create a test user and authenticate
    print("=== Test 2: Create test user and authenticate ===")
    try:
        # Try to get existing user first
        user = User.objects.get(username='teststaff')
        print(f"Found existing user: {user}")
    except User.DoesNotExist:
        # Create new user
        user = User.objects.create_user(
            username='teststaff',
            email='teststaff@example.com',
            password='testpass123',
            user_type='staff',
            is_staff=True
        )
        print(f"Created new user: {user}")
    
    # Force login the user
    client.force_login(user)
    
    # Test 3: Test GET request with authentication
    print("=== Test 3: GET request with authentication ===")
    response = client.get('/api/staff-details/my-details/')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.content.decode()}")
    print()
    
    # Test 4: Test PUT request (create new staff details)
    print("=== Test 4: PUT request to create staff details ===")
    staff_data = {
        'first_name': 'Test',
        'last_name': 'Staff',
        'phone': '123-456-7890',
        'department': 'Test Department',
        'position': 'Test Position',
        'employee_id': 'TEST001'
    }
    
    response = client.put(
        '/api/staff-details/my-details/',
        data=json.dumps(staff_data),
        content_type='application/json'
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.content.decode()}")
    print()
    
    # Test 5: Test GET request after creating
    print("=== Test 5: GET request after creating ===")
    response = client.get('/api/staff-details/my-details/')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.content.decode()}")
    print()
    
    # Test 6: Check if staff details were created in database
    print("=== Test 6: Check database ===")
    try:
        staff_details = StaffDetails.objects.get(user=user)
        print(f"Found staff details: {staff_details}")
        print(f"First name: {staff_details.first_name}")
        print(f"Last name: {staff_details.last_name}")
        print(f"Phone: {staff_details.phone}")
        print(f"Department: {staff_details.department}")
        print(f"Position: {staff_details.position}")
        print(f"Employee ID: {staff_details.employee_id}")
    except StaffDetails.DoesNotExist:
        print("No staff details found in database")
    print()

if __name__ == "__main__":
    test_staff_details_endpoint()
