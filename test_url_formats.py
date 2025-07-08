#!/usr/bin/env python3
"""Test both URL formats to confirm the fix"""

import requests
import json

def test_url_formats():
    """Test both URL formats for staff details"""
    
    base_url = "http://localhost:8000/api"
    
    print("=== Testing URL formats ===")
    
    # Login first
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login/", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('access_token')
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test old URL format (with hyphen)
            print(f"\n1. Testing old URL format: /staff-details/my-details/")
            response = requests.get(f"{base_url}/staff-details/my-details/", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Test new URL format (with underscore)
            print(f"\n2. Testing new URL format: /staff-details/my_details/")
            response = requests.get(f"{base_url}/staff-details/my_details/", headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Test PUT with new URL format
            print(f"\n3. Testing PUT with new URL format: /staff-details/my_details/")
            staff_data = {
                "full_name": "Updated Admin User",
                "position": "Updated System Administrator",
                "license_number": "ADMIN123",
                "ptr_number": "PTR123",
                "phone_number": "123-456-7890",
                "assigned_campuses": "a,b"
            }
            
            response = requests.put(f"{base_url}/staff-details/my_details/", 
                                  json=staff_data, headers=headers)
            print(f"PUT Status: {response.status_code}")
            print(f"PUT Response: {response.text}")
            
        else:
            print(f"Login failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_url_formats()
