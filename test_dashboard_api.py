#!/usr/bin/env python3

import requests
import json

# Test the dashboard statistics endpoint
def test_dashboard_api():
    # First, try to get a token by logging in
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {
        "email": "testadmin@example.com",
        "password": "testadmin123"
    }
    
    try:
        print("Testing login...")
        login_response = requests.post(login_url, json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            print(f"Token obtained: {token[:20]}...")
            
            # Test dashboard statistics
            dashboard_url = "http://localhost:8000/api/admin-controls/dashboard_statistics/"
            headers = {"Authorization": f"Bearer {token}"}
            
            print("Testing dashboard statistics...")
            dashboard_response = requests.get(dashboard_url, headers=headers)
            print(f"Dashboard status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                stats = dashboard_response.json()
                print("Dashboard statistics:")
                print(json.dumps(stats, indent=2))
                return True
            else:
                print(f"Dashboard error: {dashboard_response.text}")
                return False
        else:
            print(f"Login failed: {login_response.text}")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = test_dashboard_api()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")
