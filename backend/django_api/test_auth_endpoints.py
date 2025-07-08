#!/usr/bin/env python
"""
Test script to verify endpoints with authentication
"""

import requests
import json

base_url = "http://127.0.0.1:8000/api"

def test_with_auth():
    """Test endpoints with authentication"""
    
    # First, try to create a test user and login
    signup_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "confirm_password": "testpass123", 
        "first_name": "Test",
        "last_name": "User",
        "user_type": "admin"
    }
    
    print("Creating test user...")
    try:
        response = requests.post(f"{base_url}/auth/signup/", json=signup_data)
        print(f"Signup response: {response.status_code}")
        if response.status_code not in [200, 201, 400]:  # 400 might mean user exists
            print("Response:", response.text)
    except Exception as e:
        print(f"Signup error: {e}")
    
    # Try to login
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    print("Logging in...")
    try:
        response = requests.post(f"{base_url}/auth/login/", json=login_data)
        print(f"Login response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"Got token: {token[:20]}..." if token else "No token")
            
            # Test endpoints with token
            if token:
                headers = {'Authorization': f'Bearer {token}'}
                
                print("\nTesting with authentication...")
                
                # Test profile requirements
                response = requests.get(f"{base_url}/admin-controls/profile_requirements/", headers=headers)
                print(f"Profile requirements: {response.status_code}")
                
                # Test update endpoint
                response = requests.post(f"{base_url}/admin-controls/profile_requirements/update_profile_requirements/", 
                                       headers=headers, json={'requirements': []})
                print(f"Update profile requirements: {response.status_code}")
                
        else:
            print("Login failed:", response.text)
    except Exception as e:
        print(f"Login error: {e}")

if __name__ == "__main__":
    test_with_auth()
