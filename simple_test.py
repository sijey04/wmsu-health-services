#!/usr/bin/env python3
"""
Simple test to verify medical lists API endpoints work
"""
import requests

BASE_URL = "http://localhost:8000/api"

def test_endpoints():
    """Test if the medical list endpoints are accessible"""
    endpoints = [
        '/admin-controls/comorbid_illnesses/',
        '/admin-controls/vaccinations/',
        '/admin-controls/past_medical_histories/',
        '/admin-controls/family_medical_histories/'
    ]
    
    print("Testing Medical Lists API Endpoints")
    print("=" * 50)
    
    for endpoint in endpoints:
        url = BASE_URL + endpoint
        try:
            response = requests.get(url, timeout=5)
            print(f"✓ {endpoint}: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"  Found {len(data)} items")
            elif response.status_code == 401:
                print("  Authentication required (expected)")
            elif response.status_code == 403:
                print("  Permission denied (expected)")
        except Exception as e:
            print(f"✗ {endpoint}: Error - {e}")
    
    print("\nTest completed!")

if __name__ == "__main__":
    test_endpoints()
