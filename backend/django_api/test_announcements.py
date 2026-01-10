"""
Test script for the Announcements API
Run this after logging in to test the announcement endpoints
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api"
# Replace with your actual token after logging in
TOKEN = "your_access_token_here"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_list_announcements():
    """Test listing all announcements"""
    print("\n=== Testing: List All Announcements ===")
    response = requests.get(f"{BASE_URL}/announcements/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"Found {len(data)} announcements:")
        for ann in data:
            print(f"  - {ann['title']} (Priority: {ann['priority']})")
    else:
        print(f"Error: {response.text}")

def test_unviewed_announcements():
    """Test getting unviewed announcements"""
    print("\n=== Testing: Get Unviewed Announcements ===")
    response = requests.get(f"{BASE_URL}/announcements/unviewed/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"Found {len(data)} unviewed announcements:")
        for ann in data:
            print(f"  - {ann['title']} (ID: {ann['id']}, Priority: {ann['priority']}, Icon: {ann['icon']})")
        return data
    else:
        print(f"Error: {response.text}")
        return []

def test_mark_viewed(announcement_id):
    """Test marking an announcement as viewed"""
    print(f"\n=== Testing: Mark Announcement {announcement_id} as Viewed ===")
    response = requests.post(
        f"{BASE_URL}/announcements/{announcement_id}/mark_viewed/",
        headers=headers
    )
    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"Success: {data['message']}")
        print(f"Viewed at: {data.get('viewed_at')}")
    else:
        print(f"Error: {response.text}")

def run_all_tests():
    """Run all test functions"""
    print("=" * 60)
    print("ANNOUNCEMENTS API TEST SUITE")
    print("=" * 60)
    
    # Test 1: List all announcements
    test_list_announcements()
    
    # Test 2: Get unviewed announcements
    unviewed = test_unviewed_announcements()
    
    # Test 3: Mark first unviewed announcement as viewed (if any)
    if unviewed and len(unviewed) > 0:
        test_mark_viewed(unviewed[0]['id'])
        
        # Test 4: Check unviewed again (should be one less)
        print("\n=== Testing: Verify Announcement Marked as Viewed ===")
        test_unviewed_announcements()
    
    print("\n" + "=" * 60)
    print("TESTS COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    print("\nIMPORTANT: Replace TOKEN variable with your actual access token")
    print("To get your token:")
    print("1. Open browser dev tools (F12)")
    print("2. Go to Application/Storage > Local Storage")
    print("3. Find 'access_token' key")
    print("4. Copy the value and paste it in this script\n")
    
    if TOKEN == "your_access_token_here":
        print("ERROR: Please set your access token in the TOKEN variable before running tests")
    else:
        run_all_tests()
