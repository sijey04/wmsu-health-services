#!/usr/bin/env python
"""
Test the specific patient profile endpoints
"""

import requests
import json

base_url = "http://127.0.0.1:8000/api"

# Test with admin credentials
login_data = {
    "email": "admin@example.com",
    "password": "admin123"
}

print("Logging in...")
response = requests.post(f"{base_url}/auth/login/", json=login_data)
print(f"Login response: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data.get('access_token')
    print(f"Got token: {token[:20]}..." if token else "No token")
    
    if token:
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test the specific endpoints that are failing
        print("\nTesting patients/my_profile/")
        response = requests.get(f"{base_url}/patients/my_profile/", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        print("\nTesting academic-school-years/current/")
        response = requests.get(f"{base_url}/academic-school-years/current/", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Also test if the endpoints are available without the trailing slash
        print("\nTesting patients/my_profile")
        response = requests.get(f"{base_url}/patients/my_profile", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        print("\nTesting academic-school-years/current")
        response = requests.get(f"{base_url}/academic-school-years/current", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
else:
    print("Login failed:", response.text)
