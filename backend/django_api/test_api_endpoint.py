#!/usr/bin/env python3
"""
Quick test of the my_documents endpoint
"""
import requests
import json

def test_endpoint():
    """Test the my_documents endpoint with authentication"""
    
    # First, let's test login
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        # Test login endpoint
        login_response = requests.post('http://localhost:8000/api/auth/login/', json=login_data)
        print(f"Login status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access_token')
            print(f"Got token: {token[:20]}..." if token else "No token")
            
            if token:
                # Test my_documents endpoint
                headers = {'Authorization': f'Bearer {token}'}
                response = requests.get('http://localhost:8000/api/medical-documents/my_documents/', headers=headers)
                print(f"my_documents status: {response.status_code}")
                
                if response.status_code == 200:
                    print("✓ my_documents endpoint working!")
                    data = response.json()
                    print(f"Response keys: {list(data.keys())}")
                else:
                    print(f"✗ my_documents error: {response.text}")
        else:
            print(f"Login failed: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to Django server. Is it running?")
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    test_endpoint()
