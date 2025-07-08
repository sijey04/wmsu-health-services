#!/usr/bin/env python
"""
Test script to verify the staff details my_details endpoint
"""
import requests
import json

def test_staff_details():
    # Login to get a token
    login_url = "http://localhost:8000/api/auth/login/"
    staff_details_url = "http://localhost:8000/api/staff-details/my-details/"
    
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        print("1. Logging in...")
        login_response = requests.post(login_url, json=login_data, timeout=10)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get('access_token') or token_data.get('access')
            print(f"Got token: {token[:20]}...")
            
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test GET request first
            print("\n2. Testing GET /staff-details/my-details/")
            get_response = requests.get(staff_details_url, headers=headers, timeout=10)
            print(f"GET Status: {get_response.status_code}")
            print(f"GET Response: {get_response.text}")
            
            # Test PUT request (this should create if not exists)
            print("\n3. Testing PUT /staff-details/my-details/")
            
            test_data = {
                'full_name': 'Test Staff User',
                'position': 'Test Position',
                'license_number': 'TEST123',
                'ptr_number': 'PTR123',
                'phone_number': '1234567890',
                'assigned_campuses': 'a,b'
            }
            
            put_response = requests.put(staff_details_url, data=test_data, headers=headers, timeout=10)
            print(f"PUT Status: {put_response.status_code}")
            print(f"PUT Response: {put_response.text}")
            
            # Test GET again to see if it was created
            print("\n4. Testing GET again after PUT")
            get_response2 = requests.get(staff_details_url, headers=headers, timeout=10)
            print(f"GET Status: {get_response2.status_code}")
            print(f"GET Response: {get_response2.text}")
            
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_staff_details()
