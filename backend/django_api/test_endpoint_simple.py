import requests
import json

def test_endpoint_simple():
    print("Testing staff-details endpoint directly...")
    
    # Test without auth to confirm the endpoint exists
    print("\n1. Testing endpoint without auth (should return 401)...")
    try:
        response = requests.get('http://localhost:8000/api/staff-details/my-details/')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✓ Endpoint exists and requires authentication")
        elif response.status_code == 404:
            print("✗ Endpoint not found - Django server not running latest code")
        else:
            print(f"? Unexpected status code: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")
        
    # Test other endpoints to make sure server is running
    print("\n2. Testing other endpoints...")
    try:
        response = requests.get('http://localhost:8000/api/users/')
        print(f"Users endpoint status: {response.status_code}")
        
        response = requests.get('http://localhost:8000/api/staff-details/')
        print(f"Staff-details list endpoint status: {response.status_code}")
        
    except Exception as e:
        print(f"Error testing other endpoints: {e}")

if __name__ == '__main__':
    test_endpoint_simple()
