#!/usr/bin/env python
"""
Test script to verify the new endpoints are working
"""

import requests
import json

base_url = "http://127.0.0.1:8000/api"

def test_endpoint(endpoint, method='GET', data=None):
    """Test an endpoint and return response"""
    url = f"{base_url}/{endpoint}"
    
    try:
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=data)
        
        print(f"{method} {url}: {response.status_code}")
        return response.status_code == 200 or response.status_code == 201
    except Exception as e:
        print(f"Error testing {endpoint}: {e}")
        return False

# Test the new endpoints
print("Testing new endpoints...")

# Test admin-controls endpoints
print("\n=== Admin Controls Endpoints ===")
test_endpoint("admin-controls/profile_requirements/")
test_endpoint("admin-controls/document_requirements/")
test_endpoint("admin-controls/campus_schedules/")
test_endpoint("admin-controls/dentist_schedules/")

# Test the new bulk update endpoints
print("\n=== Bulk Update Endpoints ===")
test_endpoint("admin-controls/profile_requirements/update_profile_requirements/", 'POST', {'requirements': []})
test_endpoint("admin-controls/document_requirements/update_document_requirements/", 'POST', {'requirements': []})
test_endpoint("admin-controls/campus_schedules/update_campus_schedules/", 'POST', {'schedules': []})
test_endpoint("admin-controls/dentist_schedules/update_dentist_schedules/", 'POST', {'schedules': []})

# Test medical list endpoints
print("\n=== Medical List Endpoints ===")
test_endpoint("user-management/comorbid_illnesses/")
test_endpoint("user-management/vaccinations/")
test_endpoint("user-management/past_medical_histories/")
test_endpoint("user-management/family_medical_histories/")

# Test the new create/update endpoints
print("\n=== Create/Update Endpoints ===")
test_endpoint("user-management/comorbid_illnesses/create_comorbid_illness/", 'POST', {'label': 'Test', 'is_enabled': True})
test_endpoint("user-management/vaccinations/create_vaccination/", 'POST', {'name': 'Test', 'is_enabled': True})
test_endpoint("user-management/past_medical_histories/create_past_medical_history/", 'POST', {'name': 'Test', 'is_enabled': True})
test_endpoint("user-management/family_medical_histories/create_family_medical_history/", 'POST', {'name': 'Test', 'is_enabled': True})

# Test academic year bulk update
print("\n=== Academic Year Endpoints ===")
test_endpoint("academic-school-years/")
test_endpoint("academic-school-years/bulk_update/", 'POST', {'years': []})

print("\nEndpoint testing complete!")
