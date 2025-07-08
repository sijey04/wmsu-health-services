import requests

print("Testing staff-management endpoint:")
try:
    response = requests.get('http://localhost:8000/api/staff-management/')
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
except Exception as e:
    print(f'Error: {e}')
