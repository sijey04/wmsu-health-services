import requests
import json
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_live_endpoint():
    print("Testing live staff-details/my-details endpoint...")
    
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
    
    # Test the endpoint using real HTTP requests
    base_url = 'http://localhost:8000'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test GET request
    print("\n--- Testing GET request ---")
    try:
        response = requests.get(f'{base_url}/api/staff-details/my-details/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print(f"JSON Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")
    
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
    
    try:
        response = requests.put(f'{base_url}/api/staff-details/my-details/', 
                              headers=headers, json=staff_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code in [200, 201]:
            print(f"JSON Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_live_endpoint()
