import requests
import json

def test_simple_endpoint():
    print("Testing staff-details/my-details endpoint with simple request...")
    
    base_url = 'http://localhost:8000'
    
    # First test without authorization to see what happens
    print("\n--- Testing without authorization ---")
    try:
        response = requests.get(f'{base_url}/api/staff-details/my-details/')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Test with a dummy token to see if the endpoint exists
    print("\n--- Testing with dummy token ---")
    headers = {
        'Authorization': 'Bearer dummy_token',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f'{base_url}/api/staff-details/my-details/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_simple_endpoint()
