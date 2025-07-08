#!/usr/bin/env python
import requests
import json

# Test the exact URL from the frontend
url = "http://localhost:8000/api/staff-details/my-details/"
print(f"Testing URL: {url}")

# Test without authentication first
print("\n1. Testing without authentication:")
try:
    response = requests.get(url)
    print(f"GET Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"GET Error: {e}")

try:
    response = requests.put(url)
    print(f"PUT Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"PUT Error: {e}")

# Test the base staff-details endpoint
print("\n2. Testing base staff-details endpoint:")
base_url = "http://localhost:8000/api/staff-details/"
try:
    response = requests.get(base_url)
    print(f"GET Base Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"GET Base Error: {e}")

print("\n3. Testing staff-details endpoint without trailing slash:")
base_url_no_slash = "http://localhost:8000/api/staff-details"
try:
    response = requests.get(base_url_no_slash)
    print(f"GET Base (no slash) Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"GET Base (no slash) Error: {e}")

print("\n4. Testing my-details endpoint without trailing slash:")
url_no_slash = "http://localhost:8000/api/staff-details/my-details"
try:
    response = requests.get(url_no_slash)
    print(f"GET (no slash) Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"GET (no slash) Error: {e}")
