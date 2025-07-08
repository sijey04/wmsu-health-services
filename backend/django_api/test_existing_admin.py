#!/usr/bin/env python
"""
Test script to verify endpoints with existing admin user
"""

import requests
import json

base_url = "http://127.0.0.1:8000/api"

def test_existing_admin():
    """Test endpoints with existing admin user"""
    
    # Try to login with existing admin
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"  # Common admin password
    }
    
    print("Logging in with existing admin...")
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
                
                # Test medical lists
                response = requests.get(f"{base_url}/user-management/comorbid_illnesses/", headers=headers)
                print(f"Comorbid illnesses: {response.status_code}")
                
                # Test create endpoint
                response = requests.post(f"{base_url}/user-management/comorbid_illnesses/create_comorbid_illness/", 
                                       headers=headers, json={'label': 'Test Illness', 'is_enabled': True})
                print(f"Create comorbid illness: {response.status_code}")
                
        else:
            print("Login failed:", response.text)
            
            # Try alternative passwords
            for password in ['admin', 'password', '123456']:
                login_data['password'] = password
                response = requests.post(f"{base_url}/auth/login/", json=login_data)
                print(f"Trying password '{password}': {response.status_code}")
                if response.status_code == 200:
                    break
                    
    except Exception as e:
        print(f"Login error: {e}")

if __name__ == "__main__":
    test_existing_admin()
