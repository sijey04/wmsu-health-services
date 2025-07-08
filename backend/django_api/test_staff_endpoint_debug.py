#!/usr/bin/env python
"""
Test script to debug staff details endpoint
"""
import requests
import json
import sys
import os

# Add Django project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_staff_details_endpoint():
    """Test the staff-details endpoint"""
    base_url = "http://localhost:8000/api"
    
    # Test 1: Check if basic staff-details endpoint exists
    print("=== Testing staff-details endpoint ===")
    
    try:
        response = requests.get(f"{base_url}/staff-details/")
        print(f"GET /api/staff-details/ - Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ Endpoint exists but requires authentication")
        elif response.status_code == 200:
            print("✓ Endpoint exists and is accessible")
            print(f"Response: {response.json()}")
        else:
            print(f"✗ Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"✗ Exception: {e}")
    
    # Test 2: Check if my-details endpoint exists
    print("\n=== Testing my-details endpoint ===")
    
    try:
        response = requests.get(f"{base_url}/staff-details/my-details/")
        print(f"GET /api/staff-details/my-details/ - Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ my-details endpoint exists but requires authentication")
        elif response.status_code == 200:
            print("✓ my-details endpoint exists and is accessible")
        elif response.status_code == 404:
            print("✗ my-details endpoint not found - this is the problem!")
        else:
            print(f"? Unexpected status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"✗ Exception: {e}")
    
    # Test 3: Check what endpoints are available
    print("\n=== Testing available endpoints ===")
    
    try:
        response = requests.options(f"{base_url}/staff-details/")
        print(f"OPTIONS /api/staff-details/ - Status: {response.status_code}")
        if 'Allow' in response.headers:
            print(f"Allowed methods: {response.headers['Allow']}")
    except Exception as e:
        print(f"✗ Exception: {e}")

if __name__ == "__main__":
    test_staff_details_endpoint()
