#!/usr/bin/env python
"""
Test script to check the dashboard statistics endpoint with authentication
"""
import requests
import json

def test_dashboard_with_auth():
    # First, let's try to login to get a token
    login_url = "http://localhost:8000/api/auth/login/"
    dashboard_url = "http://localhost:8000/api/admin-controls/system_configuration/dashboard_statistics/"
    
    # Test login with admin credentials (you may need to adjust these)
    login_data = {
        "email": "admin@example.com",  # Adjust as needed
        "password": "admin123"  # Adjust as needed
    }
    
    try:
        print("Testing dashboard endpoint...")
        
        # Try to access dashboard without auth first
        response = requests.get(dashboard_url, timeout=10)
        print(f"Without auth - Status: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        # Try to login
        print("\nTrying to login...")
        login_response = requests.post(login_url, json=login_data, timeout=10)
        print(f"Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            token = token_data.get('access_token') or token_data.get('access')
            
            if token:
                print(f"Got token: {token[:20]}...")
                
                # Try dashboard with auth
                headers = {'Authorization': f'Bearer {token}'}
                auth_response = requests.get(dashboard_url, headers=headers, timeout=10)
                print(f"With auth - Status: {auth_response.status_code}")
                print(f"Response: {auth_response.text[:500]}...")
            else:
                print("No token in login response")
                print(f"Login response: {login_response.text}")
        else:
            print(f"Login failed: {login_response.text}")
            
        # Let's also try without specific credentials to see the error
        print("\nTesting with dummy token...")
        headers = {'Authorization': 'Bearer dummy_token'}
        dummy_response = requests.get(dashboard_url, headers=headers, timeout=10)
        print(f"Dummy auth - Status: {dummy_response.status_code}")
        print(f"Response: {dummy_response.text[:500]}...")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_dashboard_with_auth()
