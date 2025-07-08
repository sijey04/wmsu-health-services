#!/usr/bin/env python3
"""Simple test to check staff details endpoint availability"""

import requests
import json

def test_staff_details_endpoint():
    """Test the staff details endpoint"""
    
    base_url = "http://localhost:8000/api"
    
    print("=== Testing staff details endpoint ===")
    
    # Test 1: Check if endpoint exists (should return 401 unauthorized)
    print("\n1. Testing GET /staff-details/my-details/ without authentication:")
    try:
        response = requests.get(f"{base_url}/staff-details/my-details/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 2: Check if we can access the staff-details list endpoint
    print("\n2. Testing GET /staff-details/ without authentication:")
    try:
        response = requests.get(f"{base_url}/staff-details/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 3: Check API root
    print("\n3. Testing API root:")
    try:
        response = requests.get(f"{base_url}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test 4: Test with a fake token to see if the endpoint is recognized
    print("\n4. Testing with fake authorization:")
    try:
        headers = {'Authorization': 'Token fake-token-here'}
        response = requests.get(f"{base_url}/staff-details/my-details/", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_staff_details_endpoint()
