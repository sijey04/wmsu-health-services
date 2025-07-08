#!/usr/bin/env python
"""
Test the dentist schedules API endpoint
"""
import requests
import json

base_url = "http://127.0.0.1:8000/api"

# Test with a user login first
login_data = {
    "email": "admin@example.com",
    "password": "admin123"
}

print("Testing dentist schedules API...")
print("Logging in as student...")
response = requests.post(f"{base_url}/auth/login/", json=login_data)
print(f"Login response: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data.get('access_token')
    print(f"Got token: {token[:20]}..." if token else "No token")
    
    if token:
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test the dentist schedules endpoint
        print("\nTesting /admin-controls/dentist_schedules/")
        response = requests.get(f"{base_url}/admin-controls/dentist_schedules/", headers=headers)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            schedules = response.json()
            print(f"Found {len(schedules)} schedules")
            for schedule in schedules:
                print(f"  - {schedule['dentist_name']} on Campus {schedule['campus'].upper()}")
                print(f"    Days: {schedule['available_days']}")
                print(f"    Active: {schedule['is_active']}")
        else:
            print(f"Error: {response.text}")
else:
    print("Login failed:", response.text)
    # Try without authentication
    print("\nTrying without authentication...")
    response = requests.get(f"{base_url}/admin-controls/dentist_schedules/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
