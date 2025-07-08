import requests
import json

# Test with a session that has authentication cookies
session = requests.Session()

def test_with_session():
    print("Testing medical documents API with session...")
    
    # You'll need to manually log in through the browser first at http://localhost:3000/login
    # Then come back and run this script
    
    # Test the API endpoint with session cookies
    url = "http://localhost:8000/api/medical-documents/"
    
    try:
        # First try without cookies
        print("\n1. Testing without authentication:")
        response = requests.get(url)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            print("   ✅ Properly requires authentication")
        
        # Instructions for manual testing
        print("\n2. Manual testing instructions:")
        print("   - Open http://localhost:3000/login in your browser")
        print("   - Log in as an admin user")
        print("   - Go to http://localhost:3000/admin/medical-documents")
        print("   - Open browser developer tools (F12)")
        print("   - Go to Console tab")
        print("   - Run this command:")
        print("     fetch('/api/medical-documents/', {")
        print("       headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }")
        print("     }).then(r => r.json()).then(data => console.log(data))")
        print("\n   This will show you the actual API response with patient data.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_with_session()
