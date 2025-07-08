#!/usr/bin/env python
"""Test the staff-details/my-details endpoint directly"""

import os
import sys
import django
import requests
import json

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_endpoint():
    print("Testing staff-details/my-details endpoint...")
    
    # Get or create a test user
    try:
        user = User.objects.get(email='test@example.com')
        print(f"Found existing user: {user.email}")
    except User.DoesNotExist:
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            user_type='staff'
        )
        print(f"Created new user: {user.email}")
    
    # Generate JWT token
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    print(f"Generated token: {token[:50]}...")
    
    # Test the endpoint using APIClient
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Test GET request
    print("\n--- Testing GET request ---")
    response = client.get('/api/staff-details/my-details/')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.data}")
    
    # Test PUT request
    print("\n--- Testing PUT request ---")
    staff_data = {
        'full_name': 'Test User Updated',
        'position': 'Test Position',
        'license_number': 'LIC123',
        'ptr_number': 'PTR456',
        'phone_number': '1234567890',
        'assigned_campuses': 'Campus 1'
    }
    
    response = client.put('/api/staff-details/my-details/', data=staff_data, format='json')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.data}")

if __name__ == '__main__':
    test_endpoint()
