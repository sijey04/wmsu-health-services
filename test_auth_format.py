#!/usr/bin/env python3
"""Test authentication format for staff details endpoint"""

import requests
import json

def test_authentication_format():
    """Test the authentication format for the API"""
    
    base_url = "http://localhost:8000/api"
    
    print("=== Testing authentication format ===")
    
    # Test 1: Try to login with auth/login endpoint
    print("\n1. Testing login with auth/login endpoint:")
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login/", json=login_data)
        print(f"Login status: {response.status_code}")
        print(f"Login response: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            print(f"Token data: {token_data}")
            
            # Try both Bearer and Token format
            token = token_data.get('access_token') or token_data.get('token') or token_data.get('access')
            
            if token:
                print(f"\n2. Testing staff details with Bearer token:")
                headers = {'Authorization': f'Bearer {token}'}
                response = requests.get(f"{base_url}/staff-details/my_details/", headers=headers)
                print(f"Bearer Status: {response.status_code}")
                print(f"Bearer Response: {response.text}")
                
                print(f"\n3. Testing staff details with Token format:")
                headers = {'Authorization': f'Token {token}'}
                response = requests.get(f"{base_url}/staff-details/my_details/", headers=headers)
                print(f"Token Status: {response.status_code}")
                print(f"Token Response: {response.text}")
            else:
                print("No token found in response")
                
    except Exception as e:
        print(f"Error during login: {e}")
        
    # Test 2: Try with sample existing user
    print("\n4. Testing with default admin credentials:")
    login_data = {
        "email": "admin@wmsuhealth.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/auth/login/", json=login_data)
        print(f"Login status: {response.status_code}")
        print(f"Login response: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('access_token') or token_data.get('token') or token_data.get('access')
            
            if token:
                print(f"\n5. Testing staff details with correct token:")
                headers = {'Authorization': f'Bearer {token}'}
                response = requests.get(f"{base_url}/staff-details/my_details/", headers=headers)
                print(f"Status: {response.status_code}")
                print(f"Response: {response.text}")
            else:
                print("No token found in response")
                
    except Exception as e:
        print(f"Error during login: {e}")

if __name__ == "__main__":
    test_authentication_format()
