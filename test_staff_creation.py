#!/usr/bin/env python3
"""Test creating staff details via PUT request"""

import requests
import json

def test_staff_details_creation():
    """Test creating staff details via PUT request"""
    
    base_url = "http://localhost:8000/api"
    
    print("=== Testing staff details creation ===")
    
    # Step 1: Login to get token
    print("\n1. Logging in...")
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login/", json=login_data)
        print(f"Login status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('access_token')
            user = token_data.get('user')
            
            print(f"Logged in user: {user}")
            print(f"Token: {token[:50]}...")
            
            # Step 2: Try to create staff details
            print(f"\n2. Creating staff details...")
            
            headers = {'Authorization': f'Bearer {token}'}
            staff_data = {
                "full_name": "Admin User",
                "position": "System Administrator",
                "license_number": "ADMIN123",
                "ptr_number": "PTR123",
                "phone_number": "123-456-7890",
                "assigned_campuses": "a"
            }
            
            response = requests.put(f"{base_url}/staff-details/my_details/", 
                                  json=staff_data, headers=headers)
            print(f"PUT Status: {response.status_code}")
            print(f"PUT Response: {response.text}")
            
            if response.status_code in [200, 201]:
                print("✓ Staff details created successfully!")
                
                # Step 3: Try to get staff details
                print(f"\n3. Getting staff details...")
                response = requests.get(f"{base_url}/staff-details/my_details/", headers=headers)
                print(f"GET Status: {response.status_code}")
                print(f"GET Response: {response.text}")
                
            else:
                print("✗ Failed to create staff details")
                
        else:
            print(f"Login failed: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_staff_details_creation()
