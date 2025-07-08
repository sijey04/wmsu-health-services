import requests
import json

def test_user_endpoint():
    print("Testing user authentication with current token...")
    
    # Test with the token format from the frontend logs
    # This is a sample token - you'll need to replace with your actual token
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM2MTc3MjQ2LCJpYXQiOjE3MzYxNzM2NDYsImp0aSI6IjkzNjU5ZGYxOGVmNjQ2NzE5ZGUzNjZmNWNlNjA3MjA2IiwidXNlcl9pZCI6MX0.a5-gYjlhQQgqfvZNzNEhE0vvYnPLZ4jGVFHcBvJnPyU"
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print("\n1. Testing /api/users/me/ endpoint...")
    try:
        response = requests.get('http://localhost:8000/api/users/me/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"User ID: {user_data.get('id')}")
            print(f"Email: {user_data.get('email')}")
            print(f"Is Staff: {user_data.get('is_staff')}")
            print(f"User Type: {user_data.get('user_type')}")
            
        elif response.status_code == 401:
            print("✗ Token is invalid or expired")
        else:
            print(f"? Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")
        
    print("\n2. Testing /api/staff-details/my-details/ endpoint...")
    try:
        response = requests.get('http://localhost:8000/api/staff-details/my-details/', headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 401:
            print("✗ Token is invalid or expired")
        elif response.status_code == 404:
            print("✗ Endpoint not found - possible server issue")
        elif response.status_code == 200:
            print("✓ Endpoint working correctly")
        else:
            print(f"? Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_user_endpoint()
