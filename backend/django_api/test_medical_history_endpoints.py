#!/usr/bin/env python
"""
Test script to verify the medical history endpoints work correctly
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(url, method="GET", data=None, token=None):
    """Test an endpoint and return response"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{url}", headers=headers)
        elif method == "POST":
            response = requests.post(f"{BASE_URL}{url}", json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(f"{BASE_URL}{url}", json=data, headers=headers)
        
        print(f"{method} {url}: {response.status_code}")
        if response.status_code >= 400:
            print(f"  Response: {response.text}")
        return response
    except Exception as e:
        print(f"Error testing {url}: {e}")
        return None

def main():
    print("Testing Medical History Endpoints")
    print("=" * 50)
    
    # Test the new endpoints (these should return 401 without auth, but shouldn't 404)
    print("\nTesting Past Medical History Endpoints:")
    test_endpoint("/api/user-management/past_medical_histories/create_past_medical_history/", "POST", {"name": "Test", "is_enabled": True})
    test_endpoint("/api/user-management/past_medical_histories/update_past_medical_history/", "PUT", {"id": 1, "is_enabled": False})
    
    print("\nTesting Family Medical History Endpoints:")
    test_endpoint("/api/user-management/family_medical_histories/create_family_medical_history/", "POST", {"name": "Test", "is_enabled": True})
    test_endpoint("/api/user-management/family_medical_histories/update_family_medical_history/", "PUT", {"id": 1, "is_enabled": False})
    
    print("\nTesting existing endpoints for comparison:")
    test_endpoint("/api/user-management/vaccinations/create_vaccination/", "POST", {"name": "Test", "is_enabled": True})
    test_endpoint("/api/user-management/comorbid_illnesses/create_comorbid_illness/", "POST", {"label": "Test", "is_enabled": True})

if __name__ == "__main__":
    main()
