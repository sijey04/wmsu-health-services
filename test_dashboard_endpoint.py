#!/usr/bin/env python
"""
Quick test to verify dashboard statistics endpoint is working
"""
import requests
import json

# Test the dashboard statistics endpoint
def test_dashboard_endpoint():
    url = "http://localhost:8000/api/admin-controls/system_configuration/dashboard_statistics/"
    
    try:
        # First, let's try without authentication to see if endpoint exists
        response = requests.get(url, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✓ Endpoint exists but requires authentication (expected)")
        elif response.status_code == 404:
            print("✗ Endpoint not found (404)")
        else:
            print(f"✓ Endpoint responded with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to Django server. Make sure it's running on port 8000")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_dashboard_endpoint()
