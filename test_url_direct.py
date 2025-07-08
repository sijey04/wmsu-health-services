#!/usr/bin/env python
import os
import sys
import django
import requests

# Add the project directory to the Python path
sys.path.append('c:/xampp/htdocs/wmsuhealthservices/backend/django_api')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

# Test the endpoint directly
base_url = "http://localhost:8000"
endpoint = f"{base_url}/api/appointments/49/view_form_data/"

print(f"Testing endpoint: {endpoint}")

# You'll need to add a valid token here
# For now, let's just test if the endpoint exists
try:
    response = requests.get(endpoint)
    print(f"Status code: {response.status_code}")
    print(f"Response: {response.text[:500]}...")
except Exception as e:
    print(f"Error: {e}")

# Also test the base appointments endpoint
try:
    base_endpoint = f"{base_url}/api/appointments/"
    response = requests.get(base_endpoint)
    print(f"\nBase appointments endpoint status: {response.status_code}")
except Exception as e:
    print(f"Error testing base endpoint: {e}")
