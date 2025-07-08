#!/usr/bin/env python
"""
Test the specific endpoint that's failing
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
        
        # Test the specific endpoint that's failing
        print("\nTesting admin-controls/profile_requirements/update_profile_requirements/")
        response = requests.post(f"{base_url}/admin-controls/profile_requirements/update_profile_requirements/", 
                               headers=headers, json={'requirements': []})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        print("\nTesting admin-controls/document_requirements/update_document_requirements/")
        response = requests.post(f"{base_url}/admin-controls/document_requirements/update_document_requirements/", 
                               headers=headers, json={'requirements': []})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        print("\nTesting admin-controls/campus_schedules/update_campus_schedules/")
        response = requests.post(f"{base_url}/admin-controls/campus_schedules/update_campus_schedules/", 
                               headers=headers, json={'schedules': []})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        print("\nTesting admin-controls/dentist_schedules/update_dentist_schedules/")
        response = requests.post(f"{base_url}/admin-controls/dentist_schedules/update_dentist_schedules/", 
                               headers=headers, json={'schedules': []})
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
else:
    print("Login failed:", response.text)
