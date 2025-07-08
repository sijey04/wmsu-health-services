import requests

print("Test 1: my-details endpoint")
try:
    r = requests.get('http://localhost:8000/api/staff-details/my-details/')
    print(f'Status: {r.status_code}')
except Exception as e:
    print(f'Error: {e}')

print("\nTest 2: base staff-details endpoint")
try:
    r = requests.get('http://localhost:8000/api/staff-details/')
    print(f'Status: {r.status_code}')
except Exception as e:
    print(f'Error: {e}')

print("\nTest 3: simple endpoint")
try:
    r = requests.get('http://localhost:8000/api/users/')
    print(f'Status: {r.status_code}')
except Exception as e:
    print(f'Error: {e}')
