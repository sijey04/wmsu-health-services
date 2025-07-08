import requests
import json

def test_endpoint_with_auth():
    print("Testing staff-details endpoint with authentication...")
    
    # First, let's test the login endpoint to get a valid token
    print("\n1. Testing login to get valid token...")
    login_url = 'http://localhost:8000/api/auth/login/'
    login_data = {
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    
    try:
        login_response = requests.post(login_url, json=login_data)
        print(f"Login Status: {login_response.status_code}")
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access_token')
            print(f"Login successful! Token: {token[:50]}...")
            
            # Now test the staff details endpoint
            print("\n2. Testing staff-details endpoint...")
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Test GET
            print("\n   Testing GET request...")
            get_response = requests.get('http://localhost:8000/api/staff-details/my-details/', headers=headers)
            print(f"   GET Status: {get_response.status_code}")
            print(f"   GET Response: {get_response.text}")
            
            # Test PUT  
            print("\n   Testing PUT request...")
            put_data = {
                'full_name': 'Test User Updated',
                'position': 'Test Position',
                'license_number': 'LIC123',
                'ptr_number': 'PTR456',
                'phone_number': '1234567890',
                'assigned_campuses': 'a,b'
            }
            
            put_response = requests.put('http://localhost:8000/api/staff-details/my-details/', 
                                      headers=headers, json=put_data)
            print(f"   PUT Status: {put_response.status_code}")
            print(f"   PUT Response: {put_response.text}")
            
        else:
            print(f"Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_endpoint_with_auth()
