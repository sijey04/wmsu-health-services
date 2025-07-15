import requests
import json

# Test dental waiver endpoints
BASE_URL = 'http://localhost:8000/api'

def test_dental_waiver_endpoints():
    print("Testing Dental Waiver Endpoints...")
    
    # Test 1: Check if dental waiver endpoints are available
    try:
        response = requests.get(f'{BASE_URL}/dental-waivers/')
        print(f"GET /dental-waivers/ - Status: {response.status_code}")
        if response.status_code == 200:
            print("✓ Dental waiver endpoint is accessible")
        else:
            print(f"✗ Error: {response.text}")
    except Exception as e:
        print(f"✗ Connection error: {e}")
    
    # Test 2: Check the check_status endpoint
    try:
        response = requests.get(f'{BASE_URL}/dental-waivers/check_status/')
        print(f"GET /dental-waivers/check_status/ - Status: {response.status_code}")
        if response.status_code in [200, 401]:  # 401 is expected without auth
            print("✓ Check status endpoint is accessible")
        else:
            print(f"✗ Error: {response.text}")
    except Exception as e:
        print(f"✗ Connection error: {e}")

if __name__ == '__main__':
    test_dental_waiver_endpoints()
