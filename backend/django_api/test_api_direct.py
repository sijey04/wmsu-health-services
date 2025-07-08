#!/usr/bin/env python
import os
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from django.http import JsonResponse
from django.test import Client

def test_api_endpoint():
    """Test if the API endpoint is working"""
    client = Client()
    
    try:
        # Test a simple endpoint
        response = client.get('/api/academic-school-years/current/')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.content[:200]}...")
        
        if response.status_code == 200:
            print("✓ API endpoint is working")
        else:
            print("✗ API endpoint has issues")
            
    except Exception as e:
        print(f"Error testing endpoint: {e}")

if __name__ == "__main__":
    test_api_endpoint()
