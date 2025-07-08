#!/usr/bin/env python
"""
Test script to check available staff-details endpoints
"""
import requests

def check_staff_endpoints():
    base_url = "http://localhost:8000/api/staff-details/"
    
    print("Testing staff-details endpoints...")
    
    # Test the base endpoint
    try:
        response = requests.get(base_url, timeout=5)
        print(f"Base endpoint status: {response.status_code}")
        print(f"Base response: {response.text[:200]}...")
    except Exception as e:
        print(f"Base endpoint error: {e}")
    
    # Test my-details endpoint
    try:
        my_details_url = base_url + "my-details/"
        response = requests.get(my_details_url, timeout=5)
        print(f"My-details endpoint status: {response.status_code}")
        print(f"My-details response: {response.text[:200]}...")
    except Exception as e:
        print(f"My-details endpoint error: {e}")
    
    # Test with different variations
    variations = [
        "my_details/",
        "my-details/",
        "mydetails/",
    ]
    
    for variation in variations:
        try:
            url = base_url + variation
            response = requests.get(url, timeout=5)
            print(f"Variation '{variation}' status: {response.status_code}")
        except Exception as e:
            print(f"Variation '{variation}' error: {e}")

if __name__ == "__main__":
    check_staff_endpoints()
