#!/usr/bin/env python3
import requests
import json

# Test the staff details endpoint
url = "http://localhost:8000/api/staff-details/my-details/"
headers = {
    'Authorization': 'Token YOUR_TOKEN_HERE',  # Replace with actual token
    'Content-Type': 'application/json'
}

# Test GET request
try:
    response = requests.get(url, headers=headers)
    print(f"GET Status: {response.status_code}")
    print(f"GET Response: {response.text}")
except Exception as e:
    print(f"GET Error: {e}")

# Test PUT request 
test_data = {
    "full_name": "Test Staff",
    "position": "Doctor",
    "license_number": "12345",
    "ptr_number": "PTR123",
    "phone_number": "123-456-7890",
    "assigned_campuses": "a,b"
}

try:
    response = requests.put(url, json=test_data, headers=headers)
    print(f"PUT Status: {response.status_code}")
    print(f"PUT Response: {response.text}")
except Exception as e:
    print(f"PUT Error: {e}")
