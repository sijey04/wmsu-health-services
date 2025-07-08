#!/usr/bin/env python3
"""Test staff details endpoint with authentication"""

import requests
import json

def test_with_authentication():
    """Test the staff details endpoint with proper authentication"""
    
    base_url = "http://localhost:8000/api"
    
    print("=== Testing staff details endpoint with authentication ===")
    
    # Step 1: Create a test user account
    print("\n1. Creating test user account...")
    user_data = {
        "username": "teststaff",
        "email": "teststaff@example.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "Staff",
        "user_type": "staff"
    }
    
    try:
        response = requests.post(f"{base_url}/users/", json=user_data)
        print(f"User creation status: {response.status_code}")
        if response.status_code == 201:
            print("User created successfully")
        elif response.status_code == 400:
            print("User might already exist")
            print(f"Response: {response.text}")
        else:
            print(f"User creation response: {response.text}")
    except Exception as e:
        print(f"Error creating user: {e}")
    
    # Step 2: Get authentication token
    print("\n2. Getting authentication token...")
    login_data = {
        "username": "teststaff",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{base_url}/token/", json=login_data)
        print(f"Login status: {response.status_code}")
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('access') or token_data.get('token')
            print(f"Token obtained: {token[:20]}...")
            
            # Step 3: Test staff details endpoint with token
            print("\n3. Testing staff details endpoint with token...")
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test GET request
            print("\n3a. Testing GET /staff-details/my-details/")
            response = requests.get(f"{base_url}/staff-details/my-details/", headers=headers)
            print(f"GET Status: {response.status_code}")
            print(f"GET Response: {response.text}")
            
            # Test PUT request to create staff details
            print("\n3b. Testing PUT /staff-details/my-details/")
            staff_data = {
                "full_name": "Test Staff User",
                "position": "Test Position",
                "license_number": "TEST123",
                "ptr_number": "PTR123",
                "phone_number": "123-456-7890",
                "assigned_campuses": "a"
            }
            
            response = requests.put(f"{base_url}/staff-details/my-details/", json=staff_data, headers=headers)
            print(f"PUT Status: {response.status_code}")
            print(f"PUT Response: {response.text}")
            
            # Test GET request after PUT
            print("\n3c. Testing GET /staff-details/my-details/ after PUT")
            response = requests.get(f"{base_url}/staff-details/my-details/", headers=headers)
            print(f"GET Status: {response.status_code}")
            print(f"GET Response: {response.text}")
            
        else:
            print(f"Login failed: {response.text}")
    except Exception as e:
        print(f"Error during authentication: {e}")

if __name__ == "__main__":
    test_with_authentication()
